import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

const loggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
};

export const logger = pino(loggerOptions);
