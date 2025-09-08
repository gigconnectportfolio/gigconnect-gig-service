import {IHitsTotal, IQueryList, ISearchResult} from "@kariru-k/gigconnect-shared";
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
