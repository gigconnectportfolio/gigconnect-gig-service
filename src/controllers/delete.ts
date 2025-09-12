import {deleteGig} from "../services/gig.service";
import {StatusCodes} from "http-status-codes";
import {NextFunction, Request, Response} from "express";

export const gigDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await deleteGig(req.params.gigId, req.params.sellerId);
        res.status(StatusCodes.OK).json({ message: 'Gig deleted successfully' });
    } catch (error) {
        next(error);
    }
}
