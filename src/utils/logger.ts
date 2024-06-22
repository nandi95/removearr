import config from "../utils/config.ts";
import { yellow, gray, cyan, bold, italic, red } from '/deps.ts';

export enum LogLevels {
    Debug,
    Info,
    Warn,
    Error,
    Fatal
}

const prefixes = new Map<LogLevels, string>([
    [LogLevels.Debug, 'DEBUG'],
    [LogLevels.Info, 'INFO'],
    [LogLevels.Warn, 'WARN'],
    [LogLevels.Error, 'ERROR'],
    [LogLevels.Fatal, 'FATAL']
]);
const noColor: (str: string) => string = (msg) => msg;
const colorFunctions = new Map<LogLevels, (str: string) => string>([
    [LogLevels.Debug, (srt: string) => gray(srt)],
    [LogLevels.Info, (srt: string) => cyan(srt)],
    [LogLevels.Warn, (srt: string) => yellow(srt)],
    [LogLevels.Error, (str: string) => red(str)],
    [LogLevels.Fatal, (str: string) => italic(bold(red(str)))]
]);

function logger({
    logLevel = LogLevels.Info,
    name = 'Main'
}: {
    logLevel?: LogLevels;
    name?: string;
} = {}) {
    function log(level: LogLevels, ...args: unknown[]) {
        if (level < logLevel) return;
        let color = colorFunctions.get(level);
        if (!color) color = noColor;
        const date = new Date();
        const logValues: string[] = [
            `[${date.toLocaleDateString('en-GB', { timeZone: config.timeZone })}` +
            ` ${date.toLocaleTimeString('en-GB', { timeZone: config.timeZone })}]`,
            color(prefixes.get(level) ?? 'DEBUG'),
            name ? `${name} >` : '>',
            // @ts-expect-error - js can handle the type juggling
            ...args
        ];
        switch (level) {
            case LogLevels.Debug:
                if (!config.debug) return;

                const logLocation = new Error().stack?.split('\n')[3].match(/(file:\/\/\/[^)]+)/)?.[1];

                if (logLocation) {
                    logValues.unshift(gray(`(${logLocation})`));
                }

                return console.debug(...logValues);
            case LogLevels.Info:
                return console.info(...logValues);
            case LogLevels.Warn:
                return console.warn(...logValues);
            case LogLevels.Error:
                return console.error(...logValues);
            case LogLevels.Fatal:
                return console.error(...logValues);
            default:
                return console.log(...logValues);
        }
    }

    function setLevel(level: LogLevels) {
        logLevel = level;
    }

    function debug(...args: unknown[]) {
        log(LogLevels.Debug, ...args);
    }

    function info(...args: unknown[]) {
        log(LogLevels.Info, ...args);
    }

    function warn(...args: unknown[]) {
        log(LogLevels.Warn, ...args);
    }

    function error(...args: unknown[]) {
        log(LogLevels.Error, ...args);
    }

    function fatal(...args: unknown[]) {
        log(LogLevels.Fatal, ...args);
    }

    return {
        log,
        setLevel,
        debug,
        info,
        warn,
        error,
        fatal
    };
}

export const log = logger({
    logLevel: config.debug ? LogLevels.Debug : LogLevels.Info
});

export default log;
