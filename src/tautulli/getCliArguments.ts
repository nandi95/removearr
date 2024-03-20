import { parseArgs } from "/deps.ts";
import config from "../constants/config.ts";

export default function getCliArguments() {
    const flags = parseArgs(Deno.args, {
        boolean: ["help", "dry-run"],
        string: ["version"],
        alias: { h: "help" },
    });

    if (flags.help) {
        console.log(`RemoveArr
=========
    Usage:
        removearr [options]
    Options:
        -h, --help          Show this help
        --version           Show version
        --dry-run           Show what would be deleted
    `);
        Deno.exit(0);
    }

    if (flags.version) {
        console.log(config.version);
        Deno.exit(0);
    }

    return flags as Omit<typeof flags, 'help' | 'version'>;
}
