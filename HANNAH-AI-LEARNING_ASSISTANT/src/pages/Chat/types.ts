export interface StudioItem {
    id: string
    type: 'mindmap' | 'report' | 'notecard' | 'quiz'
    title: string
    subtitle: string
    status: 'loading' | 'completed'
    timestamp: string
    content?: any  // Store generated content to avoid re-fetching
}

export interface Source {
    id: string
    title: string
    url: string
    description: string
    icon?: string
}

export interface RelatedContent {
    id: string
    title: string
    description: string
    url: string
    source: string
    sourceIcon?: string
    shortTitle?: string
}

export interface Message {
    type: string
    content: string
    isStreaming?: boolean
    relatedContent?: RelatedContent[]
}

export interface BigPictureTopic {
    title: string
    subtopics: string[]
}

export interface StudioFeature {
    icon: any
    title: string
    description: string
    type: 'mindmap' | 'report' | 'notecard' | 'quiz'
    note: string
}
