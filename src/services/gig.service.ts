import {addDataToIndex, deleteIndexedData, getIndexedData, updateIndexedData} from "../elasticsearch";
import {gigsSearchBySellerId} from "./search.service";
import {IRatingTypes, IReviewMessageDetails, ISellerDocument, ISellerGig} from "@kariru-k/gigconnect-shared";
import {gigModel} from "../models/gig.schema";
import {publishDirectMessage} from "../queues/gig.producer";
import {gigChannel} from "../server";
import {faker} from "@faker-js/faker/locale/en";
import _ from "lodash";

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

export const seedData = async (sellers: ISellerDocument[], count: string): Promise<void> => {
    const categories = ['Graphics & Design', 'Digital Marketing', 'Writing & Translation', 'Video & Animation', 'Music & Audio', 'Programming & Tech', 'Business', 'Lifestyle'];
    const expectedDelivery: string[] = ['1 Day', '2 Days', '3 Days', '4 Days', '5 Days'];
    const randomRatings = [
        {sum: 20, count: 4},
        {sum: 15, count: 3},
        {sum: 21, count: 8},
        {sum: 19, count: 5},
        {sum: 25, count: 7},
        {sum: 30, count: 10},
        {sum: 18, count: 4},
        {sum: 22, count: 6}
    ];

    for (let i = 0; i < sellers.length; i++){
        const sellerDoc: ISellerDocument = sellers[i];
        const title = `I will ${faker.word.words(5)}`;
        const basicTitle = faker.commerce.productName();
        const basicDescription = faker.commerce.productDescription();
        const rating = _.sample(randomRatings);

        const gig: ISellerGig = {
            profilePicture: sellerDoc.profilePicture,
            email: sellerDoc.email,
            username: sellerDoc.username,
            sellerId: `${sellerDoc._id}`,
            title: title.length <= 80 ? title : title.substring(0, 77) + '...',
            description: faker.lorem.paragraphs(2),
            categories: _.sample(categories) as string,
            subCategories: [faker.commerce.department(), faker.commerce.department(), faker.commerce.department(), faker.commerce.department()],
            tags: [faker.commerce.productAdjective(), faker.commerce.productMaterial(), faker.commerce.product(), faker.commerce.product(), faker.commerce.product(), faker.commerce.product()],
            price: parseInt(faker.commerce.price({min: 5, max: 500, dec: 0})),
            coverImage: faker.image.urlPicsumPhotos(),
            expectedDelivery: _.sample(expectedDelivery) as string,
            active: true,
            ratingsCount: (i + 1) % 4 === 0 ? rating?.count as number : 0,
            ratingSum: (i + 1) % 4 === 0 ? rating?.sum as number : 0,
            ratingCategories: {
                one: {value: 0, count: 0},
                two: {value: 0, count: 0},
                three: {value: 0, count: 0},
                four: {value: 0, count: 0},
                five: {value: 0, count: 0},
            },
            sortId: parseInt(count, 10) + (i + 1),
            basicTitle: basicTitle.length <= 40 ? basicTitle : basicTitle.substring(0, 37) + '...',
            basicDescription: basicDescription.length <= 100 ? basicDescription : basicDescription.substring(0, 97) + '...',
        };

        console.log(`*** SEEDING GIG DATA for seller ${sellerDoc.username} ***`);
        await createGig(gig);
    }




}

