import express from 'express';
import { getUserurls } from '../controller/urlController.js';
const urlRouter = express.Router();

// Route to handle URL submissions and metadata retrieval
urlRouter.post('/repositories', getUserurls);

export default urlRouter;
