import {winstonLogger} from "@kariru-k/gigconnect-shared";
import {Logger} from "winston";
import {createClient} from "redis";
import {config} from "../config";

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'Gig Service Redis Connection', 'debug');
type RedisClientType = ReturnType<typeof createClient>;

export const client: RedisClientType = createClient({ url: `${config.REDIS_HOST}`});

export const redisConnect = async (): Promise<void> => {
    try {
        client.on('error', (err) => log.error('Redis Client Error', err));
        await client.connect();
        log.info(`✅ Gig Service Connected To Redis Successfully: ${await client.ping()}`);
    } catch (error) {
        log.error('❌ Gig Service Redis Connection Error', error);
    }
}
