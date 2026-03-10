import {boolean, z} from 'zod';

export const urlValidator = z.object({
    body: z.object({
        url: z.string({required_error: 'URL is required'})
        .min(1,  'URL cannot be empty')
        .url({message: 'Invalid URL format'})
        .refine((url) => new URL(url).hostname === 'github.com', {message: 'URL must be a GitHub repository URL'})
        .refine((url) => {
            const pathParts = new URL(url).pathname.split('/').filter(boolean)
            return pathParts.length >= 2;
        }, {message: 'URL must point to a GitHub repository'})
})
})