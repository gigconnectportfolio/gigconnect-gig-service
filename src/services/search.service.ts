import {IHitsTotal, IPaginateProps, IQueryList, ISearchResult} from "@kariru-k/gigconnect-shared";
import {estypes} from "@elastic/elasticsearch";
import {elasticSearchClient} from "../elasticsearch";

/**
    This function searches for gigs by seller ID and active status in the Elasticsearch index.
    @param {boolean} active - A boolean indicating whether to filter by active gigs.
    @param {string} searchQuery - The main search query string.
    @returns {Promise<ISearchResult>} A promise that resolves to an ISearchResult object containing total hits and search results.
 **/
export async function gigsSearchBySellerId(searchQuery: string, active: boolean): Promise<ISearchResult> {
    const queryList: IQueryList[] = [
        {
            query_string: {
                fields: ['sellerId'],
                query: `*${searchQuery}*`,
            }
        },
        {
            term: {
                active: active
            }
        }];

    const result: estypes.SearchResponse = await elasticSearchClient.search({
        index: 'gigs',
        query: {
            bool: {
                must: [...queryList]
            }
        },
    });

    const total: IHitsTotal = result.hits.total as IHitsTotal;

    return {
        total: total.value,
        hits: result.hits.hits
    }
}

/**
    This function searches for gigs in the elasticsearch index. It:
    - Filters gigs based on the search query, delivery time, and price range.
    - Supports pagination and sorting based on the provided options
    - Ensures only active gigs are returned.
    - Returns the total number of hits and the search results.
    @param {string} searchQuery - The main search query string.
    @param {IPaginateProps} paginate - Pagination options including 'from', 'size', and 'type'.
    @param {string} [deliveryTime] - Optional filter for expected delivery time.
    @param {number} [min] - Optional minimum price filter.
    @param {number} [max] - Optional maximum price filter.
    @returns {Promise<ISearchResult>} A promise that resolves to an ISearchResult object containing total hits and search results.
 **/
export async function gigsSearch(searchQuery: string, paginate: IPaginateProps, deliveryTime?: string, min?: number, max?: number): Promise<ISearchResult> {
    const { from, size, type } = paginate;
    const queryList: IQueryList[] = [
        {
            query_string: {
                fields: ["username", "title", "description", "basicDescription", "basicTitle", "categories", "subCategories", "tags"],
                query: `*${searchQuery}*`,
            }
        },
        {
            term: {
                active: true
            }
        }];

    if (deliveryTime) {
        queryList.push({
            query_string: {
                fields: ["expectedDelivery"],
                query: `*${deliveryTime}*`,
            }
        });
    }

    if (typeof min === 'number' && typeof max === 'number' && !isNaN(min) && !isNaN(max)) {
        queryList.push({
            range: {
                price: {
                    gte: min,
                    lte: max
                }
            }
        });
    }


    const result: estypes.SearchResponse = await elasticSearchClient.search({
        index: 'gigs',
        size: size,
        query: {
            bool: {
                must: [...queryList]
            }
        },
        sort: [
            {
                sortId: type === 'forward' ? 'asc' : 'desc'
            }
        ],
        ...(from !== '0' && { search_after: [from] })
    });

    const total: IHitsTotal = result.hits.total as IHitsTotal;

    return {
        total: total.value,
        hits: result.hits.hits
    }
}

/**
    This function searches for gigs by category in the Elasticsearch index.
    It filters gigs based on the provided search query and ensures that only active gigs are returned.
    @param {string} searchQuery - The category search query string.
    @returns {Promise<ISearchResult>} A promise that resolves to an ISearchResult object containing total hits and search results.
 **/
export async function gigsSearchByCategory(searchQuery: string): Promise<ISearchResult> {

    const result: estypes.SearchResponse = await elasticSearchClient.search({
        index: 'gigs',
        size: 10,
        query: {
            bool: {
                must: [
                    {
                        query_string: {
                            fields: ["categories"],
                            query: `*${searchQuery}*`,
                        }
                    },
                    {
                        term: {
                            active: true
                        }
                    }
                ]
            }
        }
    });

    const total: IHitsTotal = result.hits.total as IHitsTotal;

    return {
        total: total.value,
        hits: result.hits.hits
    }
}

/**
    This function retrieves gigs similar to a specified gig using Elasticsearch's "more_like_this" query.
    It finds gigs that are similar based on fields such as title, description, categories, and tags.
    @param {string} gigId - The ID of the gig to find similar gigs for.
    @returns {Promise<ISearchResult>} A promise that resolves to an ISearchResult object containing total hits and search results.
 **/
export async function getMoreGigsLikeThis (gigId: string): Promise<ISearchResult>  {
    const result: estypes.SearchResponse = await elasticSearchClient.search({
        index: 'gigs',
        size: 5,
        query: {
            more_like_this: {
                fields: ["title", "description", "basicDescription", "basicTitle", "categories", "subCategories", "tags"],
                like: [
                    {
                        _index: 'gigs',
                        _id: gigId
                    }
                ],
            }
        }
    });

    const total: IHitsTotal = result.hits.total as IHitsTotal;

    return {
        total: total.value,
        hits: result.hits.hits
    }
}

/**
    This function retrieves the top-rated gigs in a specified category from the Elasticsearch index.
    It filters gigs based on the provided category search query and ensures that only active gigs with a perfect rating are returned.
    @param {string} searchQuery - The category search query string.
    @returns {Promise<ISearchResult>} A promise that resolves to an ISearchResult object containing total hits and search results.
 **/
export async function getTopRatedGigsByCategory(searchQuery: string): Promise<ISearchResult> {
    const result: estypes.SearchResponse = await elasticSearchClient.search({
        index: 'gigs',
        size: 5,
        query: {
            bool: {
                filter: {
                    script: {
                        script: {
                            source: `doc['ratingSum'].value != 0 && doc['ratingSum'].value / doc['ratingsCount'].value == params['threshold']`,
                            lang: 'painless',
                            params: {
                                threshold: 5
                            }
                    }
                }
            },
                must: [
                    {
                        query_string: {
                            fields: ["categories"],
                            query: `*${searchQuery}*`,
                        }
                    },
                    {
                        term: {
                            active: true
                        }
                    }
                ]
        }}

    });

    const total: IHitsTotal = result.hits.total as IHitsTotal;

    return {
        total: total.value,
        hits: result.hits.hits
    }
}
