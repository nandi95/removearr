import config from "../utils/config.ts";
import makeArrRequest from "../utils/arrRequest.ts";

const overseerrRequest = makeArrRequest(config.overseerrUrl + '/api/v1', config.overseerrApiKey);

interface OverseerrRequest {
    status: number; // 1 pending, 2 approved, 3 declined
    media: { tvdbId: number };
    seasons: { seasonNumber: number }[];
}

/** Season numbers with a pending/approved overseerr request for this tvdb id. */
export default async function getRequestedSeasons(tvdbId: number): Promise<number[]> {
    const seasons: number[] = [];

    for (let page = 0; ; page++) {
        const { results, pageInfo } = await overseerrRequest<{ results: OverseerrRequest[]; pageInfo: { pages: number } }>(
            `request?take=100&skip=${page * 100}`,
        );

        for (const request of results) {
            if (request.status !== 3 && request.media.tvdbId === tvdbId) {
                seasons.push(...request.seasons.map(season => season.seasonNumber));
            }
        }

        if (page + 1 >= pageInfo.pages) return seasons;
    }
}
