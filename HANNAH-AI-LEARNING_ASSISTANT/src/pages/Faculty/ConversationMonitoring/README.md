# Conversation Monitoring Module

Module quản lý cuộc hội thoại được đánh dấu với các tính năng: List, Search, Filter (ngày, status), và quyền riêng tư cho từng faculty.

## 📁 Cấu trúc Components

### 1. **ConversationMonitoring.tsx** (Main Container)
- Component chính để quản lý toàn bộ module
- Sử dụng custom hook `useConversationManagement`
- Tích hợp tất cả components con

### 2. **ConversationHeader.tsx**
- Hiển thị tiêu đề và thống kê
- Statistics cards: Tổng số và Chưa xử lý
- Props:
  - `totalCount`: Tổng số cuộc hội thoại
  - `pendingCount`: Số cuộc hội thoại chưa xử lý

### 3. **ConversationFilter.tsx**
- Tìm kiếm theo tên sinh viên, nội dung
- Filter theo trạng thái (Tất cả, Chưa xử lý, Đã xem xét, Đã giải quyết)
- Bộ lọc nâng cao:
  - Từ ngày / Đến ngày
  - Môn học
- Hiển thị active filters với nút xóa
- Nút Reset tất cả filters
- Props:
  - `filters`: Object chứa các bộ lọc
  - `courses`: Danh sách môn học
  - `onFilterChange`: Function cập nhật filter
  - `onReset`: Function reset filters

### 4. **ConversationList.tsx**
- Hiển thị danh sách cuộc hội thoại
- Empty state khi không có data
- Header với số lượng
- Props:
  - `conversations`: Mảng cuộc hội thoại
  - `onView`: Function xem chi tiết
  - `onStatusChange`: Function thay đổi trạng thái

### 5. **ConversationItem.tsx**
- Hiển thị chi tiết một cuộc hội thoại
- Thông tin: Sinh viên, môn học, thời gian, số tin nhắn
- Status badge với màu sắc
- Flags (lý do đánh dấu)
- Nút actions:
  - "Xem chi tiết"
  - "Đã xem" (nếu pending)
  - "Giải quyết" (nếu reviewed)
- Props:
  - `conversation`: Object cuộc hội thoại
  - `onView`: Function xem chi tiết
  - `onStatusChange`: Function thay đổi status

### 6. **ConversationDetailModal.tsx**
- Modal hiển thị chi tiết đầy đủ cuộc hội thoại
- Header với thông tin sinh viên, môn học
- Info bar với thời gian, số tin nhắn, status, flags
- Messages thread với UI đẹp:
  - Student messages (bên trái)
  - AI messages (bên phải)
  - Avatar và role indicators
- Quick actions:
  - "Đánh dấu đã xem"
  - "Đánh dấu đã giải quyết"
- Props:
  - `conversation`: Object cuộc hội thoại (hoặc null)
  - `onClose`: Function đóng modal
  - `onStatusChange`: Function thay đổi status

### 7. **useConversationManagement.ts** (Custom Hook)
- Quản lý toàn bộ state và logic
- API calls với filter theo faculty
- Transform data từ API format sang component format
- Returns:
  - `conversations`: Danh sách cuộc hội thoại
  - `courses`: Danh sách môn học
  - `selectedConversation`: Cuộc hội thoại đang xem
  - `filters`: Bộ lọc hiện tại
  - `totalCount`: Tổng số
  - `pendingCount`: Số chưa xử lý
  - `handleViewConversation`: Function xem chi tiết
  - `handleCloseDetail`: Function đóng detail
  - `handleStatusChange`: Function thay đổi status
  - `handleFilterChange`: Function cập nhật filter
  - `handleResetFilters`: Function reset filter

## 🔐 Quyền riêng tư (Privacy Rules)

### Quy tắc hiển thị:
1. **Cuộc hội thoại chưa xử lý (pending):**
   - Hiển thị cho TẤT CẢ faculty
   - Bất kỳ faculty nào cũng có thể xem và xử lý

2. **Cuộc hội thoại đã xử lý (reviewed/resolved):**
   - CHỈ hiển thị cho faculty đã xử lý
   - Faculty khác KHÔNG thấy được

### Implementation trong code:

```typescript
// In mockApi.ts - getFlaggedConversations()
if (filters.facultyId) {
  data = data.filter(conv => 
    conv.status === 'Mới' ||  // Pending - show to all
    conv.assignedTo === filters.facultyName  // Handled - show only to handler
  );
}
```

### Audit Trail:
- Mỗi thay đổi status được ghi lại
- Ghi nhận faculty đã xử lý
- Timestamp mỗi action

## 🎯 Features

### List & Display
- ✅ Danh sách cuộc hội thoại với pagination
- ✅ Status badges với màu sắc
- ✅ Preview tin nhắn
- ✅ Metadata (sinh viên, môn học, thời gian)
- ✅ Flag reasons hiển thị rõ ràng

