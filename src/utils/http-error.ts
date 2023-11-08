
export default class HttpError extends Error {
    statusCode: string;

    constructor (statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}