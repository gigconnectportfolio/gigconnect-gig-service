import {databaseConnection} from "./database";
import {config} from "./config";
import express, {Express} from "express";
import {start} from "./server";
import {redisConnect} from "./redis/redis.connection";

const initialize = (): void => {
    config.cloudinaryConfig();
    databaseConnection();
    const app: Express = express();
    start(app);
    redisConnect();
}

initialize();
