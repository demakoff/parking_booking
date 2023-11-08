import express from 'express';
import 'dotenv/config';

import initSwagger from './initSwagger';
import { initDBClient } from './db/init-db-client';

import authUserByApiToken from './middlewares/user-auth.middleware';
import addBookingsRoutes from './routes/bookings.routes';
import addSingleBookingRoutes from './routes/single-booking.routes';

import { logErrors, errorHandler } from './middlewares/error-handlers.middleware';
import initDBEntities from './db/init-db-entities';

const db = await initDBClient();
await initDBEntities(db);

const app: express.Application = express();
const port = process.env.NODE_PORT;

initSwagger(app);
app.use(express.json());

app.use(authUserByApiToken);

addBookingsRoutes(app, db);
addSingleBookingRoutes(app, db);

app.use(logErrors);
app.use(errorHandler);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
