# Faculty Module

Module Faculty cung cấp giao diện quản lý cho giảng viên với các chức năng:

## Các tính năng

### 1. Quản lý FAQ (📋)
- Quản lý các câu hỏi thường gặp
- Thêm, sửa, xóa FAQ
- Route: `/faculty/faq`

### 2. Hội thoại gắn cờ (🚩)
- Xem các hội thoại được đánh dấu quan trọng
- Hiển thị badge thông báo số lượng hội thoại mới
- Route: `/faculty/conversations`

### 3. Tài liệu học tập (📚)
- Quản lý tài liệu học tập
- Upload và tổ chức tài liệu
- Route: `/faculty/materials`

### 4. Thống kê câu hỏi (📊)
- Xem thống kê và phân tích các câu hỏi
- Báo cáo xu hướng câu hỏi
- Route: `/faculty/analytics`

## Cấu trúc thư mục

```
Faculty/
├── FacultyLayout.tsx          # Layout chính với sidebar
├── FacultyLayout.css          # Styles cho layout
├── index.ts                    # Export chính
├── components/
│   ├── Sidebar.tsx            # Component sidebar
│   └── Sidebar.css            # Styles cho sidebar
├── FAQManagement.tsx          # Trang quản lý FAQ
├── FlaggedConversations.tsx   # Trang hội thoại gắn cờ
├── LearningMaterials.tsx      # Trang tài liệu học tập
└── QuestionAnalytics.tsx      # Trang thống kê câu hỏi
```

## Sử dụng

Truy cập module Faculty qua URL: `http://localhost:5173/faculty`

Sidebar sẽ tự động hiển thị với các menu items được định nghĩa.

## Tùy chỉnh

### Thay đổi notifications

Trong file `Sidebar.tsx`, cập nhật object `notifications`:

```tsx
const notifications: Notifications = {
  flaggedCount: 5  // Thay đổi số lượng thông báo
};
```

### Thêm menu item mới

Thêm item vào array `menuItems` trong `Sidebar.tsx`:

```tsx
{
  path: '/faculty/new-feature',
  icon: '🆕',
  label: 'Tính năng mới',
  badge: null
}
```

### Thay đổi màu sắc

Màu chủ đạo của sidebar Faculty là màu xanh lá (`#28a745`).
Để thay đổi, cập nhật trong `Sidebar.css`:

```css
.sidebar-link:hover {
  border-left-color: #28a745; /* Đổi màu tại đây */
}
```

## Development

Các trang hiện tại đang ở trạng thái placeholder. Bạn có thể phát triển thêm:

1. Kết nối với API backend
2. Thêm form và logic xử lý
3. Thêm biểu đồ và visualization
4. Implement real-time notifications
