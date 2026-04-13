import { Application } from 'express';
import { healthRoutes } from './routes/health';
import { verifyGatewayRequest } from '@kariru-k/gigconnect-shared';
import { gigRoutes } from './routes/gig';

const BASE_PATH = '/api/v1/gig';

export const appRoutes = (app: Application): void => {
    app.use('', healthRoutes());
    app.use(BASE_PATH, verifyGatewayRequest, gigRoutes());
};
