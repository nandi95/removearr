export type LibraryType = 'show' | 'movie'

export interface TautulliLibrary {
  section_id: string
  section_name: string
  section_type: LibraryType
  count: string
}

export interface Media {
  rating_key: string
  title: string
  year: string
  file_size: string
  /** Unix seconds */
  last_played: number | null
}

export interface History {
  date: number
  grandparent_rating_key: number
  grandparent_title: string
  media_index: number
  parent_media_index: number
  rating_key: number
  started: number
  stopped: number
  watched_status: 0 | 1 | number
  title: string
  user: string
  year: number
}

export type CommandToOutput = {
  get_libraries: TautulliLibrary[]
  get_library_media_info: { data: Media[] }
  get_history: { data: History[], recordsFiltered: number, recordsTotal: number }
}

export type TautulliCommand = keyof CommandToOutput
