import { AppError } from '../utils/AppError';
import urlService from '../service/urlService';
import { error } from 'console';

export const getUserurls = async (req, res) => {
    try{
        const { url } = req.body;
        if(!url || typeof url !== 'string'){
            throw new AppError('Invalid URL provided', 400);
        }
        
        const metadata = await urlService.parseGithubUrl(url);
        const savedUrl = await urlService.saveUrl(metadata, req.user.id);
        res.status(200).json({ success: true, data: savedUrl });
    }catch(err){
        throw new AppError('Error fetching user URLs', 500);
    }
    

}
