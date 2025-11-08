// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  lastActive: Date;
}

// Group Types
export interface GroupMember {
  userId: string;
  user?: User;
  seatPosition: number;
  joinedAt: Date;
}

export interface Group {
  _id: string;
  name: string;
  theme: 'poker' | 'classic' | 'minimal';
  members: GroupMember[];
  currency: string;
  createdAt: Date;
}

// Expense Types
export interface ExpenseSplit {
  userId: string;
  user?: User;
  amount: number;
  percentage: number;
}

export interface Expense {
  _id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  paidByUser?: User;
  splits: ExpenseSplit[];
  category?: string;
  date: Date;
  createdAt: Date;
}

// Balance Types
export interface Balance {
  _id: string;
  groupId: string;
  userId: string;
  user?: User;
  balance: number; // positive = owed TO user, negative = user owes
  lastUpdated: Date;
}

// Settlement Types
export interface Settlement {
  from: string;
  fromUser?: User;
  to: string;
  toUser?: User;
  amount: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Theme Types
export type Theme = 'poker' | 'classic' | 'minimal';

export interface ThemeConfig {
  name: Theme;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Socket Event Types
export interface SocketExpenseCreated {
  expense: Expense;
  updatedBalances: Balance[];
  animation: 'chip-toss';
}

export interface SocketPaymentSettled {
  from: string;
  to: string;
  amount: number;
  animation: 'chip-pass';
}

export interface SocketUserTyping {
  userId: string;
}

// Form Types
export interface ExpenseFormData {
  description: string;
  amount: number;
  paidBy: string;
  splitMethod: 'equal' | 'percentage' | 'custom';
  splits: Array<{
    userId: string;
    amount?: number;
    percentage?: number;
  }>;
  selectedMembers: string[];
  category?: string;
}

export interface GroupFormData {
  name: string;
  theme: Theme;
  currency: string;
}

// Offline Queue Types
export interface PendingAction {
  id: string;
  type: 'expense' | 'payment' | 'group';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}
