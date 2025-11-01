# Chat Component - Interactive List

## Tính năng mới: Interactive List được nhúng trong nội dung chat

### Mô tả
Đã thêm tính năng Interactive List được nhúng trực tiếp vào nội dung của câu trả lời từ assistant. Người dùng có thể:
- Xem danh sách các item với icon và mô tả chi tiết
- Click để mở/đóng danh sách
- Click vào từng item để mở link tham khảo trong tab mới
- Thiết kế giống Google Learning với giao diện hiện đại

### Cú pháp trong nội dung message

Để tạo một Interactive List trong nội dung, sử dụng cú pháp sau:

```
[INTERACTIVE_LIST:Tiêu đề của list]
[SOURCE:id:Tên item:Icon emoji:Mô tả chi tiết:URL]
[SOURCE:id:Tên item:Icon emoji:Mô tả chi tiết:URL]
[/INTERACTIVE_LIST]
```

### Ví dụ sử dụng

```typescript
const message = {
    type: 'assistant',
    content: `OOP offers several advantages, including:

[INTERACTIVE_LIST:Advantages of OOP]
[SOURCE:1:Modularity:🔷:Code is organized into self-contained objects, making it easier to manage and understand.:https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object-oriented_programming]
[SOURCE:2:Reusability:🔄:Objects and classes can be reused in different parts of a program or in different projects, reducing development time.:https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/]
[SOURCE:3:Maintainability:🔧:Changes to one object are less likely to affect other parts of the program.:https://stackoverflow.com/questions/1031273/what-is-polymorphism]
[/INTERACTIVE_LIST]

Các nguyên tắc chính của OOP bao gồm...`,
    isStreaming: false
}
```

### Cấu trúc dữ liệu

```typescript
interface Source {
    id: string
    title: string
    url: string
    description: string
    icon?: string
}

interface Message {
    type: string
    content: string
    isStreaming?: boolean
}
```

### Các thành phần UI

1. **Interactive List Toggle**: Nút header để mở/đóng danh sách
   - Icon List (màu xanh)
   - Label "Interactive List" (màu xanh)
   - Tiêu đề của list (đậm, màu đen)
   - Icon mũi tên lên/xuống
   - Background màu xám nhạt với bo góc

2. **Source Items**: Mỗi item trong danh sách
   - Icon/emoji lớn bên trái (64x64px, background xám nhạt)
   - Tiêu đề (font 16px, đậm)
   - Mô tả chi tiết (font 14px, màu xám)
   - Nút link tròn bên phải với icon link
   - Hover effect: shadow và di chuyển lên
   - Background trắng với bo góc 12px

### Styling Features

- Animation mượt mà khi mở/đóng list
- Hover effects trên toggle button và source items
- Responsive design
- Shadow hiện đại
- Bo góc mềm mại
- Color scheme theo Material Design

### Parsing Logic

Component sử dụng hàm `parseInteractiveList()` để:
1. Tìm và extract các INTERACTIVE_LIST blocks từ content
2. Parse từng SOURCE item với regex
3. Tách nội dung thành các parts (text và interactive-list)
4. Render đúng component cho từng part type

### Tích hợp với API

Khi tích hợp với API thực tế, chỉ cần format response content theo cú pháp:

```typescript
// API response
const apiResponse = {
    content: `Nội dung text bình thường...
    
[INTERACTIVE_LIST:${listTitle}]
${sources.map(s => `[SOURCE:${s.id}:${s.title}:${s.icon}:${s.description}:${s.url}]`).join('\n')}
[/INTERACTIVE_LIST]

Tiếp tục nội dung text...`
}

setMessages(prev => [...prev, {
    type: 'assistant',
    content: apiResponse.content,
    isStreaming: false
}])
```

### Browser Support

- Chrome, Edge, Firefox, Safari (modern versions)
- CSS animations và transitions
- Flexbox layout
- ES6+ JavaScript features

### Ví dụ đầy đủ

```typescript
const exampleMessage = {
    type: 'assistant',
    content: `**Object-Oriented Programming (OOP)** là một mô hình lập trình quan trọng.

OOP offers several advantages, including:

[INTERACTIVE_LIST:Advantages of OOP]
[SOURCE:1:Modularity:🔷:Code is organized into self-contained objects, making it easier to manage and understand.:https://developer.mozilla.org]
[SOURCE:2:Reusability:🔄:Objects and classes can be reused in different parts of a program.:https://www.geeksforgeeks.org]
[SOURCE:3:Maintainability:🔧:Changes to one object are less likely to affect other parts of the program.:https://stackoverflow.com]
[/INTERACTIVE_LIST]

### Các nguyên tắc chính
- Encapsulation
- Inheritance
- Polymorphism
- Abstraction`,
    isStreaming: false
}
```

Khi render, message này sẽ hiển thị:
1. Text với markdown bình thường
2. Interactive List có thể mở/đóng
3. Tiếp tục với text markdown

