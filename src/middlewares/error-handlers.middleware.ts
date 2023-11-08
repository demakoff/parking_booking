import { Request, Response, NextFunction } from 'express';
import HttpError from '../utils/http-error';

function logErrors(err: HttpError, req: Request, res: Response, next: NextFunction) {
	console.error(err);
	next(err);
}

function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction) {
	res.status(err.statusCode || 500);
	res.setHeader('content-type', 'text/plain');
	res.end(err.message);
}

export { logErrors, errorHandler };
