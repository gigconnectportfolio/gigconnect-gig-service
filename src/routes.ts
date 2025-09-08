import {Application} from "express";
import {healthRoutes} from "./routes/health";


export const appRoutes = (app: Application): void => {
    app.use('', healthRoutes());
}
