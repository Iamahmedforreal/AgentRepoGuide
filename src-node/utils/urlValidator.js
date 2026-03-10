import {boolean, z} from 'zod';

export const urlValidator = z.object({
    body: z.object({
        url: z
            .string({ required_error: 'URL is required' })
            .min(1, 'URL cannot be empty')
            .url({ message: 'Invalid URL format' })

            // 1. HTTPS only – no http:// or other schemes
            .refine(
                (url) => new URL(url).protocol === 'https:',
                { message: 'URL must use HTTPS' }
            )

            // 2. @ injection guard – prevents https://attacker@github.com/ SSRF bypass
            .refine(
                (url) => !url.includes('@'),
                { message: 'URL must not contain credentials' }
            )

            // 3. Hostname must be exactly github.com (no subdomains accepted)
            .refine(
                (url) => new URL(url).hostname === 'github.com',
                { message: 'URL must be a GitHub repository URL' }
            )

            // 4. Path traversal guard
            .refine(
                (url) => !new URL(url).pathname.includes('..'),
                { message: 'URL path must not contain traversal sequences' }
            )

            // 5. Must resolve to at least /owner/repo (≥ 2 non-empty path segments)
            .refine(
                (url) => {
                    const pathParts = new URL(url).pathname.split('/').filter(Boolean);
                    return pathParts.length >= 2;
                },
                { message: 'URL must point to a GitHub repository (e.g. https://github.com/owner/repo)' }
            )
    })
});
