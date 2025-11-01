// Mock Data cho Faculty Module
export const mockFAQData = [
  {
    id: 1,
    question: "Sự khác biệt giữa Interface và Abstract Class?",
    answer: "Interface chỉ chứa khai báo phương thức, không có implementation. Abstract class có thể chứa cả khai báo và implementation của phương thức. Interface hỗ trợ đa kế thừa, Abstract class chỉ hỗ trợ đơn kế thừa.",
    course: "Lập trình hướng đối tượng",
    tags: ["OOP", "Java", "Interface", "Abstract"],
    usageCount: 45,
    createdAt: "2024-01-15T10:30:00Z",
    updatedBy: "Nguyễn Văn A"
  },
  {
    id: 2,
    question: "Design Pattern Singleton hoạt động như thế nào?",
    answer: "Singleton Pattern đảm bảo một class chỉ có duy nhất một instance và cung cấp global access point đến instance đó. Thường được implement bằng private constructor và static method getInstance().",
    course: "Công nghệ phần mềm",
    tags: ["Design Pattern", "Singleton", "Java"],
    usageCount: 38,
    createdAt: "2024-01-20T14:15:00Z",
    updatedBy: "Trần Thị B"
  },
  {
    id: 3,
    question: "Cách implement Observer Pattern?",
    answer: "Observer Pattern định nghĩa mối quan hệ 1-n giữa objects. Khi object thay đổi state, tất cả dependents sẽ được notify tự động. Gồm Subject (Observable) và Observer interface.",
    course: "Công nghệ phần mềm",
    tags: ["Design Pattern", "Observer", "Behavioral"],
    usageCount: 29,
    createdAt: "2024-02-01T09:45:00Z",
    updatedBy: "Lê Văn C"
  },
  {
    id: 4,
    question: "Unit Testing là gì và tại sao quan trọng?",
    answer: "Unit Testing là việc kiểm thử từng đơn vị nhỏ nhất của code (method, function). Giúp phát hiện lỗi sớm, dễ maintain code, tăng confidence khi refactor.",
    course: "Kiểm thử phần mềm",
    tags: ["Testing", "Unit Test", "Quality"],
    usageCount: 52,
    createdAt: "2024-02-10T11:20:00Z",
    updatedBy: "Phạm Thị D"
  },
  {
    id: 5,
    question: "Normalization trong Database là gì?",
    answer: "Normalization là quá trình tổ chức dữ liệu để giảm redundancy và dependency. Gồm các normal forms: 1NF, 2NF, 3NF, BCNF. Mục đích là tránh anomalies khi insert/update/delete.",
    course: "Cơ sở dữ liệu",
    tags: ["Database", "Normalization", "Design"],
    usageCount: 41,
    createdAt: "2024-02-15T16:30:00Z",
    updatedBy: "Hoàng Văn E"
  },
  {
    id: 6,
    question: "SOLID Principles trong OOP?",
    answer: "SOLID gồm 5 nguyên tắc: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Giúp code dễ maintain, extend và test.",
    course: "Lập trình hướng đối tượng",
    tags: ["OOP", "SOLID", "Principles"],
    usageCount: 67,
    createdAt: "2024-02-20T13:45:00Z",
    updatedBy: "Nguyễn Văn A"
  },
  {
    id: 7,
    question: "Agile và Waterfall khác nhau như thế nào?",
    answer: "Waterfall là mô hình tuần tự, hoàn thành từng phase mới chuyển sang phase tiếp theo. Agile là mô hình lặp, phát triển theo sprint ngắn, linh hoạt với thay đổi requirements.",
    course: "Quản lý dự án phần mềm",
    tags: ["Agile", "Waterfall", "Methodology"],
    usageCount: 33,
    createdAt: "2024-02-25T10:15:00Z",
    updatedBy: "Trần Thị B"
  },
  {
    id: 8,
    question: "REST API design best practices?",
    answer: "Sử dụng HTTP methods đúng (GET, POST, PUT, DELETE), resource-based URLs, status codes chuẩn, versioning, authentication/authorization, rate limiting, documentation đầy đủ.",
    course: "Phát triển ứng dụng web",
    tags: ["REST", "API", "Web Development"],
    usageCount: 44,
    createdAt: "2024-03-01T15:20:00Z",
    updatedBy: "Lê Văn C"
  },
  {
    id: 9,
    question: "Git branching strategy nào tốt nhất?",
    answer: "Git Flow cho dự án lớn với main, develop, feature, release, hotfix branches. GitHub Flow đơn giản hơn với main và feature branches. Chọn strategy phù hợp với team size và project complexity.",
    course: "Công cụ phát triển phần mềm",
    tags: ["Git", "Version Control", "Workflow"],
    usageCount: 28,
    createdAt: "2024-03-05T12:30:00Z",
    updatedBy: "Phạm Thị D"
  },
  {
    id: 10,
    question: "Microservices vs Monolithic architecture?",
    answer: "Monolithic: tất cả components trong 1 application, deploy cùng lúc, dễ develop ban đầu. Microservices: chia thành services nhỏ, deploy độc lập, scalable nhưng phức tạp hơn về infrastructure.",
    course: "Kiến trúc phần mềm",
    tags: ["Architecture", "Microservices", "Monolithic"],
    usageCount: 36,
    createdAt: "2024-03-10T14:45:00Z",
    updatedBy: "Hoàng Văn E"
  }
];

