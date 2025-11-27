/**
 * Message Helper Functions
 * Utility functions for parsing and processing chat messages
 */

import type { Source, RelatedContent } from '../types';

/**
 * Parse assistant response content and interactive elements
 * Handles both new interactiveElements structure and legacy JSON parsing
 */
export const parseAssistantResponse = (responseContent: string, interactiveElements?: any) => {
    console.log('🔧 parseAssistantResponse START');
    console.log('  📄 responseContent:', responseContent);
    console.log('  📦 interactiveElements:', interactiveElements);

    // PRIORITY 1: Use interactiveElements from API response (new backend structure)
    if (interactiveElements) {
        console.log('  ✅ Using interactiveElements (new structure)');
        const result = {
            content: responseContent, // Plain text content
            interactiveList: interactiveElements.interactive_list || interactiveElements.interactiveList,
            suggestedQuestions: interactiveElements.suggested_questions || interactiveElements.suggestedQuestions,
            outline: interactiveElements.outline,
            youtubeResources: interactiveElements.youtube_resources || interactiveElements.youtubeResources
        };
        console.log('  📋 Result:', result);
        console.log('  📚 Outline extracted:', result.outline);
        console.log('  🎥 YouTube resources:', result.youtubeResources);
        return result;
    }

    console.log('  ℹ️ No interactiveElements, trying JSON parse...');
    // PRIORITY 2: Try to parse from JSON string (old FAQ hybrid structure - fallback)
    try {
        // Try to parse the content as JSON
        const parsed = JSON.parse(responseContent);

        // Check if it has the expected structure (flat or nested interactiveElements)
        if (parsed.content || parsed.interactiveElements || parsed.interactive_list) {
            const content = typeof parsed.content === 'object' && parsed.content.data ? parsed.content.data : parsed.content;
            const interactiveEls = parsed.interactiveElements || {};
            
            return {
                content: content,
                interactiveList: parsed.interactive_list || interactiveEls.interactiveList || interactiveEls.interactive_list,
                suggestedQuestions: parsed.suggested_questions || interactiveEls.suggestedQuestions || interactiveEls.suggested_questions,
                outline: parsed.outline || interactiveEls.outline,
                youtubeResources: parsed.youtube_resources || parsed.youtubeResources || interactiveEls.youtubeResources || interactiveEls.youtube_resources
            };
        }

        // If it's JSON but doesn't have the specific structure, treat as plain text (or handle otherwise)
        return { 
            content: responseContent,
            youtubeResources: undefined
        };
    } catch (e) {
        // Not JSON, treat as plain text
        return { 
            content: responseContent,
            youtubeResources: undefined
        };
    }
};

/**
 * Parse interactive list and related content from message content
 * Extracts special formatted blocks like [INTERACTIVE_LIST:...], [RELATED_CONTENT:...], etc.
 */
export const parseInteractiveList = (content: string) => {
    const parts: Array<{
        type: 'text' | 'interactive-list' | 'related-content' | 'video-content',
        content: string,
        title?: string,
        sources?: Source[],
        relatedItems?: RelatedContent[],
        videoUrl?: string,
        videoTitle?: string
    }> = [];

    const interactiveListRegex = /\[INTERACTIVE_LIST:(.*?)\]([\s\S]*?)\[\/INTERACTIVE_LIST\]/g;
    const relatedContentRegex = /\[RELATED_CONTENT:(.*?)\]([\s\S]*?)\[\/RELATED_CONTENT\]/g;
    const videoContentRegex = /\[VIDEO_CONTENT:(.*?):(.*?)\]/g;

    // Create a combined regex to find all special blocks
    const allMatches: Array<{
        type: 'interactive-list' | 'related-content' | 'video-content',
        match: RegExpExecArray
    }> = [];

    let match;
    while ((match = interactiveListRegex.exec(content)) !== null) {
        allMatches.push({ type: 'interactive-list', match });
    }

    while ((match = relatedContentRegex.exec(content)) !== null) {
        allMatches.push({ type: 'related-content', match });
    }

    while ((match = videoContentRegex.exec(content)) !== null) {
        allMatches.push({ type: 'video-content', match });
    }

    // Sort by position
    allMatches.sort((a, b) => a.match.index - b.match.index);

    let lastIndex = 0;

    for (const { type, match } of allMatches) {
        // Add text before this block
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: content.substring(lastIndex, match.index)
            });
        }

        if (type === 'interactive-list') {
            const title = match[1];
            const listContent = match[2];
            const sources: Source[] = [];

            // Parse sources
            const sourceRegex = /\[SOURCE:(\d+):(.*?):(.*?):(.*?):(.*?)\]/g;
            let sourceMatch;

            while ((sourceMatch = sourceRegex.exec(listContent)) !== null) {
                sources.push({
                    id: sourceMatch[1],
                    title: sourceMatch[2],
                    icon: sourceMatch[3],
                    description: sourceMatch[4],
                    url: sourceMatch[5]
                });
            }

            parts.push({
                type: 'interactive-list',
                content: listContent,
                title,
                sources
            });
        } else if (type === 'video-content') {
            const videoTitle = match[1];
            const videoUrl = match[2];

            parts.push({
                type: 'video-content',
                content: '',
                videoTitle,
                videoUrl
            });
        } else if (type === 'related-content') {
            const title = match[1];
            const contentBlock = match[2];
            const relatedItems: RelatedContent[] = [];

            // Parse related content items: [CONTENT:id:title:description:url:source:sourceIcon:shortTitle]
            const contentRegex = /\[CONTENT:(\d+):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?)\]/g;
            let contentMatch;

            while ((contentMatch = contentRegex.exec(contentBlock)) !== null) {
                relatedItems.push({
                    id: contentMatch[1],
                    title: contentMatch[2],
                    description: contentMatch[3],
                    url: contentMatch[4],
                    source: contentMatch[5],
                    sourceIcon: contentMatch[6],
                    shortTitle: contentMatch[7]
                });
            }

            parts.push({
                type: 'related-content',
                content: contentBlock,
                title,
                relatedItems
            });
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push({
            type: 'text',
            content: content.substring(lastIndex)
        });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
};
