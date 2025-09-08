import {Logger} from "winston";
import {winstonLogger} from "@kariru-k/gigconnect-shared";
import {config} from "./config";
import mongoose from "mongoose";

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'Users Database Server', 'debug');

export const databaseConnection = async (): Promise<void> => {
    try {
        await mongoose.connect(`${config.DATABASE_URL}`);
        log.info('GigService databaseConnection() method: MongoDB connected successfully');
    } catch (error) {
        log.log('error', `GigService databaseConnection() method error:`, error);
    }
}
