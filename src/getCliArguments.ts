import { parseArgs } from "/deps.ts";
import config from "./utils/config.ts";
import log from "./utils/logger.ts";

export default function getCliArguments() {
    const flags = parseArgs(Deno.args, {
        boolean: ["help", "dry-run", "debug", "version", "movies", "series"],
        default: { debug: config.debug },
        alias: { h: "help", v: "version", dryRun: "dry-run", m: "movies", s: "series" },
        unknown: (arg: string) => {
            console.error(`Unknown option: ${arg}\nRun with --help to see available options.`);
            Deno.exit(1);
        }
    });

    if (flags.help) {
        console.log(`RemoveArr ${config.version}
Clean up watched movies and TV seasons from Radarr/Sonarr.

Usage:
    removearr [options]

Processes both movies and series by default.

Options:
    -h, --help          Show this help
    -v, --version       Show version
    --dry-run           Show what would be deleted, without deleting
    -m, --movies        Only process movies
    -s, --series        Only process series
    --debug             Enable verbose logging
    `);
        Deno.exit(0);
    }

    if (flags.version) {
        console.log('RemoveArr', config.version);
        Deno.exit(0);
    }

    if (flags.debug) {
        config.debug = true;
        log.setLevel(0);
    }

    return flags as Omit<typeof flags, 'help' | 'version'>;
}
