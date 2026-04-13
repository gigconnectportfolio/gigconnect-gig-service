import { NextFunction, Request, Response } from 'express';
import { gigCreateSchema } from '../schemes/gig';
import { BadRequestError, ISellerGig, uploads } from '@kariru-k/gigconnect-shared';
import { UploadApiResponse } from 'cloudinary';
import { createGig } from '../services/gig.service';
import { StatusCodes } from 'http-status-codes';
import { getDocumentCount } from '../elasticsearch';

export const gigCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { error } = await gigCreateSchema.validate(req.body);
        if (error?.details) {
            throw new BadRequestError(error.details[0].message, 'create gig() method error');
        }

        const result: UploadApiResponse = (await uploads(req.body.coverImage)) as UploadApiResponse;
        if (!result?.public_id) {
            throw new BadRequestError('File upload error', 'create gig() method error');
        }

        const count = await getDocumentCount('gigs');

        const gig: ISellerGig = {
            sellerId: req.body.sellerId,
            username: req.currentUser?.username,
            email: req.currentUser?.email,
            profilePicture: req.body.profilePicture,
            title: req.body.title,
            description: req.body.description,
            categories: req.body.categories,
            subCategories: req.body.subCategories,
            tags: req.body.tags,
            price: req.body.price,
            expectedDelivery: req.body.expectedDelivery,
            basicTitle: req.body.basicTitle,
            basicDescription: req.body.basicDescription,
            coverImage: `${result?.secure_url}`,
            sortId: count + 1
        };

        const createdGig = await createGig(gig);

        res.status(StatusCodes.CREATED).json({ message: 'Gig created successfully', gig: createdGig });
    } catch (error) {
        next(error);
    }
};
