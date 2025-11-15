import { 
  mockFAQData, 
  mockFlaggedConversations, 
  mockMaterialsData, 
  mockAnalyticsData, 
  mockQuizData, 
  mockLearningOutcomesData,
  mockFacultyMembers,
  mockCourses 
} from '../data/mockData';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store for flagged quiz attempts (faculty -> admin workflow)
interface FlaggedQuizMeta {
  reason: string;
  flaggedAt: string;
  status: 'pending' | 'resolved';
  resolutionNote?: string;
  fixAction?: string;
  resolvedAt?: string;
}
const flaggedQuizAttempts: Record<string, FlaggedQuizMeta> = {
  // Seed demo data so admin page has initial rows
  '1': {
    reason: 'Question 3 explanation seems incorrect',
    flaggedAt: '2024-10-23T09:15:00Z',
    status: 'pending'
  },
  '4': {
    reason: 'Low score – potential misleading wording',
    flaggedAt: '2024-10-22T16:45:00Z',
    status: 'pending'
  },
  '2': {
    reason: 'Need review of JOIN definitions',
    flaggedAt: '2024-10-21T11:05:00Z',
    status: 'resolved',
    resolutionNote: 'Reviewed JOIN definitions; no incorrect statements found.',
    fixAction: 'Provided clarification in course materials.',
    resolvedAt: '2024-10-23T10:00:00Z'
  }
};

// FAQ API
export const getFAQs = async (filters: any = {}) => {
  await delay();
  let data = [...mockFAQData];
  
  if (filters.course) {
    data = data.filter(faq => faq.course === filters.course);
  }
  
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    data = data.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm) ||
      faq.answer.toLowerCase().includes(searchTerm) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
  
  if (filters.tags && filters.tags.length > 0) {
    data = data.filter(faq => 
      filters.tags.some((tag: string) => faq.tags.includes(tag))
    );
  }
  
  return { data, total: data.length };
};

export const createFAQ = async (faqData: any) => {
  await delay(300);
  const newFAQ = {
    id: mockFAQData.length + 1,
    ...faqData,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedBy: "Current User"
  };
  mockFAQData.push(newFAQ);
  return { success: true, data: newFAQ };
};

export const updateFAQ = async (id: any, faqData: any) => {
  await delay(300);
  const index = mockFAQData.findIndex(faq => faq.id === id);
  if (index !== -1) {
    mockFAQData[index] = { ...mockFAQData[index], ...faqData };
    return { success: true, data: mockFAQData[index] };
  }
  return { success: false, error: "FAQ not found" };
};

export const deleteFAQ = async (id: any) => {
  await delay(300);
  const index = mockFAQData.findIndex(faq => faq.id === id);
  if (index !== -1) {
    mockFAQData.splice(index, 1);
    return { success: true };
  }
  return { success: false, error: "FAQ not found" };
};

// Flagged Conversations API
export const getFlaggedConversations = async (filters: any = {}) => {
  await delay();
  let data = [...mockFlaggedConversations];
  
  // Filter by faculty - only show pending or handled by current faculty
  if (filters.facultyId) {
    data = data.filter(conv => 
      conv.status === 'Mới' || 
      conv.assignedTo === filters.facultyName
    );
  }
  
  if (filters.status && filters.status !== 'all') {
    const statusMap: { [key: string]: string } = {
      'pending': 'Mới',
      'reviewed': 'Đang xử lý',
      'resolved': 'Đã giải quyết'
    };
    data = data.filter(conv => conv.status === statusMap[filters.status]);
  }
  
  if (filters.course) {
    data = data.filter(conv => conv.course === filters.course);
  }
  
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    data = data.filter(conv => 
      conv.student.name.toLowerCase().includes(searchTerm) ||
      conv.excerpt.toLowerCase().includes(searchTerm) ||
      conv.course.toLowerCase().includes(searchTerm)
    );
  }
  
  if (filters.dateFrom) {
    data = data.filter(conv => new Date(conv.flaggedAt) >= new Date(filters.dateFrom));
  }
  
  if (filters.dateTo) {
    data = data.filter(conv => new Date(conv.flaggedAt) <= new Date(filters.dateTo + 'T23:59:59'));
  }
  
  if (filters.priority) {
    data = data.filter(conv => conv.priority === filters.priority);
  }
  
  return { data, total: data.length };
};