export const mockFlaggedConversations = [
  {
    id: "F-101",
    conversationId: "C-5501",
    student: {
      id: "SV001",
      name: "Nguyễn Văn An",
      avatar: "https://i.pravatar.cc/150?img=1"
    },
    course: "Công nghệ phần mềm",
    excerpt: "Hướng dẫn tách module bằng interface là sai",
    flagReason: "Thông tin không chính xác",
    aiConfidence: 28,
    status: "Mới",
    priority: "Cao",
    flaggedAt: "2024-10-17T10:20:00Z",
    assignedTo: null,
    messages: [
      {
        id: "M1",
        author: { name: "Nguyễn Văn An", role: "student" },
        content: "Em muốn hỏi về cách tách module trong kiến trúc phần mềm?",
        timestamp: "2024-10-17T10:15:00Z",
        sourceLabel: "Sinh viên"
      },
      {
        id: "M2",
        author: { name: "Hannah AI", role: "ai" },
        content: "Để tách module, bạn nên sử dụng interface. Interface giúp tạo ra abstraction layer giữa các modules...",
        timestamp: "2024-10-17T10:16:00Z",
        sourceLabel: "AI tạo",
        aiConfidence: 28
      }
    ],
    metadata: {
      roadmapNode: "Module 3: Kiến trúc phần mềm",
      aiModel: "GPT-4",
      sources: ["Design Patterns - Gang of Four", "Clean Architecture - Robert Martin"]
    },
    auditTrail: [
      {
        action: "Gắn cờ",
        user: "Nguyễn Văn An",
        timestamp: "2024-10-17T10:20:00Z",
        details: "Sinh viên báo cáo thông tin không chính xác"
      }
    ]
  },
  {
    id: "F-102",
    conversationId: "C-5502",
    student: {
      id: "SV002",
      name: "Trần Thị Bình",
      avatar: "https://i.pravatar.cc/150?img=2"
    },
    course: "Lập trình hướng đối tượng",
    excerpt: "AI giải thích sai về Polymorphism",
    flagReason: "Giải thích khó hiểu",
    aiConfidence: 45,
    status: "Đang xử lý",
    priority: "Trung bình",
    flaggedAt: "2024-10-17T09:30:00Z",
    assignedTo: "Nguyễn Văn A",
    messages: [
      {
        id: "M3",
        author: { name: "Trần Thị Bình", role: "student" },
        content: "Polymorphism trong Java hoạt động như thế nào ạ?",
        timestamp: "2024-10-17T09:25:00Z",
        sourceLabel: "Sinh viên"
      },
      {
        id: "M4",
        author: { name: "Hannah AI", role: "ai" },
        content: "Polymorphism cho phép một object có nhiều hình thái khác nhau...",
        timestamp: "2024-10-17T09:26:00Z",
        sourceLabel: "AI tạo",
        aiConfidence: 45
      }
    ],
    metadata: {
      roadmapNode: "Module 2: OOP Principles",
      aiModel: "GPT-4",
      sources: ["Java: The Complete Reference"]
    },
    auditTrail: [
      {
        action: "Gắn cờ",
        user: "Trần Thị Bình",
        timestamp: "2024-10-17T09:30:00Z",
        details: "Giải thích khó hiểu"
      },
      {
        action: "Phân công",
        user: "Admin",
        timestamp: "2024-10-17T09:45:00Z",
        details: "Phân công cho Nguyễn Văn A"
      }
    ]
  },
  {
    id: "F-103",
    conversationId: "C-5503",
    student: {
      id: "SV003",
      name: "Lê Văn Cường",
      avatar: "https://i.pravatar.cc/150?img=3"
    },
    course: "Cơ sở dữ liệu",
    excerpt: "Câu trả lời về JOIN không đầy đủ",
    flagReason: "Thiếu thông tin",
    aiConfidence: 62,
    status: "Đã giải quyết",
    priority: "Thấp",
    flaggedAt: "2024-10-16T14:20:00Z",
    assignedTo: "Hoàng Văn E",
    messages: [
      {
        id: "M5",
        author: { name: "Lê Văn Cường", role: "student" },
        content: "Các loại JOIN trong SQL có gì khác nhau ạ?",
        timestamp: "2024-10-16T14:15:00Z",
        sourceLabel: "Sinh viên"
      },
      {
        id: "M6",
        author: { name: "Hannah AI", role: "ai" },
        content: "Có 4 loại JOIN chính: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN...",
        timestamp: "2024-10-16T14:16:00Z",
        sourceLabel: "AI tạo",
        aiConfidence: 62
      },
      {
        id: "M7",
        author: { name: "Hoàng Văn E", role: "faculty" },
        content: "Để bổ sung thêm, còn có CROSS JOIN và SELF JOIN nữa nhé em.",
        timestamp: "2024-10-16T15:30:00Z",
        sourceLabel: "Giảng viên chỉnh sửa"
      }
    ],
    metadata: {
      roadmapNode: "Module 4: SQL Joins",
      aiModel: "GPT-4",
      sources: ["Database System Concepts"]
    },
    auditTrail: [
      {
        action: "Gắn cờ",
        user: "Lê Văn Cường",
        timestamp: "2024-10-16T14:20:00Z",
        details: "Thiếu thông tin về CROSS JOIN và SELF JOIN"
      },
      {
        action: "Phân công",
        user: "Admin",
        timestamp: "2024-10-16T14:25:00Z",
        details: "Phân công cho Hoàng Văn E"
      },
      {
        action: "Trả lời",
        user: "Hoàng Văn E",
        timestamp: "2024-10-16T15:30:00Z",
        details: "Đã bổ sung thông tin về CROSS JOIN và SELF JOIN"
      },
      {
        action: "Đánh dấu đã giải quyết",
        user: "Hoàng Văn E",
        timestamp: "2024-10-16T15:35:00Z",
        details: "Đã cung cấp thông tin đầy đủ"
      }
    ]
  }
];

