import pino from "pino";

const token = process.env.AXIOM_TOKEN as string;
const dataset = process.env.AXIOM_DATASET as string;

const loggerConfig: pino.LoggerOptions = {
    level: "debug",
    name: "databuddy",
};

if (token && dataset) {
    loggerConfig.transport = {
        target: "@axiomhq/pino",
        options: {
            token,
            dataset,
        },
    };
}

export const logger = pino(loggerConfig);


export function createLogger(name: string) {
    const config: pino.LoggerOptions = {
        level: "debug",
        name,
    };

    if (token && dataset) {
        config.transport = {
            target: "@axiomhq/pino",
            options: {
                token,
                dataset,
            },
        };
    }

    return pino(config);
}