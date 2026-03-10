import express from 'express';
import { getUserurls } from '../controller/urlController.js';
import { validateRequest } from '../middleware/validator.js';
import { sanitizeRequestBody } from '../middleware/sanitize.js';
import { urlValidator } from '../utils/urlValidator.js';

const urlRouter = express.Router();


urlRouter.post(
    '/repositories',
    sanitizeRequestBody,
    validateRequest(urlValidator),
    getUserurls
);

export default urlRouter;