### Search
- ✅ Tìm theo tên sinh viên
- ✅ Tìm theo nội dung tin nhắn
- ✅ Tìm theo môn học

### Filter
- ✅ **Filter theo Status:**
  - Tất cả
  - Chưa xử lý (pending)
  - Đã xem xét (reviewed)
  - Đã giải quyết (resolved)

- ✅ **Filter theo Ngày:**
  - Từ ngày (dateFrom)
  - Đến ngày (dateTo)

- ✅ **Filter theo Môn học:**
  - Dropdown với danh sách môn học

- ✅ **Active Filters Display:**
  - Hiển thị các filter đang áp dụng
  - Nút xóa từng filter
  - Nút Reset tất cả

### Status Management
- ✅ **Chuyển trạng thái:**
  - Pending → Reviewed (Đã xem)
  - Reviewed → Resolved (Đã giải quyết)

- ✅ **Quick Actions:**
  - Từ list view
  - Từ detail modal

- ✅ **Auto-assign:**
  - Tự động gán faculty khi thay đổi status
  - Ghi lại audit trail

### Privacy & Security
- ✅ Faculty chỉ thấy:
  - Cuộc hội thoại chưa xử lý (tất cả)
  - Cuộc hội thoại mình đã xử lý
- ✅ Faculty KHÔNG thấy:
  - Cuộc hội thoại do faculty khác xử lý

## 🔄 Data Flow

```
User Action (Filter/Search/Status Change)
    ↓
ConversationMonitoring (Container)
    ↓
useConversationManagement (Hook)
    ↓
API Call with facultyId filter
    ↓
Data Transform (API format → Component format)
    ↓
State Update
    ↓
Component Re-render
```

## 📊 Status Mapping

### From API to Component:
```typescript
'Mới' → 'pending'
'Đang xử lý' → 'reviewed'
'Đã giải quyết' → 'resolved'
```

### From Component to API:
```typescript
'reviewed' → 'Đang xử lý'
'resolved' → 'Đã giải quyết'
```

## 🎨 UI/UX Features

### List View
- ✅ Hover effects
- ✅ Status color coding:
  - Orange: Pending (Chưa xử lý)
  - Blue: Reviewed (Đã xem xét)
  - Green: Resolved (Đã giải quyết)
- ✅ Relative time display (vừa xong, 2 giờ trước, hôm qua)
- ✅ Flag badges với icon
- ✅ Avatar với gradient
- ✅ Handled by information

### Detail Modal
- ✅ Full-screen overlay
- ✅ Gradient header
- ✅ Message thread layout:
  - Student: Left side, white bubble
  - AI: Right side, gradient bubble
- ✅ Avatar indicators
- ✅ Timestamp per message
- ✅ Quick action buttons
- ✅ Responsive design

### Empty States
- ✅ Icon illustration
- ✅ Helpful message
- ✅ Suggestion text

## 📝 Type Definitions

```typescript
interface TransformedConversation {
  id: number;
  studentName: string;
  studentId: string;
  course: string;
  timestamp: string;
  messageCount: number;
  status: 'pending' | 'reviewed' | 'resolved';
  flags: string[];
  preview: string;
  messages: Array<{
    role: 'student' | 'ai';
    text: string;
    time: string;
  }>;
  handledBy?: string;
  facultyId?: string;
}

interface Filters {
  status: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  course: string;
}
```

## 🚀 Usage

```tsx
import { ConversationMonitoring } from './pages/Faculty/ConversationMonitoring';

// Trong router hoặc parent component
<ConversationMonitoring />
```

## 📚 Dependencies

- React
- TypeScript
- Tailwind CSS
- Context API (AppContext, AuthContext)
- Mock API Service

## 🔧 API Functions

### Đã cập nhật:
- `getFlaggedConversations(filters)` - Lấy danh sách với faculty filter
  - New filters: `facultyId`, `facultyName`, `search`, `dateFrom`, `dateTo`
  - Privacy rule: pending OR assignedTo === facultyName

- `updateConversationStatus(id, status, facultyName)` - Cập nhật status
  - Auto-assign faculty
  - Add to audit trail

### Mock Data:
- `mockFlaggedConversations` - Dữ liệu mẫu cuộc hội thoại

## 🔜 Future Enhancements

- [ ] Export to CSV/PDF
- [ ] Bulk status updates
- [ ] Advanced analytics dashboard
- [ ] Real-time notifications
- [ ] Comments/notes on conversations
- [ ] Priority sorting
- [ ] Custom filters save
- [ ] Email notifications
- [ ] AI confidence threshold alerts
- [ ] Course-specific views

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 2025-10-22  
**Privacy-First Design:** ✅ Faculty chỉ thấy conversations của mình và pending items
