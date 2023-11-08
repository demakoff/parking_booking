import { Request, Response, NextFunction, Application } from 'express';
import { Pool, QueryResult } from 'pg';
import { Booking, CreateBookingBody, User } from '../utils/types';
import HttpError from '../utils/http-error';

/**
 * @openapi
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - id
 *         - created_by
 *         - start_datetime
 *         - end_datetime
 *         - parking_spot
 *         - created_at
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the booking
 *         created_by:
 *           type: integer
 *           description: Id of the booking creator
 *         start_datetime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the beginning of the booking.  Must be in future.
 *         end_datetime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the booking expiration. Must be later than booking start.
 *         parking_spot:
 *           type: integer
 *           description: Id of the parking spot
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Auto-populated date and time of the booking creation
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Auto-populated date and time of the latest booking update
 *       example:
 *         id: 15
 *         created_by: 3
 *         start_datetime: "2023-12-07T14:00:00.000Z"
 *         end_datetime: "2023-12-07T15:00:00.000Z"
 *         parking_spot: 1,
 *         created_at: "2023-11-06T13:57:23.718Z"
 *         updated_at: "2023-11-06T20:57:45.782Z"
 *
 *     BookingRequest:
 *       type: object
 *       required:
 *         - start_datetime
 *         - end_datetime
 *         - parking_spot
 *       properties:
 *         start_datetime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the beginning of the booking. Must be in future.
 *         end_datetime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the booking expiration. Must be later than booking start.
 *         parking_spot:
 *           type: integer
 *           description: Id of the parking spot
 *       example:
 *         start_datetime: "2023-12-07T14:00:00.000Z"
 *         end_datetime: "2023-12-07T15:00:00.000Z"
 *         parking_spot: 1
 *
 * /bookings:
 *   get:
 *     summary: Retrieve a list of bookings based on user permissions (Standard or Admin).
 *     parameters:
 *         - in: header
 *           name: X-API-TOKEN
 *           schema:
 *             type: string
 *           required: true
 *           description: Standard users 'tbfZsAKIAeuaVNkL', 'buOHk799vU5Ocmbf'. Admins 'bb8iJPVaj9pWPNgY', 'xxC9xSZnl4sIthkj'
 *     responses:
 *       200:
 *         description: A list of existing bookings.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid user data
 *       5XX:
 *         description: Internal server error
 *
 *   post:
 *     summary: Create a new booking.
 *     parameters:
 *         - in: header
 *           name: X-API-TOKEN
 *           schema:
 *             type: string
 *           required: true
 *           description: Standard users 'tbfZsAKIAeuaVNkL', 'buOHk799vU5Ocmbf'. Admins 'bb8iJPVaj9pWPNgY', 'xxC9xSZnl4sIthkj'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       200:
 *         description: A list of existing bookings.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid user or input data
 *       500:
 *         description: Server error e.g. vialotion of constraint "start_date_in_future"
 *         content:
 *           text/plain:
 *             schema:
 *             type: string
 *
 */

const addBookingsRoutes = (app: Application, db: Pool) => {
	app.get('/bookings', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id, role } = res.locals.user as User;
			const permitionCondition = role === 'admin' ? '' : `WHERE created_by = ${id}`;

			const result: QueryResult<Booking> = await db.query(
				`SELECT * FROM bookings ${permitionCondition} ORDER BY id ASC LIMIT 100;`
			);
			res.json(result.rows);
		} catch (error) {
			next(error);
		}
	});

	app.post('/bookings', async (req: Request, res: Response, next: NextFunction) => {
		// console.dir(req.body);
		try {
			const userId = (res.locals.user as User)['id'];
			const query = `
                INSERT INTO bookings (created_by, start_datetime, end_datetime, parking_spot) 
                VALUES ($1, $2, $3, $4)
                RETURNING id;
            `;
			const {
				start_datetime = null,
				end_datetime = null,
				parking_spot = null,
			} = req.body as CreateBookingBody;
			if (!start_datetime || !end_datetime || !parking_spot) {
				return next(new HttpError(400, 'Invalid input data'));
			}

			const result: QueryResult<{ id: number }> = await db.query(query, [
				userId,
				start_datetime,
				end_datetime,
				parking_spot,
			]);

			const addedId = result.rows[0].id;

			return res.status(201).location(`/bookings/${addedId}`).end();
		} catch (error) {
			next(error);
		}
	});
};

export default addBookingsRoutes;
