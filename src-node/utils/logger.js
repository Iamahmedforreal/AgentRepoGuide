

export const logger = {
    error: (message, data={}) => {
        console.error(`[ERROR] ${message}`, data);
    },
    warn: (message, data={}) => {
        console.warn(`[WARN] ${message}`, data);
    },
    info: (message, data={}) => {
        console.log(`[INFO] ${message}`, data);
    } 

}