import { AppError } from '../utils/AppError.js';
import urlService from '../service/urlService.js';

// Controller function to handle URL submissions and metadata saving
export const getUserurls = async (req, res, next) => {
    try{
        const { url } = req.body;
        if(!url || typeof url !== 'string'){
            throw new AppError('Invalid URL provided', 400);
        }   
        const metadata = await urlService.parseGithubUrl(url);
        const savedUrl = await urlService.saveUrl(metadata, req.user.id);
        res.status(200).json({ success: true, data: savedUrl });
    }catch(err){
        next(err);
    }
}