export const getConversationDetail = async (id: any) => {
  await delay(300);
  const conversation = mockFlaggedConversations.find(conv => conv.id === id);
  return conversation ? { success: true, data: conversation } : { success: false, error: "Conversation not found" };
};

export const updateConversationStatus = async (id: any, newStatus: any, facultyName?: string) => {
  await delay(300);
  const conversation = mockFlaggedConversations.find(conv => conv.id === id);
  if (conversation) {
    conversation.status = newStatus;
    if (facultyName) {
      conversation.assignedTo = facultyName;
    }
    conversation.auditTrail.push({
      action: newStatus === 'Đang xử lý' ? 'Đã xem xét' : 'Đã giải quyết',
      user: facultyName || 'Unknown',
      timestamp: new Date().toISOString(),
      details: `Chuyển trạng thái sang ${newStatus}`
    });
    return { success: true, data: conversation };
  }
  return { success: false, error: "Conversation not found" };
};

export const assignConversation = async (id: any, facultyId: any, auditEntry: any) => {
  await delay(300);
  const conversation = mockFlaggedConversations.find(conv => conv.id === id);
  if (conversation) {
    const faculty = mockFacultyMembers.find(f => f.id === facultyId);
    conversation.assignedTo = faculty ? faculty.name : null;
    conversation.auditTrail.push({
      ...auditEntry,
      timestamp: new Date().toISOString()
    });
    return { success: true, data: conversation };
  }
  return { success: false, error: "Conversation not found" };
};

export const addConversationReply = async (id: any, replyData: any, auditEntry: any) => {
  await delay(300);
  const conversation = mockFlaggedConversations.find(conv => conv.id === id);
  if (conversation) {
    const newMessage = {
      id: `M${conversation.messages.length + 1}`,
      author: { name: replyData.author, role: "faculty" },
      content: replyData.content,
      timestamp: new Date().toISOString(),
      sourceLabel: "Giảng viên trả lời"
    };
    conversation.messages.push(newMessage);
    conversation.auditTrail.push({
      ...auditEntry,
      timestamp: new Date().toISOString()
    });
    return { success: true, data: conversation };
  }
  return { success: false, error: "Conversation not found" };
};

export const updateAIResponse = async (conversationId: any, messageId: any, newContent: any) => {
  await delay(300);
  const conversation = mockFlaggedConversations.find(conv => conv.id === conversationId);
  if (!conversation) {
    return { success: false, error: "Conversation not found" };
  }

  const message = conversation.messages.find(msg => msg.id === messageId);
  if (!message) {
    return { success: false, error: "Message not found" };
  }

  if (message.author.role !== 'ai') {
    return { success: false, error: "Message is not from AI" };
  }

  // Update the message content
  message.content = newContent;
  (message as any).editedAt = new Date().toISOString();

  return { success: true, data: conversation };
};

// Materials API
export const getMaterials = async () => {
  await delay();
  return { success: true, data: mockMaterialsData };
};

export const uploadMaterial = async (materialData: any) => {
  await delay(800);
  const { semesterId, courseId, file, learningObjectives, commonChallenges } = materialData;

  const semester = mockMaterialsData.semesters.find(s => s.id === semesterId);
  if (!semester) return { success: false, error: "Semester not found" };

  const course = semester.courses.find(c => c.id === courseId);
  if (!course) return { success: false, error: "Course not found" };

  const newMaterial = {
    id: `M${Date.now()}`,
    fileName: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Current User",
    url: "#",
    learningObjectives: learningObjectives || "",
    commonChallenges: commonChallenges || ""
  };

  course.materials.push(newMaterial);
  return { success: true, data: newMaterial };
};

export const updateMaterial = async (materialId: string, updateData: any) => {
  await delay(300);

  // Find the material across all semesters and courses
  for (const semester of mockMaterialsData.semesters) {
    for (const course of semester.courses) {
      const material = course.materials.find(m => m.id === materialId);
      if (material) {
        Object.assign(material, updateData);
        return { success: true, data: material };
      }
    }
  }

  return { success: false, error: "Material not found" };
};

