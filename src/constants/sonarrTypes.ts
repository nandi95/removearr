interface SeasonStatistics {
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    nextAiring?: string;
}

export interface Season {
    seasonNumber: number;
    monitored: boolean;
    statistics: SeasonStatistics;
}

export interface Series {
    id: number;
    title: string;
    tvdbId: number;
    year: number;
    path: string;
    added: string;
    tags: number[];
    seasons: Season[];
}

export interface SeriesTagDetails {
    id: number;
    label: string;
    seriesIds: number[];
}

export interface EpisodeFile {
    id: number;
    seriesId: number;
    seasonNumber: number;
    path: string;
    size: number;
}