export const mockMaterialsData = {
  semesters: [
    {
      id: "HK1-2024",
      name: "HK1 2024-2025",
      courses: [
        {
          id: "CNPM",
          code: "IT3180",
          name: "Công nghệ phần mềm",
          materials: [
            {
              id: "M1",
              fileName: "Bai_giang_CNPM_Chuong1.pdf",
              size: "2.5 MB",
              uploadedAt: "2024-09-01T08:00:00Z",
              uploadedBy: "Nguyễn Văn A",
              url: "#"
            },
            {
              id: "M2",
              fileName: "Design_Patterns_Overview.pdf",
              size: "4.2 MB",
              uploadedAt: "2024-09-05T10:30:00Z",
              uploadedBy: "Trần Thị B",
              url: "#"
            },
            {
              id: "M3",
              fileName: "Software_Architecture_Principles.pdf",
              size: "3.8 MB",
              uploadedAt: "2024-09-10T14:15:00Z",
              uploadedBy: "Nguyễn Văn A",
              url: "#"
            }
          ]
        },
        {
          id: "OOP",
          code: "IT3200",
          name: "Lập trình hướng đối tượng",
          materials: [
            {
              id: "M4",
              fileName: "OOP_Fundamentals.pdf",
              size: "3.1 MB",
              uploadedAt: "2024-09-02T09:00:00Z",
              uploadedBy: "Lê Văn C",
              url: "#"
            },
            {
              id: "M5",
              fileName: "Java_Advanced_Topics.pdf",
              size: "5.7 MB",
              uploadedAt: "2024-09-08T11:45:00Z",
              uploadedBy: "Lê Văn C",
              url: "#"
            }
          ]
        },
        {
          id: "DB",
          code: "IT3160",
          name: "Cơ sở dữ liệu",
          materials: [
            {
              id: "M6",
              fileName: "Database_Design_Fundamentals.pdf",
              size: "4.5 MB",
              uploadedAt: "2024-09-03T13:20:00Z",
              uploadedBy: "Hoàng Văn E",
              url: "#"
            },
            {
              id: "M7",
              fileName: "SQL_Advanced_Queries.pdf",
              size: "2.9 MB",
              uploadedAt: "2024-09-12T16:30:00Z",
              uploadedBy: "Hoàng Văn E",
              url: "#"
            }
          ]
        }
      ]
    },
    {
      id: "HK2-2023",
      name: "HK2 2023-2024",
      courses: [
        {
          id: "WEB",
          code: "IT4409",
          name: "Phát triển ứng dụng web",
          materials: [
            {
              id: "M8",
              fileName: "Web_Development_Basics.pdf",
              size: "3.3 MB",
              uploadedAt: "2024-02-01T10:00:00Z",
              uploadedBy: "Phạm Thị D",
              url: "#"
            },
            {
              id: "M9",
              fileName: "React_Advanced_Patterns.pdf",
              size: "4.1 MB",
              uploadedAt: "2024-02-15T14:20:00Z",
              uploadedBy: "Phạm Thị D",
              url: "#"
            }
          ]
        }
      ]
    }
  ]
};

