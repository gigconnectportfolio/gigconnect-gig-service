import {Client, estypes} from "@elastic/elasticsearch";
import {config} from "./config";
import {Logger} from "winston";
import {ISellerGig, winstonLogger} from "@kariru-k/gigconnect-shared";
import {GetResponse} from "@elastic/elasticsearch/lib/api/types";

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'Gigs ElasticSearch Server', 'debug');

export const elasticSearchClient = new Client({
    node: `${config.ELASTIC_SEARCH_URL}`,
});


/**
    This function checks the connection to the Elasticsearch cluster by querying its health status.
    It continuously attempts to connect until a successful connection is established.
    If the connection fails, it logs the error and retries.
    @returns {Promise<void>} A promise that resolves when a successful connection is made.
 **/
export async function checkConnection(): Promise<void> {
    let isConnected = false;
    while (!isConnected) {
        try {
            const response: estypes.ClusterHealthResponse = await elasticSearchClient.cluster.health({});
            log.info(`Gigs ElasticSearch Server ElasticSearch health status: ${response.status}`);
            isConnected = true;
        } catch (error) {
            log.error("Failed to connect to ElasticSearch", error);
            log.log('error', 'Gigs ElasticSearch Server checkConnection() Method', error);
        }
    }
}

/**
    This function checks if a specified index exists in the Elasticsearch cluster.
    It returns true if the index exists, otherwise false.
    @param {string} indexName - The name of the index to check.
    @returns {Promise<boolean>} A promise that resolves to true if the index exists, otherwise
 **/
async function checkifIndexExists(indexName: string): Promise<boolean> {
    try {
        return await elasticSearchClient.indices.exists({index: indexName});
    } catch (error) {
        log.error(`Error checking if index ${indexName} exists`, error);
        return false;
    }
}

/**
    This function creates a new index in the Elasticsearch cluster if it does not already exist.
    It first checks if the index exists using the checkifIndexExists function.
    If the index does not exist, it creates the index and refreshes it.
    @param {string} indexName - The name of the index to create.
    @returns {Promise<void>} A promise that resolves when the index is created or if it already exists.
 **/
export async function createIndex(indexName: string): Promise<void> {
    try {
        const indexExists = await checkifIndexExists(indexName);
        if (!indexExists) {
            await elasticSearchClient.indices.create({index: indexName});
            await elasticSearchClient.indices.refresh({index: indexName});
            log.info(`Index ${indexName} created successfully`);
        } else {
            log.info(`Index ${indexName} already exists`);
        }
    } catch (error) {
        log.error(`Error creating index ${indexName}`, error);
        log.log('error', `Gig ElasticSearch Server createIndex() Method`, error);
    }
}

/**
 * This function retrieves the document count from a specified Elasticsearch index.
 * It returns the count of documents in the index.
 * If an error occurs, it logs the error and returns 0.
 * @param {string} index - The name of the Elasticsearch index.
 * @return {Promise<number>} A promise that resolves to the document count or 0 in case of an error.
 */
export async function getDocumentCount(index: string): Promise<number> {
    try {
        const result = await elasticSearchClient.count({index});
        return result.count;
    } catch (error) {
        log.error(`Error getting document count from index ${index}`, error);
        log.log('error', `Gig ElasticSearch Server getDocumentCount() Method`, error);
        return 0;
    }
}

/**
 * This function retrieves a document from a specified Elasticsearch index using the document ID.
 * It returns the document if found, otherwise returns an empty object.
 * The function handles errors by logging them and returning an empty object.
 * @param {string} index - The name of the Elasticsearch index.
 * @param {string} itemId - The ID of the document to retrieve.
 * @return {Promise<ISellerGig>} A promise that resolves to the document if found, otherwise an empty object.
 */
export async function getIndexedData(index: string, itemId: string): Promise<ISellerGig>{
    try {
        const result: GetResponse = await elasticSearchClient.get({index, id: itemId});
        if (result.found) {
            return result._source as ISellerGig;
        }

        return {} as ISellerGig;
    } catch (error) {
        log.error(`Error getting indexed data from ${index}`, error);
        log.log('error', `Gig ElasticSearch Server getIndexedData() Method`, error);
        return {} as ISellerGig;
    }
}

/**
 * This function adds a document to a specified Elasticsearch index.
 * It takes the index name, document ID, and the document itself as parameters.
 * @param {string} index - The name of the Elasticsearch index.
 * @param {string} itemId - The ID of the document to be added.
 * @param {unknown} document - The document to be indexed.
 * @returns {Promise<void>} A promise that resolves when the document is successfully indexed.
 */
export async function addDataToIndex(index: string, itemId: string, document: unknown): Promise<void> {
    try {
        await elasticSearchClient.index({
            index: index,
            id: itemId,
            document: document
        });
        await elasticSearchClient.indices.refresh({index});
        log.info(`Data added to index ${index} successfully`);
    } catch (error) {
        log.error(`Error adding data to index ${index}`, error);
        log.log('error', `Gig ElasticSearch Server addDataToIndex() Method`, error);
    }
}

/**
 * This function updates a document in a specified Elasticsearch index.
 * It takes the index name, document ID, and the updated document as parameters.
 * @param {string} index - The name of the Elasticsearch index.
 * @param {string} itemId - The ID of the document to be updated.
 * @param {unknown} document - The updated document.
 * @return {Promise<void>} A promise that resolves when the document is successfully updated.
 */
export async function updateIndexedData(index: string, itemId: string, document: unknown): Promise<void> {
    try {
        await elasticSearchClient.update({
            index: index,
            id: itemId,
            doc: document
        });
        await elasticSearchClient.indices.refresh({index});
        log.info(`Data updated in index ${index} successfully`);
    } catch (error) {
        log.error(`Error adding data to index ${index}`, error);
        log.log('error', `Gig ElasticSearch Server addDataToIndex() Method`, error);
    }
}

/**
 * This function deletes a document from a specified Elasticsearch index using the document ID.
 * It takes the index name and document ID as parameters.
 * @param {string} index - The name of the Elasticsearch index.
 * @param {string} itemId - The ID of the document to be deleted.
 * @returns {Promise<void>} A promise that resolves when the document is successfully deleted.
 */
export async function deleteIndexedData(index: string, itemId: string): Promise<void> {
    try {
        await elasticSearchClient.delete({
            index: index,
            id: itemId
        });
        await elasticSearchClient.indices.refresh({index});
        log.info(`Data deleted from index ${index} successfully`);
    } catch (error) {
        log.error(`Error deleting data from index ${index}`, error);
        log.log('error', `Gig ElasticSearch Server deleteIndexedData() Method`, error);
    }
}