export const deleteMaterial = async (semesterId: string, courseId: string, materialId: string) => {
  await delay(300);
  const semester = mockMaterialsData.semesters.find(s => s.id === semesterId);
  if (!semester) return { success: false, error: "Semester not found" };

  const course = semester.courses.find(c => c.id === courseId);
  if (!course) return { success: false, error: "Course not found" };

  const materialIndex = course.materials.findIndex(m => m.id === materialId);
  if (materialIndex !== -1) {
    course.materials.splice(materialIndex, 1);
    return { success: true };
  }
  return { success: false, error: "Material not found" };
};

export const addCourse = async (semesterId: string, courseData: { code: any; name: any; }) => {
  await delay(300);
  const semester = mockMaterialsData.semesters.find(s => s.id === semesterId);
  if (!semester) return { success: false, error: "Semester not found" };
  
  const newCourse = {
    id: courseData.code,
    code: courseData.code,
    name: courseData.name,
    materials: []
  };
  
  semester.courses.push(newCourse);
  return { success: true, data: newCourse };
};

// Analytics API
export const getAnalytics = async (filters: any = {}) => {
  await delay();
  // Simulate filtering by date range
  let data = { ...mockAnalyticsData };
  
  if (filters.dateRange) {
    // Filter trend data based on date range
    // This is a simplified implementation
    data.trendData = mockAnalyticsData.trendData.slice(-filters.dateRange);
  }
  
  return { success: true, data };
};

// Quiz Knowledge Gap API
export const getQuizData = async (filters: any = {}) => {
  await delay();
  let data = { ...mockQuizData };
  
  if (filters.course) {
    data.quizzes = data.quizzes.filter((quiz: any) => quiz.course === filters.course);
  }
  
  return { success: true, data };
};

export const getQuizDetail = async (quizId: string) => {
  await delay(300);
  const quiz = mockQuizData.quizzes.find(q => q.id === quizId);
  return quiz ? { success: true, data: quiz } : { success: false, error: "Quiz not found" };
};

