import {Router} from "express";
import {gig} from "../controllers/create";

const router: Router = Router();

export const gigRoutes = (): Router => {
    router.post('/create', gig);
    return router;
}
