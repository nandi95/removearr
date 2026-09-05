import getCliArguments from "./src/getCliArguments.ts";
import getOldWatchedMedia, { type OldWatchedMedia } from "./src/tautulli/getOldWatchedMedia.ts";
import config from "./src/utils/config.ts";
import radarrRequest from "./src/radarr/radarrRequest.ts";
import { Movie, TagDetailsResource } from "./src/constants/radarrTypes.ts";
import log from "./src/utils/logger.ts";
import leavingSoonCollection from "./src/plex/leavingSoonCollection.ts";
import sonarrRequest from "./src/sonarr/sonarrRequest.ts";
import { Series, SeriesTagDetails } from "./src/constants/sonarrTypes.ts";
import getOldWatchedSeasons from "./src/tautulli/getOldWatchedSeasons.ts";
import deleteMovie from "./src/radarr/deleteMovie.ts";
import deleteSeason from "./src/sonarr/deleteSeason.ts";

const cliArgs = getCliArguments();

const deleteAfterDays = config.deleteAfterDays || 14;
const deleteSoonAfterDays = Math.round(deleteAfterDays / 2);

export type OldWatchedMovieWithRadarr = {
    tautulli: OldWatchedMedia;
    radarr: Movie
}

async function removeArr() {
    const oldWatchedMovies = await getOldWatchedMedia(deleteSoonAfterDays, 'movie');
    const radarrMovies = await radarrRequest<Movie[]>('movie');

    const requesterTags = await radarrRequest<TagDetailsResource[]>('tag/detail')
        // username prefixed like "1-johndoe"
        .then(tags => tags.map(tag => ({ moviesIds: tag.movieIds, user: tag.label.replace(/^\d+\s*-\s*/, '') })));

    const moviesWatchedByRequester: OldWatchedMovieWithRadarr[] = oldWatchedMovies.filter(movie => {
        const radarrMovie = radarrMovies.find(
            // titles might not be the same: radarrMovie.title === movie.title see: "Dune" vs "Dune: Part One (2021)"
            // however, year and file size should be unique enough
            radarrMovie => radarrMovie.year === Number(movie.year) && radarrMovie.statistics.sizeOnDisk === Number(movie.file_size)
        );

        if (!radarrMovie) {
            log.info(`Movie not found in radarr: ${movie.title} (${movie.year})`);

            if (config.debug) {
                // sometimes the year may mismatch: "Good Morning, Vietnam (1988)" vs "Good Morning, Vietnam (1987)"
                const sameSized = radarrMovies.filter(radarrMovie => radarrMovie.statistics.sizeOnDisk === Number(movie.file_size));

                if (sameSized.length > 0) {
                    log.debug(`Potential matches: ${sameSized.map(movie => `${movie.title} (${movie.year})`).join(', ')}`);
                }
            }

            return false;
        }

        const usersWhoWatchedThis = movie.users!;
        const userWhoRequestedThis = requesterTags.find(tag => tag.moviesIds.includes(radarrMovie.id))?.user;

        if (!userWhoRequestedThis) {
            return false;
        }

        // radarr strips dots/spaces from tag labels ("farkasm7" vs tautulli "farkas.m7")
        const norm = (user: string) => user.toLowerCase().replace(/[^a-z0-9]/g, '');

        return usersWhoWatchedThis.some(user => norm(user) === norm(userWhoRequestedThis));
    }).map(movie => {
        const radarrMovie = radarrMovies.find(
            radarrMovie => radarrMovie.year === Number(movie.year) && radarrMovie.statistics.sizeOnDisk === Number(movie.file_size)
        )!;

        return {
            tautulli: movie,
            radarr: radarrMovie
        };
    });

    const { deletableMovies, moviesToDeleteSoon } = moviesWatchedByRequester.reduce((acc, movie) => {
        const playedDaysAgo = Math.round((Date.now() - movie.tautulli.last_played! * 1000) / (1000 * 60 * 60 * 24));

        acc[
            playedDaysAgo >= deleteAfterDays
                ? "deletableMovies"
                : "moviesToDeleteSoon"
        ].push(movie);

        return acc;
    }, { deletableMovies: [] as typeof moviesWatchedByRequester, moviesToDeleteSoon: [] as typeof moviesWatchedByRequester });

    if (cliArgs.dryRun && moviesToDeleteSoon.length > 0) {
        const sizeToReclaim = moviesToDeleteSoon.reduce((acc, movie) => acc + Number(movie.tautulli.file_size), 0);

        log.info(`Movies going to be deleted soon (${moviesToDeleteSoon.length} ~ ${(sizeToReclaim / 1024 / 1024 / 1024).toFixed(2)} GB):
  - ${moviesToDeleteSoon.map(movie =>
            movie.tautulli.title + ' - ' + (Number(movie.tautulli.file_size) / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        ).join("\n  - ")}
`);
    }

    if (deletableMovies.length === 0) {
        log.info('No movies to delete');
        return;
    }

    if (cliArgs.dryRun) {
        const sizeToReclaim = deletableMovies.reduce((acc, movie) => acc + Number(movie.tautulli.file_size), 0);

        log.info(`Movies going to be deleted (${deletableMovies.length} ~ ${(sizeToReclaim / 1024 / 1024 / 1024).toFixed(2)} GB):
  - ${deletableMovies.map(
            movie => movie.tautulli.title + ' - ' + (Number(movie.tautulli.file_size) / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        ).join("\n  - ")}
`);
        return;
    }

    const plexLeavingSoonCollection = (await leavingSoonCollection())!;

    if (moviesToDeleteSoon.length > 0) {
        await plexLeavingSoonCollection.remove(moviesToDeleteSoon);
    }

    log.info(`Deleting ${deletableMovies.length} movies`);
    log.debug('Leaving Soon', plexLeavingSoonCollection);
    return;

    await plexLeavingSoonCollection.remove(deletableMovies);

    await Promise.all(deletableMovies.map(async (movie, index) => {
        await deleteMovie(movie.radarr);

        return log.info(`Deleted: ${movie.tautulli.title} (${index + 1}/${deletableMovies.length})`);
    }));
}

