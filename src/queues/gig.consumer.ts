import { createConnection } from './connection';
import { winstonLogger } from '@kariru-k/gigconnect-shared';
import { config } from '../config';
import { Channel, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { seedData, updateGigReview } from '../services/gig.service';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'Gigs Service Queue Consumer', 'debug');

export async function consumeGigDirectMessage(channel: Channel): Promise<void> {
    try {
        if (!channel) {
            channel = (await createConnection()) as Channel;
        }
        const exchangeName = 'gigconnect-update-gig';
        const routingKey = 'update-gig';
        const queueName = 'gig-update-queue';

        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        const gigConnectQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });

        log.info('Registered consumeBuyerDirectMessage consumer');

        await channel.bindQueue(gigConnectQueue.queue, exchangeName, routingKey);

        channel.consume(gigConnectQueue.queue, async (msg: ConsumeMessage | null) => {
            if (msg) {
                log.info(`Received message: ${msg.content.toString()}`);
                const { gigReview } = JSON.parse(msg.content.toString());
                await updateGigReview(JSON.parse(gigReview));
                channel.ack(msg);
            }
        });
    } catch (error) {
        log.log('error', `❌ Gigs Service consumeGigDirectMessage() Method`, error);
    }
}

export async function consumeSeedDirectMessages(channel: Channel): Promise<void> {
    try {
        if (!channel) {
            channel = (await createConnection()) as Channel;
        }
        const exchangeName = 'gigconnect-seed-gig';
        const queueName = 'seed-gig-queue';
        const routingKey = 'receive-sellers';

        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        const gigConnectQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });

        log.info('Registered consumeBuyerDirectMessage consumer');

        await channel.bindQueue(gigConnectQueue.queue, exchangeName, routingKey);

        channel.consume(gigConnectQueue.queue, async (msg: ConsumeMessage | null) => {
            if (msg) {
                const { sellers, count } = JSON.parse(msg.content.toString());
                await seedData(sellers, count);
                log.info(`Received message: ${msg.content.toString()}`);
                channel.ack(msg);
            }
        });
    } catch (error) {
        log.log('error', `❌ Gigs Service consumeSeedDirectMessages() Method`, error);
    }
}
