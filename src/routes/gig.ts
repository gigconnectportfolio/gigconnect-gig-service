import {Router} from "express";
import {gigCreate} from "../controllers/create";
import {gigUpdate, gigUpdateActive} from "../controllers/update";
import {gigDelete} from "../controllers/delete";
import {
    gigById,
    gigsByCategory,
    moreLikeThis,
    SellerGigs,
    sellerInactiveGigs,
    topRatedGigsByCategory
} from "../controllers/get";
import {gigs} from "../controllers/search";

const router: Router = Router();

export const gigRoutes = (): Router => {
    router.get('/:gigId', gigById);
    router.get('/seller/:sellerId', SellerGigs);
    router.get('/seller/pause/:sellerId', sellerInactiveGigs);
    router.get('/search/:from/:size/:type', gigs);
    router.get('/category/:username', gigsByCategory);
    router.get('/top/:username', topRatedGigsByCategory);
    router.get('/similar/:gigId', moreLikeThis)
    router.post('/create', gigCreate);
    router.put('/:gigId', gigUpdate);
    router.put('/active/:gigId', gigUpdateActive)
    router.delete('/:gigId/:sellerId', gigDelete);
    return router;
}