type DeletableSeason = {
    series: Series;
    seasonNumber: number;
    sizeOnDisk: number;
};

async function removeArrSeasons() {
    const oldSeasons = await getOldWatchedSeasons(deleteSoonAfterDays);
    const allSeries = await sonarrRequest<Series[]>('series');

    const requesterTags = await sonarrRequest<SeriesTagDetails[]>('tag/detail')
        // username prefixed like "1-johndoe"
        .then(tags => tags.map(tag => ({ seriesIds: tag.seriesIds, user: tag.label.replace(/^\d+\s*-\s*/, '') })));

    // sonarr strips dots/spaces from tag labels ("farkasm7" vs tautulli "farkas.m7")
    const norm = (user: string) => user.toLowerCase().replace(/[^a-z0-9]/g, '');

    const deletableSeasons: DeletableSeason[] = [];
    const seasonsToDeleteSoon: DeletableSeason[] = [];

    for (const watched of oldSeasons) {
        const series = allSeries.find(series => norm(series.title) === norm(watched.showTitle));

        if (!series) {
            log.info(`Show not found in sonarr: ${watched.showTitle}`);
            continue;
        }

        const season = series.seasons.find(season => season.seasonNumber === watched.seasonNumber);

        if (!season || season.statistics.episodeFileCount === 0) {
            continue;
        }

        const userWhoRequestedThis = requesterTags.find(tag => tag.seriesIds.includes(series.id))?.user;

        if (!userWhoRequestedThis) {
            continue;
        }

        const watchedEpisodes = Object.entries(watched.watchedEpisodesByUser)
            .find(([user]) => norm(user) === norm(userWhoRequestedThis))?.[1];

        // ponytail: "full season" = requester fully watched at least as many distinct episodes as files on disk
        if (!watchedEpisodes || watchedEpisodes.size < season.statistics.episodeFileCount) {
            continue;
        }

        const playedDaysAgo = Math.round((Date.now() / 1000 - watched.lastActivity) / (60 * 60 * 24));

        (playedDaysAgo >= deleteAfterDays ? deletableSeasons : seasonsToDeleteSoon).push({
            series,
            seasonNumber: watched.seasonNumber,
            sizeOnDisk: season.statistics.sizeOnDisk,
        });
    }

    const label = (season: DeletableSeason) =>
        `${season.series.title} - Season ${season.seasonNumber} - ${(season.sizeOnDisk / 1024 / 1024 / 1024).toFixed(2)} GB`;
    const totalGb = (seasons: DeletableSeason[]) =>
        (seasons.reduce((acc, season) => acc + season.sizeOnDisk, 0) / 1024 / 1024 / 1024).toFixed(2);

    if (cliArgs.dryRun && seasonsToDeleteSoon.length > 0) {
        log.info(`Seasons going to be deleted soon (${seasonsToDeleteSoon.length} ~ ${totalGb(seasonsToDeleteSoon)} GB):
  - ${seasonsToDeleteSoon.map(label).join("\n  - ")}
`);
    }

    if (deletableSeasons.length === 0) {
        log.info('No seasons to delete');
        return;
    }

    if (cliArgs.dryRun) {
        log.info(`Seasons going to be deleted (${deletableSeasons.length} ~ ${totalGb(deletableSeasons)} GB):
  - ${deletableSeasons.map(label).join("\n  - ")}
`);
        return;
    }

    log.info(`Deleting ${deletableSeasons.length} seasons`);
    // same safety brake as the movie flow — remove this line to enable deletion
    return;

    for (const { series, seasonNumber } of deletableSeasons) {
        await deleteSeason(series, seasonNumber);

        log.info(`Deleted: ${series.title} - Season ${seasonNumber}`);
    }
}

// https://github.com/LukeHagar/plexjs/blob/main/docs/sdks/library/README.md#getlibraryitems

// TODOS:
// implement notifications of movies soon to be deleted
// implement error handling

// Deno.cron('removeArr', config.cronSchedule, removeArr);
if (!cliArgs.series) await removeArr();
if (!cliArgs.movies) await removeArrSeasons();
// --allow-net for fetching from tautulli and radarr
// --allow-read to read .env file
// --allow-env for checking colours is allowed
