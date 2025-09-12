import {Router} from "express";
import {gigCreate} from "../controllers/create";
import {gigUpdate, gigUpdateActive} from "../controllers/update";
import {gigDelete} from "../controllers/delete";

const router: Router = Router();

export const gigRoutes = (): Router => {
    router.post('/create', gigCreate);
    router.put('/:gigId', gigUpdate);
    router.put('/active/:gigId', gigUpdateActive)
    router.delete('/:gigId/:sellerId', gigDelete);
    return router;
}
