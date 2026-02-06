/**
 * Unified Entry Point
 *
 * Routes to the appropriate service based on the ENTRY_POINT environment variable.
 * Valid values: 'api', 'hero', 'house'
 */

import {runApi} from './api/main';
import {runHeroSubscriber} from './hero-subscriber/main';
import {runHouseSubscriber} from './house-subscriber/main';

const ENTRY_POINT = process.env.ENTRY_POINT;

async function main(): Promise<void> {
    switch (ENTRY_POINT) {
        case 'api':
            await runApi();
            break;
        case 'hero':
            await runHeroSubscriber();
            break;
        case 'house':
            await runHouseSubscriber();
            break;
        default:
            console.error(`Error: ENTRY_POINT must be 'api', 'hero', or 'house'. Got: ${ENTRY_POINT}`);
            process.exit(1);
    }
}

main();
