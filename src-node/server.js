import express from 'express';
import authRoute from './routes/authRoute.js';
import config from './config/env.js';

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


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
})