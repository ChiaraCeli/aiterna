export type ExploreCategory =
  | 'surprise'
  | 'history'
  | 'nature'
  | 'animals'
  | 'space'
  | 'places'
  | 'curiosities'
  | 'psychology'
  | 'mysteries'
  | 'crime'
  | 'custom'

export type ReadingLength = 'short' | 'medium' | 'long'

export interface ExploreRequest {
  category: ExploreCategory
  length: ReadingLength
  customTopic?: string
}

export interface ReadingSource {
  title: string
  url: string
}

export interface ReadingSection {
  id: string
  content: string
}

export interface GeneratedReading {
  title: string
  sections: ReadingSection[]
  sources: ReadingSource[]
}