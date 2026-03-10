import config from '../config/env.js';

// server error handler middleware
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        details: err.details?.length ? err.details : undefined,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            // Include field-level detail only for client errors (4xx)
            ...(err.details?.length && { details: err.details })
        });
    } else {
        // Programming or other unknown error – leak nothing
        console.error('ERROR ', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }
};


export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        sendErrorProd(err, res);
    }
};