// Detailed Quiz Attempt API (for a single student's attempt)
export const getQuizAttemptDetail = async (attemptId: string) => {
  await delay(300);
  // Mock attempts map based on the IDs shown in QuestionAnalytics recentQuizzes (1..5)
  const attempts: Record<string, any> = {
    '1': {
      id: '1',
      studentName: 'Nguyễn Văn A',
      studentId: 'SE123456',
      topic: 'Recursion',
      course: 'Software Engineering',
      score: 7,
      maxScore: 10,
      percentage: 70,
      questionsCount: 10,
      timestamp: '2024-10-22T14:30:00',
      difficulty: 'hard',
      questions: [
        {
          id: 'Q-1',
          content: 'What is the base case in recursion?',
          options: [
            'The condition to stop recursion',
            'The step that calls the function again',
            'A syntax requirement',
            'An optimization technique'
          ],
          correctIndex: 0,
          selectedIndex: 0,
          explanation: 'Base case prevents infinite recursion by defining a stopping condition.'
        },
        {
          id: 'Q-2',
          content: 'Which scenario is best solved with recursion?',
          options: ['Iterating a fixed array', 'Computing factorial', 'Sorting with loops', 'Reading a file'],
          correctIndex: 1,
          selectedIndex: 1
        },
        {
          id: 'Q-3',
          content: 'Tail recursion is...',
          options: [
            'A recursion that has multiple base cases',
            'A recursion where the recursive call is the last operation',
            'Recursion with memoization',
            'Not recommended in any language'
          ],
          correctIndex: 1,
          selectedIndex: 2
        },
        {
          id: 'Q-4',
          content: 'Common issue causing stack overflow in recursion?',
          options: ['Too many nested loops', 'Missing or incorrect base case', 'Using large arrays', 'Network delays'],
          correctIndex: 1,
          selectedIndex: 1
        },
        {
          id: 'Q-5',
          content: 'Complexity of naive Fibonacci recursion?',
          options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(2^n)'],
          correctIndex: 3,
          selectedIndex: 3
        }
      ]
    },
    '2': {
      id: '2',
      studentName: 'Trần Thị B',
      studentId: 'SE123457',
      topic: 'SQL Joins',
      course: 'Database Systems',
      score: 8,
      maxScore: 10,
      percentage: 80,
      questionsCount: 10,
      timestamp: '2024-10-22T13:15:00',
      difficulty: 'medium',
      questions: [
        {
          id: 'Q-1',
          content: 'Which join returns only matching rows from both tables?',
          options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN'],
          correctIndex: 2,
          selectedIndex: 2
        },
        {
          id: 'Q-2',
          content: 'Which join returns all rows from the left table and matched rows from the right table?',
          options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'],
          correctIndex: 1,
          selectedIndex: 1
        }
      ]
    },
    '3': {
      id: '3',
      studentName: 'Lê Văn C',
      studentId: 'SE123458',
      topic: 'Sorting Algorithms',
      course: 'Data Structures',
      score: 6,
      maxScore: 10,
      percentage: 60,
      questionsCount: 10,
      timestamp: '2024-10-22T11:45:00',
      difficulty: 'medium',
      questions: [
        {
          id: 'Q-1',
          content: 'Average time complexity of QuickSort?',
          options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
          correctIndex: 1,
          selectedIndex: 2
        },
        {
          id: 'Q-2',
          content: 'Stable sorting algorithm?',
          options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Selection Sort'],
          correctIndex: 0,
          selectedIndex: 0
        }
      ]
    },
    '4': {
      id: '4',
      studentName: 'Phạm Thị D',
      studentId: 'SE123459',
      topic: 'OOP Principles',
      course: 'Software Engineering',
      score: 5,
      maxScore: 10,
      percentage: 50,
      questionsCount: 10,
      timestamp: '2024-10-21T16:20:00',
      difficulty: 'hard',
      questions: [
        {
          id: 'Q-1',
          content: 'Which principle hides internal details?',
          options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'],
          correctIndex: 2,
          selectedIndex: 3
        }
      ]
    },
    '5': {
      id: '5',
      studentName: 'Hoàng Văn E',
      studentId: 'SE123460',
      topic: 'Normalization',
      course: 'Database Systems',
      score: 9,
      maxScore: 10,
      percentage: 90,
      questionsCount: 10,
      timestamp: '2024-10-21T15:00:00',
      difficulty: 'easy',
      questions: [
        {
          id: 'Q-1',
          content: '3NF eliminates which dependency?',
          options: ['Partial', 'Transitive', 'Functional', 'None'],
          correctIndex: 1,
          selectedIndex: 1
        }
      ]
    }
  };

  const found = attempts[attemptId];
  if (!found) {
    return { success: false, error: 'Quiz attempt not found' };
  }
  return { success: true, data: found };
};

// Quiz attempt flagging APIs
export const flagQuizAttempt = async (attemptId: string, reason: string) => {
  await delay(200);
  flaggedQuizAttempts[attemptId] = {
    reason,
    flaggedAt: new Date().toISOString(),
    status: 'pending'
  };
  return { success: true };
};

export const isQuizFlagged = (attemptId: string) => {
  return flaggedQuizAttempts[attemptId] ? { success: true, data: flaggedQuizAttempts[attemptId] } : { success: false };
};

export const getFlaggedQuizAttempts = async () => {
  await delay(200);
  // Build enriched list with basic attempt info (without incurring extra delays per attempt)
  const enriched = Object.entries(flaggedQuizAttempts).map(([id, meta]) => {
    // Reuse quick map structure from getQuizAttemptDetail (duplicate for simplicity) - could refactor later.
    // We call getQuizAttemptDetail synchronously by accessing internal data via another quick call.
    // Since original implementation builds a map each call, we replicate minimal fields here.
    return {
      id,
      ...meta,
    };
  });
  return { success: true, data: enriched };
};

export function getFlaggedQuizAttemptMeta(attemptId: number): FlaggedQuizMeta | undefined {
  return flaggedQuizAttempts[attemptId.toString()];
}

