import tautulliRequest from "./tautulliRequest.ts";
import groupIntoSeasons, { type WatchedSeason } from "./groupIntoSeasons.ts";

export type OldWatchedSeason = WatchedSeason;

/**
 * Get seasons whose episodes have seen no activity from anyone
 * for the given number of days, with who watched what in full.
 */
export default async function getOldWatchedSeasons(days: number): Promise<OldWatchedSeason[]> {
    const pastDate = Date.now() / 1000 - 60 * 60 * 24 * days;

    const { data: histories } = await tautulliRequest('get_history', { body: {
        media_type: 'episode',
        length: '10000',
        order_dir: 'asc',
        order_column: 'date',
        transcode_decision: '',
    }});

    // a recently active season is not deletable
    return groupIntoSeasons(histories).filter(season => season.lastActivity < pastDate);
}
