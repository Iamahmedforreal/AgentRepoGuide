export class AppError extends Error {
    /**
     * @param {string} message      - Human-readable error message
     * @param {number} statusCode   - HTTP status code
     * @param {Array}  [details]    - Optional array of field-level validation errors
     */
    constructor(message, statusCode, details = []) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}
