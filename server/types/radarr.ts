export interface Movie {
  id: number
  tmdbId: number
  title: string
  year: number
  added: string
  hasFile: boolean
  tags: number[]
  statistics: { movieFileCount: number, sizeOnDisk: number }
}

export interface TagDetailsResource {
  id: number
  label: string
  movieIds: number[]
}
