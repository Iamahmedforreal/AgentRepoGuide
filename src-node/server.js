import express from 'express';
import authRoute from './routes/authRoute.js';
import config from './config/env.js';
import { globalErrorHandler } from './middleware/ErrorHandler.js';
import { AppError } from './utils/AppError.js';

const app = express();
const { NODE_ENV, PORT } = config;

// global middlewares (limit to 10kb)
app.use(express.json({
    verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding || 'utf-8');
    }
})
);
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// api routes
app.use('/api', authRoute);

// Handle unhandled routes
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
})