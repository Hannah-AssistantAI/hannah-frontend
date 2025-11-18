import * as XLSX from 'xlsx';

// User type for Admin/UserManagement page
export interface ImportedUserRow {
  id?: string;
  name: string;
  email: string;
  role: 'Student' | 'Faculty' | 'Admin';
  studentCode?: string;
  status?: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface ParsedResult {
  valid: ImportedUserRow[];
  invalid: Array<{ rowNumber: number; data: any; errors: string[] }>; // 1-based row number (excluding header)
}

const headerAliases: Record<string, keyof ImportedUserRow> = {
  // English - Canonical and common variations
  'name': 'name',
  'fullname': 'name',
  'full name': 'name',
  'email': 'email',
  'role': 'role',
  'studentcode': 'studentCode',
  'student id': 'studentCode',
  'status': 'status',
  'createdat': 'createdAt',
  'created at': 'createdAt',
  'username': 'name', // Assuming username can be used as name if 'name' is missing

  // Vietnamese
  'tên': 'name',
  'ho va ten': 'name',
  'họ và tên': 'name',
  'vai trò': 'role',
  'vaitro': 'role',
  'mã sv': 'studentCode',
  'ma sv': 'studentCode',
  'mã sinh viên': 'studentCode',
  'trạng thái': 'status',
  'trang thai': 'status',
  'ngày tạo': 'createdAt',
  'ngay tao': 'createdAt',
};

const normalizeHeader = (h: string) => h.trim().toLowerCase();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toRole(value: any): ImportedUserRow['role'] | null {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (["student", 'sinh viên', 'sinh vien', 'sv'].includes(v)) return 'Student';
  if (["faculty", 'giảng viên', 'giang vien', 'gv'].includes(v)) return 'Faculty';
  if (["admin", 'quản trị', 'quan tri'].includes(v)) return 'Admin';
  return null;
}

function toStatus(value: any): 'Active' | 'Inactive' {
  if (!value) return 'Active';
  const v = String(value).trim().toLowerCase();
  if (['inactive', 'không hoạt động', 'khong hoat dong', 'disable', 'disabled', '0'].includes(v)) return 'Inactive';
  return 'Active';
}

export async function parseUsersFromFile(file: File): Promise<ParsedResult> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (rows.length === 0) {
    return { valid: [], invalid: [{ rowNumber: 1, data: {}, errors: ['Tệp rỗng hoặc không có dữ liệu'] }] };
  }

  // Prepare header mapping from the first row keys
  const rawHeaders = Object.keys(rows[0]);
  const mappedKeys: Record<string, keyof ImportedUserRow> = {};
  rawHeaders.forEach((h) => {
    const key = normalizeHeader(h);
    const mapped = headerAliases[key] || (['name','email','role','studentcode','status','createdat'].includes(key) ? (key as keyof ImportedUserRow) : undefined);
    if (mapped) mappedKeys[h] = mapped;
  });

  const required: Array<keyof ImportedUserRow> = ['name', 'email', 'role'];
  const missingRequired = required.filter(req => !Object.values(mappedKeys).includes(req));
  if (missingRequired.length) {
    return {
      valid: [],
      invalid: [{ rowNumber: 1, data: {}, errors: [
        `Thiếu cột bắt buộc: ${missingRequired.map(c => '`' + c + '`').join(', ')}. Vui lòng dùng mẫu.`
      ] }]
    };
  }

  const result: ParsedResult = { valid: [], invalid: [] };

  rows.forEach((r, idx) => {
    const rowNumber = idx + 2; // +2 because sheet_to_json assumed header row + 1-index
    const item: any = {};
    Object.entries(mappedKeys).forEach(([originalKey, mappedKey]) => {
      item[mappedKey] = r[originalKey];
    });

    const errors: string[] = [];
    // Validation
    if (!item.name || String(item.name).trim().length < 2) errors.push('Tên không hợp lệ');
    if (!emailRegex.test(String(item.email).trim())) errors.push('Email không hợp lệ');
    const role = toRole(item.role);
    if (!role) errors.push('Vai trò không hợp lệ (Student/Faculty/Admin)');
    const status = toStatus(item.status);
    const studentCode = item.studentCode ? String(item.studentCode).trim() : undefined;
    if (role === 'Student' && !studentCode) errors.push('Mã SV bắt buộc với vai trò Sinh viên');

    const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
    if (isNaN(createdAt.getTime())) errors.push('Ngày tạo không hợp lệ');

    if (errors.length) {
      result.invalid.push({ rowNumber, data: r, errors });
    } else {
      const validRow: ImportedUserRow = {
        name: String(item.name).trim(),
        email: String(item.email).trim(),
        role: role as 'Student' | 'Faculty' | 'Admin',
        studentCode,
        status,
        createdAt: createdAt.toISOString(),
      };
      result.valid.push(validRow);
    }
  });

  return result;
}

export function generateUserTemplateCSV(): string {
  // CSV header in Vietnamese and English for clarity
  const headers = ['Tên','Email','Vai trò','Mã SV','Trạng thái','Ngày tạo'];
  const example = ['Nguyễn Văn A','vana@example.com','Student','SV001','Active','2025-10-01'];
  const lines = [headers.join(','), example.join(',')];
  return lines.join('\n');
}

export function downloadCSV(content: string, filename = 'user_import_template.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
