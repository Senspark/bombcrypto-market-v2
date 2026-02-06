/**
 * Event Parser
 * Parses blockchain events from market contracts (CreateOrder, Sold, CancelOrder)
 */

import {id as keccak256, Interface, Log, LogDescription} from 'ethers';
import BHeroMarketABI from '../contracts/abis/bhero-market.json';
import BHouseMarketABI from '../contracts/abis/bhouse-market.json';

/**
 * Event topic hashes (keccak256 of event signatures)
 */
export const EVENT_TOPICS = {
    CREATE_ORDER: keccak256('CreateOrder(uint256,uint256,uint256,address)'),
    SOLD: keccak256('Sold(uint256,uint256,uint256,address,address)'),
    CANCEL_ORDER: keccak256('CancelOrder(uint256)'),
} as const;

/**
 * All market event topics for filtering
 */
export const ALL_MARKET_TOPICS = [
    EVENT_TOPICS.CREATE_ORDER,
    EVENT_TOPICS.SOLD,
    EVENT_TOPICS.CANCEL_ORDER,
];

/**
 * Event types
 */
export type MarketEventType = 'CreateOrder' | 'Sold' | 'CancelOrder';

/**
 * CreateOrder event data
 */
export interface CreateOrderEvent {
    type: 'CreateOrder';
    tokenId: bigint;
    price: bigint;
    tokenDetail: bigint;
    seller: string;
    transactionHash: string;
    blockNumber: number;
    logIndex: number;
}

/**
 * Sold event data
 */
export interface SoldEvent {
    type: 'Sold';
    tokenId: bigint;
    price: bigint;
    tokenDetail: bigint;
    seller: string;
    buyer: string;
    transactionHash: string;
    blockNumber: number;
    logIndex: number;
}

/**
 * CancelOrder event data
 */
export interface CancelOrderEvent {
    type: 'CancelOrder';
    tokenId: bigint;
    transactionHash: string;
    blockNumber: number;
    logIndex: number;
}

/**
 * Union type for all market events
 */
export type MarketEvent = CreateOrderEvent | SoldEvent | CancelOrderEvent;

/**
 * EventParser for parsing market contract events
 */
export class EventParser {
    private readonly heroInterface: Interface;
    private readonly houseInterface: Interface;

    constructor() {
        this.heroInterface = new Interface(BHeroMarketABI);
        this.houseInterface = new Interface(BHouseMarketABI);
    }

    /**
     * Parse a log into a typed market event
     * Returns null if the log is not a recognized market event
     */
    parseLog(log: Log, contractType: 'hero' | 'house' = 'hero'): MarketEvent | null {
        const iface = contractType === 'hero' ? this.heroInterface : this.houseInterface;

        try {
            const parsed = iface.parseLog({
                topics: log.topics as string[],
                data: log.data,
            });

            if (!parsed) return null;

            return this.convertToMarketEvent(parsed, log);
        } catch {
            // Not a recognized event
            return null;
        }
    }

    /**
     * Parse multiple logs into typed market events
     */
    parseLogs(logs: Log[], contractType: 'hero' | 'house' = 'hero'): MarketEvent[] {
        const events: MarketEvent[] = [];

        for (const log of logs) {
            const event = this.parseLog(log, contractType);
            if (event) {
                events.push(event);
            }
        }

        return events;
    }

    /**
     * Get the event type from a log topic
     */
    getEventType(log: Log): MarketEventType | null {
        const topic = log.topics[0];

        switch (topic) {
            case EVENT_TOPICS.CREATE_ORDER:
                return 'CreateOrder';
            case EVENT_TOPICS.SOLD:
                return 'Sold';
            case EVENT_TOPICS.CANCEL_ORDER:
                return 'CancelOrder';
            default:
                return null;
        }
    }

    /**
     * Check if a log is a CreateOrder event
     */
    isCreateOrder(log: Log): boolean {
        return log.topics[0] === EVENT_TOPICS.CREATE_ORDER;
    }

    /**
     * Check if a log is a Sold event
     */
    isSold(log: Log): boolean {
        return log.topics[0] === EVENT_TOPICS.SOLD;
    }

    /**
     * Check if a log is a CancelOrder event
     */
    isCancelOrder(log: Log): boolean {
        return log.topics[0] === EVENT_TOPICS.CANCEL_ORDER;
    }

    /**
     * Convert parsed log description to typed MarketEvent
     */
    private convertToMarketEvent(parsed: LogDescription, log: Log): MarketEvent | null {
        const baseData = {
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            logIndex: log.index,
        };

        switch (parsed.name) {
            case 'CreateOrder':
                return {
                    type: 'CreateOrder',
                    tokenId: parsed.args[0],
                    price: parsed.args[1],
                    tokenDetail: parsed.args[2],
                    seller: parsed.args[3],
                    ...baseData,
                };

            case 'Sold':
                return {
                    type: 'Sold',
                    tokenId: parsed.args[0],
                    price: parsed.args[1],
                    tokenDetail: parsed.args[2],
                    seller: parsed.args[3],
                    buyer: parsed.args[4],
                    ...baseData,
                };

            case 'CancelOrder':
                return {
                    type: 'CancelOrder',
                    tokenId: parsed.args[0],
                    ...baseData,
                };

            default:
                return null;
        }
    }
}

/**
 * Singleton instance of EventParser
 */
let eventParserInstance: EventParser | null = null;

/**
 * Get or create the EventParser singleton
 */
export function getEventParser(): EventParser {
    if (!eventParserInstance) {
        eventParserInstance = new EventParser();
    }
    return eventParserInstance;
}

/**
 * Factory function to create a new EventParser
 */
export function createEventParser(): EventParser {
    return new EventParser();
}