export const mockAnalyticsData = {
  overview: {
    totalQuestions: 1234,
    topCourse: "Lập trình hướng đối tượng",
    topTopic: "Design Patterns"
  },
  courseStats: [
    { course: "Lập trình hướng đối tượng", count: 450 },
    { course: "Công nghệ phần mềm", count: 380 },
    { course: "Cơ sở dữ liệu", count: 320 },
    { course: "Phát triển ứng dụng web", count: 280 },
    { course: "Kiểm thử phần mềm", count: 240 }
  ],
  trendData: [
    { date: "2024-10-11", count: 45, topQuestion: "Singleton pattern hoạt động như thế nào?" },
    { date: "2024-10-12", count: 52, topQuestion: "Cách implement Observer pattern trong Java?" },
    { date: "2024-10-13", count: 38, topQuestion: "Phân biệt Abstract Factory và Factory Method?" },
    { date: "2024-10-14", count: 61, topQuestion: "Cách tối ưu hóa query trong SQL?" },
    { date: "2024-10-15", count: 48, topQuestion: "Unit testing với JUnit như thế nào?" },
    { date: "2024-10-16", count: 55, topQuestion: "Cách sử dụng React Hooks hiệu quả?" },
    { date: "2024-10-17", count: 43, topQuestion: "Microservices architecture có ưu điểm gì?" }
  ],
  recentQuestions: [
    {
      id: 1,
      student: "Nguyễn Văn A",
      content: "Singleton pattern hoạt động như thế nào?",
      course: "Công nghệ phần mềm",
      timestamp: "2024-10-17T14:30:00Z"
    },
    {
      id: 2,
      student: "Trần Thị B",
      content: "Cách implement Observer pattern trong Java?",
      course: "Lập trình hướng đối tượng",
      timestamp: "2024-10-17T14:15:00Z"
    },
    {
      id: 3,
      student: "Lê Văn C",
      content: "Normalization trong database có mấy dạng?",
      course: "Cơ sở dữ liệu",
      timestamp: "2024-10-17T13:45:00Z"
    },
    {
      id: 4,
      student: "Phạm Thị D",
      content: "Unit testing với JUnit như thế nào?",
      course: "Kiểm thử phần mềm",
      timestamp: "2024-10-17T13:20:00Z"
    },
    {
      id: 5,
      student: "Hoàng Văn E",
      content: "React hooks useEffect hoạt động ra sao?",
      course: "Phát triển ứng dụng web",
      timestamp: "2024-10-17T12:50:00Z"
    },
    {
      id: 6,
      student: "Ngô Thị F",
      content: "SOLID principles trong OOP là gì?",
      course: "Lập trình hướng đối tượng",
      timestamp: "2024-10-17T12:30:00Z"
    },
    {
      id: 7,
      student: "Đặng Văn G",
      content: "Agile và Waterfall khác nhau như thế nào?",
      course: "Quản lý dự án phần mềm",
      timestamp: "2024-10-17T11:45:00Z"
    },
    {
      id: 8,
      student: "Vũ Thị H",
      content: "REST API design best practices?",
      course: "Phát triển ứng dụng web",
      timestamp: "2024-10-17T11:20:00Z"
    },
    {
      id: 9,
      student: "Bùi Văn I",
      content: "Git branching strategy nào tốt nhất?",
      course: "Công cụ phát triển phần mềm",
      timestamp: "2024-10-17T10:55:00Z"
    },
    {
      id: 10,
      student: "Đinh Thị K",
      content: "Microservices vs Monolithic architecture?",
      course: "Kiến trúc phần mềm",
      timestamp: "2024-10-17T10:30:00Z"
    }
  ]
};

