export interface MockUser {
  email: string;
  password: string;
  role: 'admin' | 'student' | 'faculty';
  name: string;
}

export const mockUsers: MockUser[] = [
  {
    email: 'admin@hannah.edu',
    password: '123456',
    role: 'admin',
    name: 'Admin User'
  },
  {
    email: 'student@hannah.edu',
    password: '123456',
    role: 'student',
    name: 'Student User'
  },
  {
    email: 'faculty@hannah.edu',
    password: '123456',
    role: 'faculty',
    name: 'Faculty User'
  }
];

export const findUserByCredentials = (email: string, password: string): MockUser | null => {
  return mockUsers.find(user => user.email === email && user.password === password) || null;
};
