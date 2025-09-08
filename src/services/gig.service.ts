import {addDataToIndex, deleteIndexedData, getIndexedData, updateIndexedData} from "../elasticsearch";
import {gigsSearchBySellerId} from "./search.service";
import {IRatingTypes, IReviewMessageDetails, ISellerGig} from "@kariru-k/gigconnect-shared";
import {gigModel} from "../models/gig.schema";
import {publishDirectMessage} from "../queues/gig.producer";
import {gigChannel} from "../server";

export const getGigById = async (gigId: string) => {
    return await getIndexedData('gigs', gigId);
}

export const getSellerGigs = async (sellerId: string): Promise<ISellerGig[]> => {
    const resultHits: ISellerGig[] = [];
    const result = await gigsSearchBySellerId(sellerId, true);
    result.hits.forEach((hit) => {
        resultHits.push(hit._source as ISellerGig);
    })
    return resultHits;
}

export const getSellerInactiveGigs = async (sellerId: string): Promise<ISellerGig[]> => {
    const resultHits: ISellerGig[] = [];
    const result = await gigsSearchBySellerId(sellerId, false);
    result.hits.forEach((hit) => {
        resultHits.push(hit._source as ISellerGig);
    })
    return resultHits;
}

export const createGig = async (gig: ISellerGig): Promise<ISellerGig> => {
    const createdGig: ISellerGig = await gigModel.create(gig);
    if (createdGig) {
        const data: ISellerGig = createdGig.toJSON?.() as ISellerGig;
        await publishDirectMessage(
            gigChannel,
            'gigconnect-seller-updates',
            'user-seller',
            JSON.stringify({type: 'update-gig-count', gigSellerId: `${data.sellerId}`, count: 1}),
            'Message sent to users service to update gig count.'
        )

        await addDataToIndex('gigs', `${createdGig._id}`, data);
    }
    return createdGig;
}

export const deleteGig = async (gigId: string, sellerId: string): Promise<void> => {
    await gigModel.deleteOne({_id: gigId}).exec();
    await publishDirectMessage(
        gigChannel,
        'gigconnect-seller-updates',
        'user-seller',
        JSON.stringify({type: 'update-gig-count', gigSellerId: `${sellerId}`, count: -1}),
        'Message sent to users service to update gig count.'
    )
    await deleteIndexedData('gigs', `${gigId}`);
}

export const updateGig = async (gigId: string, gigData: ISellerGig): Promise<ISellerGig> => {
    const updatedGig = await gigModel.findOneAndUpdate(
        {_id: gigId},
        {
            $set: {
                title: gigData.title,
                description: gigData.description,
                categories: gigData.categories,
                subCategories: gigData.subCategories,
                tags: gigData.tags,
                price: gigData.price,
                coverImage: gigData.coverImage,
                expectedDelivery: gigData.expectedDelivery,
                basicTitle: gigData.basicTitle,
                basicDescription: gigData.basicDescription
            }
        },
        { new: true }
    ).exec() as ISellerGig;

    if (updatedGig) {
        const data: ISellerGig = updatedGig.toJSON?.() as ISellerGig;
        await updateIndexedData('gigs', `${updatedGig._id}`, data);
    }

    return updatedGig;
}

export const updateActiveGigProp = async (gigId: string, active: boolean): Promise<ISellerGig> => {
    const updatedGig = await gigModel.findOneAndUpdate(
        {_id: gigId},
        {
            $set: {
                active: active
            }
        },
        { new: true }
    ).exec() as ISellerGig;
    if (updatedGig) {
        const data: ISellerGig = updatedGig.toJSON?.() as ISellerGig;
        await updateIndexedData('gigs', `${updatedGig._id}`, data);
    }
    return updatedGig;
}

export const updateGigReview =  async (data: IReviewMessageDetails): Promise<void> => {
    const ratingTypes: IRatingTypes = {
        '1': 'one',
        '2': 'two',
        '3': 'three',
        '4': 'four',
        '5': 'five'
    };
    const ratingKey: string = ratingTypes[`${data.rating}`];
    const gig = await gigModel.findOneAndUpdate(
        {_id: data.gigId},
        {
            $inc: {
                ratingsCount: 1,
                ratingSum: data.rating,
                [`ratingCategories.${ratingKey}.value`]: data.rating,
                [`ratingCategories.${ratingKey}.count`]: 1
            }
        },
        {new: true, upsert: true}
    ).exec();

    if (gig) {
        const updatedGig: ISellerGig = gig.toJSON?.() as ISellerGig;
        await updateIndexedData('gigs', `${gig._id}`, updatedGig);
    }
}

