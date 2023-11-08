import HttpError from '../utils/http-error';
import addBookingsRoutes from './bookings.routes';

describe('Bookings endpoints', () => {
	describe('GET /bookings', () => {

        test('returns existing bookings from db according user permissions', async () => {
			const mockedGet = jest.fn();
			const mockedPost = jest.fn();
			const app = { get: mockedGet, post: mockedPost };
            const resultRows = [{
                "id": 5,
                "created_by": 3,
                "start_datetime": "2023-11-08T10:00:00.000Z",
                "end_datetime": "2023-11-08T12:00:00.000Z",
                "parking_spot": 2,
                "created_at": "2023-11-07T11:51:38.887Z",
                "updated_at": null
            }];
            const db = { query: jest.fn(() => { return {rows: resultRows}})};

			addBookingsRoutes(app, db);

			expect(mockedGet.mock.calls[0][0]).toBe('/bookings');

			const controller = mockedGet.mock.calls[0][1];

			const req = {};
			const res = { 
                locals: { user: { id: 1, role: 'standard' }},
                json: jest.fn()
            };
			const next = jest.fn();
			await controller(req, res, next);

			expect(db.query).toHaveBeenCalledWith(
                'SELECT * FROM bookings WHERE created_by = 1 ORDER BY id ASC LIMIT 100;'
            );
            expect(res.json).toHaveBeenCalledWith(resultRows);
		});

		test('fails when db query failed', async () => {
			const mockedGet = jest.fn();
			const mockedPost = jest.fn();
			const app = { get: mockedGet, post: mockedPost };
            const db = { query: jest.fn(() => { throw new Error('db error')})};

			addBookingsRoutes(app, db);

			const controller = mockedGet.mock.calls[0][1];

			const req = {};
			const res = { locals: { user: { id: 1, role: 'standard' } } };
			const next = jest.fn();
			await controller(req, res, next);

			const error: HttpError = next.mock.calls[0][0];

			expect(error instanceof Error);
			expect(error.message).toBe('db error');
		});
	});
});
