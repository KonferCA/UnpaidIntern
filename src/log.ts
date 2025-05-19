export const err = (message: string, error?: any) => {
    console.error(`❌ ${message}`);
};

export const warn = (message: string, warning?: any) => {
    console.warn(`⚠️ ${message}`);
};

export const info = (message: string, info?: any) => {
    console.info(`ℹ️ ${message}`);
};

export const success = (message: string, success?: string) => {
    console.log(`✅ ${message}`);
};

export const debug = (message: string, debug?: string) => {
    console.debug(`🐛 ${message}`);
};

export const log = (message: string) => {
    console.log(`📝 ${message}`);
};

export const logger = {
    err, warn, info, success, debug, log
};
export default logger;

