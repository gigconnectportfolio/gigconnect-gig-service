import {Logger} from "winston";
import {winstonLogger} from "@kariru-k/gigconnect-shared";
import {config} from "../config";
import {client} from "./redis.connection";

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'Gig Service Redis Cache', 'debug');

export const getUserSelectedGigCategory = async(key:string): Promise<string> => {
    try {
        if (!client.isOpen){
            await client.connect();
        }
        const response: string = await client.get(key) as string;
        if (response) {
            return response;
        } else {
            return '';
        }
    } catch (error) {
        log.error('❌ Gig Service Redis Cache getUserSelectedGigCategory() Method Error', error);
        return '';
    }
};
