// User Types
export interface User {
	_id: string;
	email: string;
	name: string;
	avatar?: string;
	upiId?: string; // For Indian UPI payments (e.g., user@paytm, user@phonepe)
	createdAt: Date;
	lastActive: Date;
}

// Group Types
export interface GroupMember {
	userId: string | User; // Can be ObjectId string or populated User object
	seatPosition: number;
	joinedAt: Date;
}

export interface Group {
	_id: string;
	name: string;
	theme: "poker" | "classic" | "minimal";
	members: GroupMember[];
	currency: string;
	createdAt: Date;
}

// Expense Types
export interface ExpenseSplit {
	userId: string | User;  // Can be ObjectId string or populated User object
	amount: number;
	percentage: number;
}

export interface Expense {
	_id: string;
	groupId: string;
	description: string;
	amount: number;
	paidBy: string | User;  // Can be ObjectId string or populated User object
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

// Settlement Types (calculated settlements)
export interface Settlement {
	from: string;
	fromUser?: User;
	to: string;
	toUser?: User;
	amount: number;
}

// Settlement Record (stored in database)
export interface SettlementRecord {
	_id: string;
	groupId: string;
	fromUserId: string | User;
	toUserId: string | User;
	amount: number;
	paymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';
	notes?: string;
	settledAt: Date;
	createdAt: Date;
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
export type Theme = "poker" | "classic" | "minimal";

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
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Socket Event Types
export interface SocketExpenseCreated {
	expense: Expense;
	updatedBalances: Balance[];
	animation: "chip-toss";
}

export interface SocketPaymentSettled {
	from: string;
	to: string;
	amount: number;
	animation: "chip-pass";
}

export interface SocketUserTyping {
	userId: string;
}

// Form Types
export interface ExpenseFormData {
	description: string;
	amount: number;
	paidBy: string;
	splitMethod: "equal" | "percentage" | "custom";
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
	type: "expense" | "payment" | "group";
	action: "create" | "update" | "delete";
	data: Record<string, unknown>;
	timestamp: number;
	retries: number;
}

// Analytics Types
export interface CategoryBreakdown {
	category: string;
	total: number;
	count: number;
}

export interface TopPayer {
	userId: string;
	userName: string;
	totalPaid: number;
	expenseCount: number;
}

export interface TopExpense {
	description: string;
	amount: number;
	category: string;
	date: Date;
	paidBy: string;
}

export interface MonthlyTrend {
	month: string;
	total: number;
	count: number;
}

export interface UserStats {
	totalPaid: number;
	totalOwed: number;
	shareOfTotal: number;
	expenseCount: number;
}

export interface GroupTotals {
	totalExpenses: number;
	expenseCount: number;
	averageExpense: number;
	memberCount: number;
}

export interface GroupAnalytics {
	categoryBreakdown: CategoryBreakdown[];
	topPayers: TopPayer[];
	topExpenses: TopExpense[];
	monthlyTrends: MonthlyTrend[];
	userStats: UserStats;
	groupTotals: GroupTotals;
}

// Friend Types
export interface FriendRequest {
	_id: string;
	from: User | string;
	to: User | string;
	status: 'pending' | 'accepted' | 'declined';
	createdAt: Date;
	updatedAt: Date;
}

export interface Friend {
	_id: string;
	user1: User | string;
	user2: User | string;
	createdAt: Date;
}

export interface UserWithFriendshipStatus extends User {
	friendshipStatus?: 'friends' | 'request_sent' | 'request_received' | 'none';
}
