interface Revision {
    version: number;
    real: number;
    isRepack: boolean;
}

enum QualitySource {
    Unknown = 'unknown',
    Television = 'television',
    TelevisionRaw = 'televisionRaw',
    Web = 'web',
    WebRip = 'webRip',
    DVD = 'dvd',
    Bluray = 'bluray',
    BlurayRaw = 'blurayRaw',
}

interface Quality {
    id: number;
    name: string;
    resolution: number;
    source: QualitySource;
}

interface QualityModel {
    quality: Quality;
    revision: Revision;
}

interface ModelBase {
    id: number;
}

interface Language {
    id: number;
    name: string;
}

interface CustomFormat {
    id: number;
    name: string;
}
interface MediaInfo {
    audioBitrate: number;
    audioChannels: number;
    audioCodec: string;
    audioLanguages: string;
    audioStreamCount: number;
    videoBitDepth: number;
    videoBitrate: number;
    videoCodec: string;
    videoFps: number;
    videoDynamicRange: string;
    videoDynamicRangeType: string;
    resolution: string;
    runTime: string;
    scanType: string;
    subtitles: string;
}

interface MovieFile extends ModelBase {
    movieId: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
    sceneName: string;
    releaseGroup: string;
    languages: Language[];
    quality: QualityModel;
    customFormats: CustomFormat[];
    indexerFlags: number;
    mediaInfo: MediaInfo;
    qualityCutoffNotMet: boolean;
}

interface Image {
    coverType: string;
    url: string;
    remoteUrl: string;
}

interface Collection {
    title: string;
}

interface Statistics {
    movieFileCount: number;
    releaseGroups: string[];
    sizeOnDisk: number;
}

interface Ratings {
    imdb: object;
    tmdb: object;
    metacritic: object;
    rottenTomatoes: object;
}

export interface Movie extends ModelBase {
    tmdbId: number;
    imdbId: string;
    sortTitle: string;
    overview: string;
    youTubeTrailerId: string;
    monitored: boolean;
    status: string;
    title: string;
    titleSlug: string;
    collection: Collection;
    studio: string;
    qualityProfileId: number;
    added: string;
    year: number;
    inCinemas: string;
    physicalRelease: string;
    originalLanguage: Language;
    originalTitle: string;
    digitalRelease: string;
    runtime: number;
    minimumAvailability: string;
    path: string;
    genres: string[];
    ratings: Ratings;
    popularity: number;
    certification: string;
    statistics: Statistics;
    tags: number[];
    images: Image[];
    movieFile: MovieFile;
    hasFile: boolean;
    isAvailable: boolean;
}

interface TagDetailsResource {
    id: number;
    label: string;
    delayProfileIds: number[];
    importListIds: number[];
    notificationIds: number[];
    releaseProfileIds: number[];
    indexerIds: number[];
    downloadClientIds: number[];
    autoTagIds: number[];
    movieIds: number[];

}

export interface ApiMap {
    movie: Movie[];
    'tag/detail': TagDetailsResource[];
}