export const mockQuizData = {
  overview: {
    totalQuizzes: 25,
    averageScore: 7.2,
    completionRate: 85
  },
  quizzes: [
    {
      id: "Q1",
      name: "Kiểm tra OOP - Tuần 5",
      course: "Lập trình hướng đối tượng",
      studentCount: 120,
      averageScore: 6.8,
      averageCorrectRate: 68,
      createdAt: "2024-10-10T08:00:00Z",
      questions: [
        {
          id: "Q1-1",
          content: "Đặc điểm nào KHÔNG phải của Encapsulation?",
          topic: "OOP Principles",
          correctRate: 45,
          isGap: true
        },
        {
          id: "Q1-2",
          content: "Polymorphism là gì?",
          topic: "OOP Principles",
          correctRate: 78,
          isGap: false
        },
        {
          id: "Q1-3",
          content: "Inheritance cho phép làm gì?",
          topic: "OOP Principles",
          correctRate: 82,
          isGap: false
        },
        {
          id: "Q1-4",
          content: "Abstract class khác Interface như thế nào?",
          topic: "OOP Advanced",
          correctRate: 42,
          isGap: true
        },
        {
          id: "Q1-5",
          content: "Overloading và Overriding khác nhau ra sao?",
          topic: "OOP Advanced",
          correctRate: 65,
          isGap: false
        }
      ],
      scoreDistribution: [
        { range: "0-2", count: 5 },
        { range: "3-5", count: 15 },
        { range: "6-8", count: 60 },
        { range: "9-10", count: 40 }
      ],
      students: [
        {
          id: "SV001",
          name: "Nguyễn Văn An",
          score: 8.5,
          correctCount: 17,
          totalQuestions: 20,
          completedAt: "2024-10-15T16:30:00Z"
        },
        {
          id: "SV002",
          name: "Trần Thị Bình",
          score: 7.2,
          correctCount: 14,
          totalQuestions: 20,
          completedAt: "2024-10-15T16:25:00Z"
        },
        {
          id: "SV003",
          name: "Lê Văn Cường",
          score: 9.1,
          correctCount: 18,
          totalQuestions: 20,
          completedAt: "2024-10-15T16:20:00Z"
        },
        {
          id: "SV004",
          name: "Phạm Thị Dung",
          score: 6.5,
          correctCount: 13,
          totalQuestions: 20,
          completedAt: "2024-10-15T16:15:00Z"
        },
        {
          id: "SV005",
          name: "Hoàng Văn Em",
          score: 5.8,
          correctCount: 11,
          totalQuestions: 20,
          completedAt: "2024-10-15T16:10:00Z"
        }
      ]
    }
  ]
};

