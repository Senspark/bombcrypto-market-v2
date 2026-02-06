// Re-export with explicit names to avoid conflicts
export {
    createUserHandlers,
    createDecodeHandler,
    createGetHistoryHandler,
    UserHandlerDeps,
} from './user.handler';

export {
    createHeroHandlers,
    createSearchHandler as createHeroSearchHandler,
    createStatsHandler as createHeroStatsHandler,
    createBurnHandler as createHeroBurnHandler,
    createVersionHandler as createHeroVersionHandler,
    HeroHandlerDeps,
} from './hero.handler';

export {
    createHouseHandlers,
    createSearchHandler as createHouseSearchHandler,
    createStatsHandler as createHouseStatsHandler,
    createBurnHandler as createHouseBurnHandler,
    HouseHandlerDeps,
} from './house.handler';

export {
    createAdminHandlers,
    createClearCacheHandler,
    createGetProcessingBlockNumbersHandler,
    AdminHandlerDeps,
} from './admin.handler';
