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

export interface InteractiveListItem {
    term: string
    definition: string
    icon?: string
    url?: string
}

export interface OutlineItem {
    title: string
    subtopics: string[]
}

export interface ImageMetadata {
    url: string
    source: string
}

export interface YoutubeResource {
    title: string
    url: string
    thumbnail?: string
    channel?: string
    videoId?: string
    description?: string
}

export interface Message {
    messageId?: number          // Backend message ID
    type: string
    content: string
    isStreaming?: boolean
    isFlagged?: boolean         // Flag status
    flaggedAt?: string          // Timestamp when flagged
    relatedContent?: RelatedContent[]
    suggestedQuestions?: string[]
    interactiveList?: InteractiveListItem[]
    outline?: OutlineItem[]
    images?: ImageMetadata[]    // RAG images from document chunks
    youtubeResources?: YoutubeResource[]  // YouTube videos from API
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