export const mockLearningOutcomesData = [
  {
    courseId: "OOP",
    courseName: "Lập trình hướng đối tượng",
    outcomes: [
      {
        id: "LO1",
        text: "Hiểu và áp dụng được 4 nguyên lý OOP (Encapsulation, Inheritance, Polymorphism, Abstraction)",
        completed: false
      },
      {
        id: "LO2",
        text: "Thiết kế class diagram cho hệ thống nhỏ",
        completed: true
      },
      {
        id: "LO3",
        text: "Implement Design Patterns cơ bản (Singleton, Observer, Factory)",
        completed: false
      },
      {
        id: "LO4",
        text: "Viết unit test cho các class đã thiết kế",
        completed: true
      },
      {
        id: "LO5",
        text: "Áp dụng SOLID principles trong thiết kế code",
        completed: false
      }
    ],
    challenges: [
      {
        id: "CH1",
        text: "Sinh viên hay nhầm lẫn giữa Abstraction và Encapsulation"
      },
      {
        id: "CH2",
        text: "Khó khăn trong việc xác định mối quan hệ giữa các class"
      },
      {
        id: "CH3",
        text: "Không biết khi nào nên sử dụng Inheritance vs Composition"
      },
      {
        id: "CH4",
        text: "Thiết kế Design Pattern không phù hợp với bài toán"
      }
    ],
    syncStatus: "synced",
    lastSync: "2024-10-17T12:00:00Z"
  },
  {
    courseId: "CNPM",
    courseName: "Công nghệ phần mềm",
    outcomes: [
      {
        id: "LO6",
        text: "Phân tích và thiết kế requirements cho dự án phần mềm",
        completed: true
      },
      {
        id: "LO7",
        text: "Áp dụng các Design Patterns trong kiến trúc phần mềm",
        completed: false
      },
      {
        id: "LO8",
        text: "Thiết kế kiến trúc Microservices",
        completed: false
      },
      {
        id: "LO9",
        text: "Implement CI/CD pipeline cơ bản",
        completed: true
      },
      {
        id: "LO10",
        text: "Viết documentation kỹ thuật đầy đủ",
        completed: false
      }
    ],
    challenges: [
      {
        id: "CH5",
        text: "Khó khăn trong việc ước lượng effort cho các task"
      },
      {
        id: "CH6",
        text: "Không biết cách decompose requirements thành user stories"
      },
      {
        id: "CH7",
        text: "Thiết kế architecture không scalable"
      },
      {
        id: "CH8",
        text: "Documentation không đầy đủ hoặc không cập nhật"
      }
    ],
    syncStatus: "pending",
    lastSync: "2024-10-16T10:30:00Z"
  },
  {
    courseId: "DB",
    courseName: "Cơ sở dữ liệu",
    outcomes: [
      {
        id: "LO11",
        text: "Thiết kế ERD cho hệ thống thực tế",
        completed: true
      },
      {
        id: "LO12",
        text: "Normalize database đến 3NF",
        completed: false
      },
      {
        id: "LO13",
        text: "Viết complex SQL queries với JOIN, subquery",
        completed: true
      },
      {
        id: "LO14",
        text: "Tối ưu hóa performance của database",
        completed: false
      },
      {
        id: "LO15",
        text: "Thiết kế và implement stored procedures",
        completed: false
      }
    ],
    challenges: [
      {
        id: "CH9",
        text: "Khó khăn trong việc xác định primary key và foreign key"
      },
      {
        id: "CH10",
        text: "Không hiểu rõ các loại JOIN và khi nào sử dụng"
      },
      {
        id: "CH11",
        text: "Thiết kế index không hiệu quả"
      },
      {
        id: "CH12",
        text: "Normalization quá mức dẫn đến performance kém"
      }
    ],
    syncStatus: "synced",
    lastSync: "2024-10-17T11:45:00Z"
  },
  {
    courseId: "WEB",
    courseName: "Phát triển ứng dụng web",
    outcomes: [
      {
        id: "LO16",
        text: "Xây dựng RESTful API với Node.js/Express",
        completed: true
      },
      {
        id: "LO17",
        text: "Phát triển SPA với React/Vue",
        completed: false
      },
      {
        id: "LO18",
        text: "Implement authentication và authorization",
        completed: true
      },
      {
        id: "LO19",
        text: "Deploy ứng dụng lên cloud platform",
        completed: false
      },
      {
        id: "LO20",
        text: "Tối ưu hóa performance frontend",
        completed: false
      }
    ],
    challenges: [
      {
        id: "CH13",
        text: "Khó khăn trong việc quản lý state trong React"
      },
      {
        id: "CH14",
        text: "Không hiểu rõ về asynchronous programming"
      },
      {
        id: "CH15",
        text: "Security vulnerabilities trong web application"
      },
      {
        id: "CH16",
        text: "Cross-browser compatibility issues"
      }
    ],
    syncStatus: "synced",
    lastSync: "2024-10-17T09:20:00Z"
  },
  {
    courseId: "TEST",
    courseName: "Kiểm thử phần mềm",
    outcomes: [
      {
        id: "LO21",
        text: "Thiết kế test cases từ requirements",
        completed: true
      },
      {
        id: "LO22",
        text: "Viết unit tests với coverage > 80%",
        completed: false
      },
      {
        id: "LO23",
        text: "Thực hiện integration testing",
        completed: false
      },
      {
        id: "LO24",
        text: "Sử dụng automation testing tools",
        completed: true
      },
      {
        id: "LO25",
        text: "Phân tích và báo cáo bugs hiệu quả",
        completed: false
      }
    ],
    challenges: [
      {
        id: "CH17",
        text: "Không biết cách viết test cases đầy đủ"
      },
      {
        id: "CH18",
        text: "Mock objects và dependencies khó khăn"
      },
      {
        id: "CH19",
        text: "Test automation setup phức tạp"
      },
      {
        id: "CH20",
        text: "Khó khăn trong việc test UI components"
      }
    ],
    syncStatus: "pending",
    lastSync: "2024-10-15T14:15:00Z"
  }
];

// Faculty members data
export const mockFacultyMembers = [
  { id: "F001", name: "Nguyễn Văn A" },
  { id: "F002", name: "Trần Thị B" },
  { id: "F003", name: "Lê Văn C" },
  { id: "F004", name: "Phạm Thị D" },
  { id: "F005", name: "Hoàng Văn E" }
];

// Course list
export const mockCourses = [
  "Lập trình hướng đối tượng",
  "Công nghệ phần mềm",
  "Cơ sở dữ liệu",
  "Phát triển ứng dụng web",
  "Kiểm thử phần mềm",
  "Quản lý dự án phần mềm",
  "Kiến trúc phần mềm",
  "Công cụ phát triển phần mềm"
];
