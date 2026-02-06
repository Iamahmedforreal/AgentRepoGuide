import express from 'express';
import authRoute from './routes/authRoute.js';
import config from './config/env.js';

const app = express();
const { NODE_ENV, PORT } = config;

app.use(express.json());

// body parser middleware with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));


app.get('/', (req, res) => {
    res.send('Hello, World!');
})

//api routes
app.use('/api', authRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
})