import express from 'express';
import authRoute from './routes/authRoute.js';
import config from './config/env.js';
import { globalErrorHandler } from './middleware/ErrorHandler.js';
import { AppError } from './utils/AppError.js';
import redis from './config/redis.js';
import './workers/webhookWorkers.js'; 

const app = express();
const { NODE_ENV, PORT } = config;


app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
})
);
app.use(express.urlencoded({ limit: '10kb', extended: true }));

app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok' });
})

// api routes
app.use('/api', authRoute);

// Handle unhandled routes
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

async function startServer() {
    try{
        const pong = await redis.ping();
        console.log('Redis ping response: ', pong);

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
        });

    }catch(err){
        console.error('Error starting server: ', err);
        process.exit(1);
    }
    
}
startServer();