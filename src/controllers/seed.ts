import { publishDirectMessage } from '../queues/gig.producer';
import { NextFunction, Request, Response } from 'express';
import { gigChannel } from '../server';
import { StatusCodes } from 'http-status-codes';

export const gigSeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { count } = req.params;
        await publishDirectMessage(
            gigChannel,
            'gigconnect-gig',
            'get-sellers',
            JSON.stringify({ type: 'getSellers', count: parseInt(count) }),
            'Message sent to users service to get sellers.'
        );
        res.status(StatusCodes.CREATED).json({ message: `Request to get ${count} sellers sent successfully` });
    } catch (error) {
        next(error);
    }
};
