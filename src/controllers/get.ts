import {NextFunction, Request, Response} from "express";
import {getGigById, getSellerGigs, getSellerInactiveGigs} from "../services/gig.service";
import {StatusCodes} from "http-status-codes";
import {getUserSelectedGigCategory} from "../redis/gig.cache";
import {ISearchResult, ISellerGig} from "@kariru-k/gigconnect-shared";
import {
    getMoreGigsLikeThis,
    getTopRatedGigsByCategory,
    gigsSearchByCategory
} from "../services/search.service";

export async function gigById(req: Request, res: Response, next: NextFunction) {
    try {
        const gig = await getGigById(req.params.gigId);
        res.status(StatusCodes.OK).json({message: 'Gig fetched successfully', gig: gig });
    } catch (error) {
        next(error);
    }
}

export async function SellerGigs(req: Request, res: Response, next: NextFunction) {
    try {
        const gigs = await getSellerGigs(req.params.sellerId);
        res.status(StatusCodes.OK).json({message: 'Gigs fetched successfully', gigs: gigs });
    } catch (error) {
        next(error);
    }
}

export async function sellerInactiveGigs(req: Request, res: Response, next: NextFunction)  {
    try {
        const gigs = await getSellerInactiveGigs(req.params.sellerId);
        res.status(StatusCodes.OK).json({message: 'Inactive gigs fetched successfully', gigs: gigs });
    } catch (error) {
        next(error);
    }
}

export async function topRatedGigsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const category = await getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
        const resultHits: ISellerGig[] = [];
        const gigs: ISearchResult = await getTopRatedGigsByCategory(`${category}`);
        for (const item of gigs.hits){
            resultHits.push(item._source as ISellerGig);
        }

        res.status(StatusCodes.OK).json({ message: 'Top rated gigs fetched successfully', total: gigs.total, gigs: resultHits });

    } catch (error) {
        next(error);
    }
}

export async function gigsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const category = await getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
        const resultHits: ISellerGig[] = [];
        const gigs: ISearchResult = await gigsSearchByCategory(`${category}`);
        for (const item of gigs.hits){
            resultHits.push(item._source as ISellerGig);
        }

        res.status(StatusCodes.OK).json({ message: 'Search Gigs Category Result', total: gigs.total, gigs: resultHits });

    } catch (error) {
        next(error);
    }
}

export async function moreLikeThis(req: Request, res: Response, next: NextFunction) {
    try {
        const resultHits: ISellerGig[] = [];
        const gigs: ISearchResult = await getMoreGigsLikeThis(req.params.gigId);
        for (const item of gigs.hits){
            resultHits.push(item._source as ISellerGig);
        }

        res.status(StatusCodes.OK).json({ message: 'More Gigs Like This Result', total: gigs.total, gigs: resultHits });

    } catch (error) {
        next(error);
    }
}

