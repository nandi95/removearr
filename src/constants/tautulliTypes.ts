type LibraryType = 'show' | 'movie';

interface Library {
    section_id: string;
    section_name: 'Films' | 'TV shows';
    section_type: LibraryType;
    agent: string;
    thumb: string;
    art: string;
    count: string;
    is_active: 0 | 1;
    parent_count: string;
    child_count: string;
}

interface Media {
    section_id: number;
    section_type: LibraryType;
    added_at: string;
    media_type: LibraryType;
    rating_key: string;
    parent_rating_key: string;
    grandparent_rating_key: string;
    title: string;
    sort_title: string;
    year: string;
    media_index: string;
    parent_media_index: string;
    thumb: string;
    container: string;
    bitrate: string;
    video_codec: string;
    video_resolution: string;
    video_framerate: string;
    audio_codec: string;
    audio_channels: string;
    file_size: string;
    /**
     * Unix timestamp
     */
    last_played: number | null;
    play_count: string | null;
}

interface LibraryMediaInfo {
    data: Media[];
}

interface Notification {
    notification_id: number;
}

interface History {
    date: number;
    friendly_name: string;
    full_title: string;
    grandparent_rating_key: number;
    grandparent_title: string;
    original_title: string;
    group_count: number;
    group_ids: string;
    guid: string;
    ip_address: string;
    live: number;
    location: string;
    machine_id: string;
    media_index: number;
    media_type: string;
    originally_available_at: string;
    parent_media_index: number;
    parent_rating_key: number;
    parent_title: string;
    paused_counter: number;
    percent_complete: number;
    platform: string;
    play_duration: number;
    product: string;
    player: string;
    rating_key: number;
    reference_id: number;
    relayed: number;
    row_id: number;
    secure: number;
    session_key: string | null;
    started: number;
    state: string | null;
    stopped: number;
    thumb: string;
    watched_status: 0 | 1;
    title: string;
    transcode_decision: string;
    user: string;
    user_id: number;
    year: number;
}

interface GetHistory {
    data: History[];
    recordsFiltered: number;
    recordsTotal: number;
    draw: number;
    filter_duration: string;
    total_duration: string;
}

// Type map for commands to outputs
export type CommandToOutput = {
    'get_libraries': Library[],
    'get_library_media_info': LibraryMediaInfo,
    'notify': Notification,
    'get_history': GetHistory
};

export type TautulliCommand = keyof CommandToOutput;