export const resolveFlaggedQuizAttempt = async (attemptId: string, resolutionNote: string, fixAction: string) => {
  await delay(200);
  const meta = flaggedQuizAttempts[attemptId];
  if (!meta) return { success: false, error: 'Not flagged' };
  meta.status = 'resolved';
  meta.resolutionNote = resolutionNote;
  meta.fixAction = fixAction;
  meta.resolvedAt = new Date().toISOString();
  return { success: true, data: meta };
};

export const unflagQuizAttempt = async (attemptId: string) => {
  await delay(150);
  if (!flaggedQuizAttempts[attemptId]) {
    return { success: false, error: 'Not flagged' };
  }
  delete flaggedQuizAttempts[attemptId];
  return { success: true };
};

// Learning Outcomes API
export const getLearningOutcomes = async () => {
  await delay();
  return { success: true, data: mockLearningOutcomesData };
};

export const updateOutcome = async (courseId: string, outcomeId: string, outcomeData: any) => {
  await delay(300);
  const course = mockLearningOutcomesData.find(c => c.courseId === courseId);
  if (!course) return { success: false, error: "Course not found" };
  
  const outcome = course.outcomes.find(o => o.id === outcomeId);
  if (!outcome) return { success: false, error: "Outcome not found" };
  
  Object.assign(outcome, outcomeData);
  return { success: true, data: outcome };
};

export const addOutcome = async (courseId: string, outcomeData: any) => {
  await delay(300);
  const course = mockLearningOutcomesData.find(c => c.courseId === courseId);
  if (!course) return { success: false, error: "Course not found" };
  
  const newOutcome = {
    id: `LO${Date.now()}`,
    ...outcomeData,
    completed: false
  };
  
  course.outcomes.push(newOutcome);
  return { success: true, data: newOutcome };
};

export const deleteOutcome = async (courseId: string, outcomeId: string) => {
  await delay(300);
  const course = mockLearningOutcomesData.find(c => c.courseId === courseId);
  if (!course) return { success: false, error: "Course not found" };
  
  const outcomeIndex = course.outcomes.findIndex(o => o.id === outcomeId);
  if (outcomeIndex !== -1) {
    course.outcomes.splice(outcomeIndex, 1);
    return { success: true };
  }
  return { success: false, error: "Outcome not found" };
};

export const updateChallenge = async (courseId: string, challengeId: string, challengeData: any) => {
  await delay(300);
  const course = mockLearningOutcomesData.find(c => c.courseId === courseId);
  if (!course) return { success: false, error: "Course not found" };
  
  const challenge = course.challenges.find(ch => ch.id === challengeId);
  if (!challenge) return { success: false, error: "Challenge not found" };
  
  Object.assign(challenge, challengeData);
  return { success: true, data: challenge };
};

export const addChallenge = async (courseId: string, challengeData: any) => {
  await delay(300);
  const course = mockLearningOutcomesData.find(c => c.courseId === courseId);
  if (!course) return { success: false, error: "Course not found" };
  
  const newChallenge = {
    id: `CH${Date.now()}`,
    ...challengeData
  };
  
  course.challenges.push(newChallenge);
  return { success: true, data: newChallenge };
};

export const deleteChallenge = async (courseId: string, challengeId: string) => {
  await delay(300);
  const course = mockLearningOutcomesData.find(c => c.courseId === courseId);
  if (!course) return { success: false, error: "Course not found" };
  
  const challengeIndex = course.challenges.findIndex(ch => ch.id === challengeId);
  if (challengeIndex !== -1) {
    course.challenges.splice(challengeIndex, 1);
    return { success: true };
  }
  return { success: false, error: "Challenge not found" };
};

export const syncCourseData = async (courseId: string) => {
  await delay(800);
  const course = mockLearningOutcomesData.find(c => c.courseId === courseId);
  if (!course) return { success: false, error: "Course not found" };
  
  course.syncStatus = "synced";
  course.lastSync = new Date().toISOString();
  return { success: true, data: course };
};

// Utility APIs
export const getFacultyMembers = async () => {
  await delay(200);
  return { success: true, data: mockFacultyMembers };
};

export const getCourses = async () => {
  await delay(200);
  return { success: true, data: mockCourses };
};
