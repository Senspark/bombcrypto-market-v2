import * as cron from 'node-cron';
import {Logger} from '@/utils/logger';
import {IRentalRepository} from '@/repositories/rental.repository';
import {IRentalService, parseRentalDbErrorCode} from '@/services/rental.service';
import {RentalErrorCode, RentalEvent, RentalRow, RentalStatus} from '@/domain/models/rental';

const BATCH_SIZE = 200;

export interface RentalChargeJob {
    start(): void;

    stop(): void;

    /** Exposed so it can be triggered manually (tests, admin tooling). */
    runOnce(): Promise<void>;
}

/**
 * Daily upfront rent collection.
 *
 * Runs on a schedule (default every 5 minutes) because each contract's 24h cycle
 * starts when it was rented - renewals fall at all hours, not at midnight.
 * For every contract whose cycle has elapsed:
 *   1. sold on-chain (flagged)  -> end as ENDED_SOLD (listing cancelled)
 *   2. all days already paid    -> end as ENDED_COMPLETED (listing released)
 *   3. owner changed on-chain   -> end as ENDED_SOLD
 *   4. otherwise                -> charge the next day (CHARGED)
 *   5. renter out of funds      -> end as ENDED_NO_FUNDS (listing released)
 */
export function createRentalChargeJob(
    repository: IRentalRepository,
    service: IRentalService,
    cronExpression: string,
    logger: Logger
): RentalChargeJob {
    let task: cron.ScheduledTask | null = null;
    let running = false;

    async function endRental(rental: RentalRow, status: string, releaseListing: boolean,
                             event: string): Promise<void> {
        await repository.endRental(rental.id, status, releaseListing);
        await service.publishEvent({
            event,
            rental_id: rental.id,
            listing_id: rental.listing_id,
            house_id: rental.house_id,
            type: rental.type,
            owner_uid: rental.owner_uid,
            renter_uid: rental.renter_uid,
        });
        logger.info(`Rental ${rental.id} ended: ${status}`);
    }

    async function wasSoldOnChain(rental: RentalRow): Promise<boolean> {
        const [ownerWallet, chainOwner] = await Promise.all([
            repository.findWalletByUid(rental.owner_uid),
            service.getHouseOwnerOnChain(rental.house_id),
        ]);

        // No reliable answer (RPC down, account without wallet): do not end the
        // contract on suspicion - worst case is one extra day, and the check
        // repeats on the next cycle.
        if (!chainOwner || !ownerWallet) {
            return false;
        }
        return chainOwner !== ownerWallet;
    }

    async function processRental(rental: RentalRow, fee: number): Promise<void> {
        // Sale already detected by the game sync: the paid day was honoured,
        // now the contract ends and the buyer can use the house.
        if (rental.interrupted_by_sale) {
            await endRental(rental, RentalStatus.ENDED_SOLD, false, RentalEvent.ENDED_SOLD);
            return;
        }

        if (rental.days_paid >= rental.total_days) {
            await endRental(rental, RentalStatus.ENDED_COMPLETED, true, RentalEvent.ENDED_COMPLETED);
            return;
        }

        // Anti-fraud: covers a sale that happened while both players were
        // offline, when no in-game house sync would have run.
        if (await wasSoldOnChain(rental)) {
            await repository.markInterruptedBySale(rental.id);
            await endRental(rental, RentalStatus.ENDED_SOLD, false, RentalEvent.ENDED_SOLD);
            return;
        }

        try {
            const dayNumber = await repository.chargeRentalDay(rental.id, fee);
            await service.publishEvent({
                event: RentalEvent.CHARGED,
                rental_id: rental.id,
                house_id: rental.house_id,
                type: rental.type,
                owner_uid: rental.owner_uid,
                renter_uid: rental.renter_uid,
                day_number: dayNumber,
                amount: rental.price_per_day,
                pay_token: rental.pay_token,
            });
            logger.info(`Rental ${rental.id}: charged day ${dayNumber}/${rental.total_days}`);
        } catch (err) {
            const code = parseRentalDbErrorCode(err);

            // Out of funds: the contract ends, with no debt and no back-charge.
            if (code === RentalErrorCode.NOT_ENOUGH_BALANCE) {
                logger.info(`Rental ${rental.id}: renter out of funds, ending`);
                await endRental(rental, RentalStatus.ENDED_NO_FUNDS, true, RentalEvent.ENDED_NO_FUNDS);
                return;
            }

            // Another run already handled this cycle.
            if (code === RentalErrorCode.PERIOD_NOT_DUE || code === RentalErrorCode.ALREADY_FULLY_PAID) {
                logger.info(`Rental ${rental.id}: already handled by another run`);
                return;
            }
            throw err;
        }
    }

    async function runOnce(): Promise<void> {
        // Avoid overlapping runs if a cycle takes longer than the interval
        if (running) {
            logger.info('Rental charge job still running, skipping this tick');
            return;
        }
        running = true;

        try {
            const due = await repository.findRentalsDueForCharge(BATCH_SIZE);
            if (due.length === 0) {
                return;
            }

            logger.info(`Processing ${due.length} rental(s) due for charge`);
            const {fee} = await service.getSettings();

            for (const rental of due) {
                try {
                    await processRental(rental, fee);
                } catch (err) {
                    logger.error(`Rental ${rental.id} failed:`, err);
                }
            }
        } catch (err) {
            logger.error('Rental charge job failed:', err);
        } finally {
            running = false;
        }
    }

    return {
        start(): void {
            if (task) {
                return;
            }
            if (!cron.validate(cronExpression)) {
                logger.error(`Invalid rental charge cron expression: ${cronExpression}`);
                return;
            }
            task = cron.schedule(cronExpression, () => {
                runOnce().catch((err) => logger.error('Rental charge job error:', err));
            });
            logger.info(`Rental charge job scheduled: ${cronExpression}`);
        },

        stop(): void {
            task?.stop();
            task = null;
        },

        runOnce,
    };
}
