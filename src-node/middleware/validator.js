import { AppError } from '../utils/AppError.js';

export const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
        });
        next();
    } catch (err) {
        // Zod v4 exposes issues on err.issues; v3 uses err.errors – handle both
        const issues = err.issues ?? err.errors ?? [];
        const details = issues.map(e => ({
            field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
            message: e.message
        }));
        next(new AppError('Validation failed', 400, details));
    }
};
