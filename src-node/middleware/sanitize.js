import { AppError } from "../utils/AppError.js";
const ALLOWED_BODY_FIELDS = new Set(['url']);

export const sanitizeRequestBody = (req, res, next) => {
    try{

        // reject any unknown fields in the request body
        const unkonwnKeys = Object.keys(req.body).filter((k) => !ALLOWED_BODY_FIELDS.has(k));
        if(unkonwnKeys.length > 0){
            return next(new AppError(`Unknown fields in request body: ${unkonwnKeys.join(', ')}`, 400));
        }
       
        // url must be a string
        if(typeof req.body?.url !== 'string'){
            return next();
        }

        // trim whitespace 
        let url = req.body.url;
        url = url.trim();

        const hashIndex = url.indexOf('#');
        if(hashIndex !== -1){
            url = url.slice(0, hashIndex);
        }

        url = url.replace(/^(https?:\/\/)([^@]+@)/, '$1');
        req.body.url = url;

        next();


    }catch(err){
        next(err);
    }
}