import {Router} from 'express';
import {createRentalHandlers, RentalHandlerDeps} from '../handlers/rental.handler';

/**
 * House rental (P2P) routes.
 *
 * Public:
 * - GET    /config            - fee and limits for the UI
 * - GET    /listings          - browse available houses (filters + sorting)
 *
 * Player-authenticated (Bearer JWT from ap-login):
 * - POST   /listings          - list a house for rent
 * - PATCH  /listings/:id      - change the daily price
 * - DELETE /listings/:id      - unlist
 * - POST   /rent              - rent for N days (first day charged upfront)
 * - POST   /cancel            - give up the rental early (penalty applies)
 * - GET    /me/listings       - my houses and earnings
 * - GET    /me/rental         - my active rental
 * - GET    /me/balance        - my in-game balance
 */
export function createRentalRoutes(deps: RentalHandlerDeps): Router {
    const router = Router();
    const handlers = createRentalHandlers(deps);

    router.get('/config', handlers.config);
    router.get('/listings', handlers.search);
    router.post('/listings', handlers.createListing);
    router.patch('/listings/:id', handlers.updateListing);
    router.delete('/listings/:id', handlers.deleteListing);
    router.post('/rent', handlers.rent);
    router.post('/cancel', handlers.cancel);
    router.get('/me/listings', handlers.myListings);
    router.get('/me/rental', handlers.myRental);
    router.get('/me/balance', handlers.myBalance);

    return router;
}
