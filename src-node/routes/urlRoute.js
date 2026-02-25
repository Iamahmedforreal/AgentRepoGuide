import express from 'express';
import { getUserurls } from '../controllers/urlController.js';
const urlRouter = express.Router();


urlRouter.get('/repositories', getUserurls);
