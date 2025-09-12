import {NextFunction, Request, Response} from "express";
import {gigUpdateSchema} from "../schemes/gig";
import {BadRequestError, isDataURL, ISellerGig, uploads} from "@kariru-k/gigconnect-shared";
import {UploadApiResponse} from "cloudinary";
import {updateActiveGigProp, updateGig} from "../services/gig.service";
import {StatusCodes} from "http-status-codes";

export const gigUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { error } = await gigUpdateSchema.validate(req.body);
        if (error?.details) {
            throw new BadRequestError(error.details[0].message, 'Update gig() method error');
        }

        const isDataUrl = isDataURL(req.body.coverImage);
        let coverImage = '';

        if(isDataUrl){
            const result: UploadApiResponse =  await uploads(req.body.coverImage) as UploadApiResponse;
            if (!result?.public_id) {
                throw new BadRequestError('File upload error', 'Update gig() method error');
            }

            coverImage = `${result?.secure_url}`;
        } else {
            coverImage = req.body.coverImage;
        }

        const gig: ISellerGig = {
            title: req.body.title,
            description: req.body.description,
            categories: req.body.categories,
            subCategories: req.body.subCategories,
            tags: req.body.tags,
            price: req.body.price,
            expectedDelivery: req.body.expectedDelivery,
            basicTitle: req.body.basicTitle,
            basicDescription: req.body.basicDescription,
            coverImage: coverImage,
        }

        const updatedGig = await updateGig(req.params.gigId, gig);

        res.status(StatusCodes.OK).json({ message: 'Gig updated successfully', gig: updatedGig });

    } catch (error) {
        next(error);
    }
}

export const gigUpdateActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const updatedGig: ISellerGig = await updateActiveGigProp(req.params.gigId, req.body.active);
        res.status(StatusCodes.OK).json({ message: 'Gig updated successfully', gig: updatedGig });
    } catch (error) {
        next(error);
    }
}
