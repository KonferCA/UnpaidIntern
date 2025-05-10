export const err = (message: string) => {
    console.error(`❌ ${message}`);
};

export const warn = (message: string) => {
    console.warn(`⚠️ ${message}`);
};

export const info = (message: string) => {
    console.info(`ℹ️ ${message}`);
};

export const success = (message: string) => {
    console.log(`✅ ${message}`);
};

export const debug = (message: string) => {
    console.debug(`🐛 ${message}`);
};

export const log = (message: string) => {
    console.log(`📝 ${message}`);
};

export const logger = {
    err, warn, info, success, debug, log
};
export default logger;

