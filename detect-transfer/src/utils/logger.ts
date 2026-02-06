import winston from 'winston';

const {combine, timestamp, printf, colorize, errors} = winston.format;

export interface LoggerConfig {
    development: boolean;
    level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
}

const devFormat = printf(({level, message, timestamp, stack, ...meta}) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
    }
    return log;
});

const prodFormat = printf(({level, message, timestamp, ...meta}) => {
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
    });
});

export function createLogger(config: LoggerConfig): winston.Logger {
    const isDevelopment = config.development;

    return winston.createLogger({
        level: config.level,
        format: combine(
            errors({stack: true}),
            timestamp({format: 'YYYY-MM-DD HH:mm:ss'})
        ),
        transports: [
            new winston.transports.Console({
                format: isDevelopment
                    ? combine(colorize(), devFormat)
                    : prodFormat,
            }),
        ],
    });
}

let logger: winston.Logger | null = null;

export function getLogger(): winston.Logger {
    if (!logger) {
        logger = createLogger({development: true, level: 'info'});
    }
    return logger;
}

export function initLogger(config: LoggerConfig): winston.Logger {
    logger = createLogger(config);
    return logger;
}

export type Logger = winston.Logger;
