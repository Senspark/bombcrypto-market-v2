// Base statistics structure
export interface StatsBase {
    countListing: number;
    countSold: number;
    volume: string;
    volumeBcoin: string;
    volumeSen: string;
}

// Full statistics with different time periods
export interface Stats {
    oneDay: StatsBase;
    sevenDays: StatsBase;
    thirtyDays: StatsBase;
}

// Create empty stats base
export function createEmptyStatsBase(): StatsBase {
    return {
        countListing: 0,
        countSold: 0,
        volume: '0',
        volumeBcoin: '0',
        volumeSen: '0',
    };
}

// Create empty stats
export function createEmptyStats(): Stats {
    return {
        oneDay: createEmptyStatsBase(),
        sevenDays: createEmptyStatsBase(),
        thirtyDays: createEmptyStatsBase(),
    };
}
