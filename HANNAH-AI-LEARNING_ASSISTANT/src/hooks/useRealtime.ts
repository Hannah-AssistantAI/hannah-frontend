import { useEffect, useRef } from 'react';
import realtimeService from '../service/realtimeService';
import type { RealtimeEventType } from '../service/realtimeService';

/**
 * Hook to connect to the realtime service and listen for events
 * Automatically connects on mount and disconnects on unmount
 */
export function useRealtime() {
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            realtimeService.connect();
        }

        // Cleanup on unmount (optional - keep connection alive for app lifetime)
        // return () => { realtimeService.disconnect(); };
    }, []);

    return {
        isConnected: realtimeService.isConnected,
        connectionState: realtimeService.connectionState,
        joinSubjectGroup: realtimeService.joinSubjectGroup.bind(realtimeService),
        leaveSubjectGroup: realtimeService.leaveSubjectGroup.bind(realtimeService),
    };
}

/**
 * Hook to subscribe to a specific realtime event
 * Automatically unsubscribes on cleanup
 */
export function useRealtimeEvent<T = unknown>(
    eventType: RealtimeEventType,
    callback: (data: T) => void,
    deps: React.DependencyList = []
) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const unsubscribe = realtimeService.on<T>(eventType, (data) => {
            callbackRef.current(data);
        });

        return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventType, ...deps]);
}

/**
 * Hook to subscribe to flag events (FlagCreated, FlagResolved, FlagAssigned)
 */
export function useFlagEvents(callbacks: {
    onFlagCreated?: (data: FlagCreatedData) => void;
    onFlagResolved?: (data: FlagResolvedData) => void;
    onFlagAssigned?: (data: FlagAssignedData) => void;
}) {
    useRealtimeEvent('FlagCreated', callbacks.onFlagCreated || (() => {}));
    useRealtimeEvent('FlagResolved', callbacks.onFlagResolved || (() => {}));
    useRealtimeEvent('FlagAssigned', callbacks.onFlagAssigned || (() => {}));
}

/**
 * Hook to subscribe to quiz events (QuizCompleted, QuizFlagged)
 */
export function useQuizEvents(callbacks: {
    onQuizCompleted?: (data: QuizCompletedData) => void;
    onQuizFlagged?: (data: QuizFlaggedData) => void;
}) {
    useRealtimeEvent('QuizCompleted', callbacks.onQuizCompleted || (() => {}));
    useRealtimeEvent('QuizFlagged', callbacks.onQuizFlagged || (() => {}));
}

/**
 * Hook to subscribe to document events (DocumentUploaded, DocumentProcessed)
 */
export function useDocumentEvents(callbacks: {
    onDocumentUploaded?: (data: DocumentData) => void;
    onDocumentProcessed?: (data: DocumentData) => void;
}) {
    useRealtimeEvent('DocumentUploaded', callbacks.onDocumentUploaded || (() => {}));
    useRealtimeEvent('DocumentProcessed', callbacks.onDocumentProcessed || (() => {}));
}

/**
 * Hook to subscribe to course management events (Subject added/removed from semester)
 */
export function useCourseEvents(callbacks: {
    onSubjectAddedToSemester?: (data: SubjectSemesterData) => void;
    onSubjectRemovedFromSemester?: (data: SubjectRemovedData) => void;
    onSubjectCreated?: (data: SubjectData) => void;
    onSubjectUpdated?: (data: SubjectUpdatedData) => void;
}) {
    useRealtimeEvent('SubjectAddedToSemester', callbacks.onSubjectAddedToSemester || (() => {}));
    useRealtimeEvent('SubjectRemovedFromSemester', callbacks.onSubjectRemovedFromSemester || (() => {}));
    useRealtimeEvent('SubjectCreated', callbacks.onSubjectCreated || (() => {}));
    useRealtimeEvent('SubjectUpdated', callbacks.onSubjectUpdated || (() => {}));
}

// Type definitions for event data
export interface FlagCreatedData {
    flagId: number;
    conversationId: number;
    messageId?: string;
    reason: string;
    subjectId?: number;
    flaggedAt: string;
    status: string;
}

export interface FlagResolvedData {
    flagId: number;
    data: {
        flagId: number;
        conversationId: number;
        resolvedByUserId: number;
        resolvedAt: string;
        status: string;
        hasPendingFlags: boolean;
    };
}

export interface FlagAssignedData {
    flagId: number;
    conversationId: number;
    assignedToUserId: number;
    assignedAt: string;
}

export interface QuizCompletedData {
    quizId: number;
    attemptId: number;
    userId: number;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    completedAt: string;
}

export interface QuizFlaggedData {
    quizId: number;
    attemptId: number;
    flagId: number;
    reason: string;
    flaggedAt: string;
}

export interface DocumentData {
    documentId: number;
    subjectId: number;
    fileName: string;
    status: string;
    uploadedAt?: string;
    processedAt?: string;
}

// Course Management event data types
export interface SubjectSemesterData {
    semesterId: number;
    subject: {
        SubjectId?: number;
        subjectId?: number;
        Code?: string;
        code?: string;
        Name?: string;
        name?: string;
        Semester?: number;
        semester?: number;
        Credits?: number;
        credits?: number;
    };
}

export interface SubjectRemovedData {
    semesterId: number;
    subjectId: number;
}

export interface SubjectData {
    subjectId: number;
    code: string;
    name: string;
    credits?: number;
}

export interface SubjectUpdatedData {
    subjectId: number;
    data: SubjectData;
}

export default useRealtime;
