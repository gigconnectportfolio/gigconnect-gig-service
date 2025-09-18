import {NextFunction, Request, Response} from "express";
import {IPaginateProps, ISearchResult, ISellerGig} from "@kariru-k/gigconnect-shared";
import {gigsSearch} from "../services/search.service";
import {StatusCodes} from "http-status-codes";
import _ from "lodash";

export async function gigs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const {from, size, type} = req.params;
        let resultHits: ISellerGig[] = [];

        const paginate: IPaginateProps = {
            from: from,
            size: parseInt(`${size}`),
            type: type,
        }

        const gigs: ISearchResult = await gigsSearch(
            req.query.query as string,
            paginate,
            req.query.delivery_time ? req.query.delivery_time as string : undefined,
            req.query.minPrice? parseInt(req.query.minPrice as string) : undefined,
            req.query.maxPrice? parseInt(req.query.maxPrice as string): undefined,
        );

        for (const item of gigs.hits){
            resultHits.push(item._source as ISellerGig);
        }

        if (type === 'backward'){
            resultHits = _.sortBy(resultHits, ['sortId']);
        }

        res.status(StatusCodes.OK).json({ message: 'Gigs fetched successfully', total: gigs.total, gigs: resultHits });

    } catch (error) {
        next(error);
    }
}
