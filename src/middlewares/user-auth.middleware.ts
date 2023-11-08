import { Request, Response, NextFunction } from 'express';
import { QueryResult } from 'pg';

import { db } from '../db/init-db-client';
import HttpError from '../utils/http-error';
import { User } from '../utils/types';

const authUserByApiToken = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token: string = req.headers['x-api-token'];
		if (token) {
			const result: QueryResult<User> = await db.query(
				'SELECT * FROM users WHERE api_token = $1 LIMIT 1',
				[token]
			);
			res.locals.user = result.rows[0];
		}

		if (!res.locals.user) {
			return next(new HttpError(400, 'Invalid API token'));
		}
        if (!res.locals.user.id || !res.locals.user.role) {
			return next(new HttpError(500, 'Invalid user data in db'));
		}

		next();
	} catch (error) {
		next(error);
	}
};

export default authUserByApiToken;
