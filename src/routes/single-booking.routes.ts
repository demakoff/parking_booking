import { Request, Response, NextFunction, Application } from 'express';
import HttpError from '../utils/http-error';
import { Booking, CreateBookingBody, SimplifiedFullBooking, User } from '../utils/types';
import { Pool, QueryResult } from 'pg';

/**
 * @openapi
 * components:
 *   schemas:
 *     BookingRequestOptional:
 *       type: object
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
 * /bookings/{id}:
 *   get:
 *     summary: Retrieve a particular booking based on user permissions (Standard or Admin).
 *     parameters:
 *         - in: header
 *           name: X-API-TOKEN
 *           schema:
 *             type: string
 *           required: true
 *           description: Standard users 'tbfZsAKIAeuaVNkL', 'buOHk799vU5Ocmbf'. Admins 'bb8iJPVaj9pWPNgY', 'xxC9xSZnl4sIthkj'
 *         - in: path
 *           name: id
 *           schema:
 *             type: integer
 *           required: true
 *           description: Numeric id of the booking to get
 *     responses:
 *       200:
 *         description: Requested booking.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid user data
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *             type: string
 *
 *   patch:
 *     summary: Update an existing booking.
 *     parameters:
 *         - in: header
 *           name: X-API-TOKEN
 *           schema:
 *             type: string
 *           required: true
 *           description: Standard users 'tbfZsAKIAeuaVNkL', 'buOHk799vU5Ocmbf'. Admins 'bb8iJPVaj9pWPNgY', 'xxC9xSZnl4sIthkj'
 *         - in: path
 *           name: id
 *           schema:
 *             type: integer
 *           required: true
 *           description: Numeric id of the booking to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequestOptional'
 *     responses:
 *       200:
 *         description: Request succeeded
 *       400:
 *         description: Invalid user data
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error e.g. vialotion of constraint "start_date_in_future"
 *         content:
 *           text/plain:
 *             schema:
 *             type: string
 *   delete:
 *     summary: Delete an existing booking.
 *     parameters:
 *         - in: header
 *           name: X-API-TOKEN
 *           schema:
 *             type: string
 *           required: true
 *           description: Standard users 'tbfZsAKIAeuaVNkL', 'buOHk799vU5Ocmbf'. Admins 'bb8iJPVaj9pWPNgY', 'xxC9xSZnl4sIthkj'
 *         - in: path
 *           name: id
 *           schema:
 *             type: integer
 *           required: true
 *           description: Numeric id of the booking to delete
 *     responses:
 *       200:
 *         description: Request succeeded
 *       400:
 *         description: Invalid user data
 *       404:
 *         description: Not found
 *         content:
 *           text/plain:
 *             schema:
 *             type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *             type: string
 */

const addSingleBookingRoutes = (app: Application, db: Pool) => {
	app.get('/bookings/:id', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id, role } = res.locals.user as User;
			const permitionCondition = role === 'admin' ? '' : `AND created_by = ${id}`;

			const result: QueryResult<SimplifiedFullBooking> = await db.query(
				`SELECT 
                    bookings.id, 
                    start_datetime, 
                    end_datetime, 
                    parking_spots.name AS spot_name, 
                    concat(first_name,' ', last_name) AS user_name 
                FROM bookings
                LEFT JOIN users ON bookings.created_by = users.id
                LEFT JOIN parking_spots ON bookings.parking_spot = parking_spots.id
                WHERE bookings.id = $1 ${permitionCondition};`,
				[parseInt(req.params.id)]
			);

			if (result.rowCount === 0) {
				throw new HttpError(404, 'Item not found');
			}

			return res.json(result.rows);
		} catch (error) {
			next(error);
		}
	});

	app.patch('/bookings/:id', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id, role } = res.locals.user as User;
			const permitionCondition = role === 'admin' ? '' : `AND created_by = ${id}`;
			const query = `
                UPDATE bookings 
                SET start_datetime = COALESCE($2, start_datetime), 
                    end_datetime = COALESCE($3, end_datetime), 
                    parking_spot = COALESCE($4, parking_spot)
                WHERE id = $1 ${permitionCondition}
                RETURNING id;`;
			const {
				start_datetime = null,
				end_datetime = null,
				parking_spot = null,
			} = req.body as CreateBookingBody;

			const result: QueryResult = await db.query(query, [
				parseInt(req.params.id),
				start_datetime,
				end_datetime,
				parking_spot,
			]);

			if (result.rowCount === 0) {
				throw new HttpError(404, 'Item not found');
			}
			
			return res.end();
		} catch (error) {
			next(error);
		}
	});

	app.delete('/bookings/:id', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id, role } = res.locals.user as User;
			const permitionCondition = role === 'admin' ? '' : `AND created_by = ${id}`;
			
            const result: QueryResult = await db.query(
				`DELETE FROM bookings WHERE id = $1 ${permitionCondition};`,
				[parseInt(req.params.id)]
			);

			if (result.rowCount === 0) {
				throw new HttpError(404, 'Item not found');
			}

			return res.end();
		} catch (error) {
			next(error);
		}
	});
};

export default addSingleBookingRoutes;
