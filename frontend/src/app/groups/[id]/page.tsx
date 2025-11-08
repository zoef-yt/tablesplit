'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Users as UsersIcon, Receipt, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiHelpers } from '@/lib/api';
import { connectSocket, joinGroup, leaveGroup } from '@/lib/socket';
import { Group, Balance, Expense } from '@/types';
import { PokerTable } from '@/components/poker/PokerTable';
import { ExpenseModal } from '@/components/forms/ExpenseModal';
import { vibrate } from '@/lib/utils';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const groupId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchGroupData();

    // Connect to socket and join group room
    const socket = connectSocket();
    joinGroup(groupId);

    // Listen for real-time updates
    socket.on('expense:created', handleExpenseCreated);
    socket.on('payment:settled', handlePaymentSettled);

    return () => {
      leaveGroup(groupId);
      socket.off('expense:created', handleExpenseCreated);
      socket.off('payment:settled', handlePaymentSettled);
    };
  }, [user, groupId]);

  const fetchGroupData = async () => {
    try {
      const [groupRes, balancesRes, expensesRes] = await Promise.all([
        apiHelpers.get<Group>(`/groups/${groupId}`),
        apiHelpers.get<Balance[]>(`/expenses/group/${groupId}/balances`),
        apiHelpers.get<Expense[]>(`/expenses/group/${groupId}`),
      ]);

      setGroup(groupRes.data!);
      setBalances(balancesRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseCreated = (data: { expense: Expense; updatedBalances: Balance[] }) => {
    setExpenses((prev) => [data.expense, ...prev]);
    setBalances(data.updatedBalances);
    vibrate([10, 50, 10]); // Haptic feedback
  };

  const handlePaymentSettled = (data: { from: string; to: string; amount: number }) => {
    fetchGroupData(); // Refresh data
    vibrate([10, 50, 10]);
  };

  const handleAddExpense = async (expenseData: {
    description: string;
    amount: number;
    paidBy: string;
    selectedMembers: string[];
  }) => {
    try {
      const response = await apiHelpers.post('/expenses', {
        groupId,
        ...expenseData,
      });

      // Emit socket event for real-time update
      const socket = connectSocket();
      socket.emit('expense:created', {
        groupId,
        expense: response.data!.expense,
        updatedBalances: response.data!.updatedBalances,
      });

      setShowExpenseModal(false);
      vibrate(50);
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Group not found</h2>
          <button
            onClick={() => router.push('/groups')}
            className="px-6 py-3 bg-gold-500 text-slate-950 rounded-lg font-bold hover:bg-gold-400 transition-colors"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const membersWithUsers = group.members.map((m) => ({
    userId: m.userId._id || m.userId,
    user: m.userId as any,
    seatPosition: m.seatPosition,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950">
      {/* Header */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/groups')}
              className="p-2 hover:bg-felt-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-3xl font-bold text-white flex-1 text-center">{group.name}</h1>
            <button className="p-2 hover:bg-felt-700 rounded-full transition-colors">
              <Settings className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Poker Table */}
          <PokerTable
            members={membersWithUsers}
            balances={balances}
            currentUserId={user!._id}
            onAddExpense={() => setShowExpenseModal(true)}
          />

          {/* Recent Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-felt-700/50 backdrop-blur-sm border border-gold-900/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-gold-500" />
              <h2 className="text-xl font-bold text-white">Recent Expenses</h2>
            </div>

            {expenses.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No expenses yet</p>
            ) : (
              <div className="space-y-3">
                {expenses.slice(0, 10).map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-semibold">{expense.description}</p>
                      <p className="text-sm text-gray-400">
                        Paid by {(expense.paidBy as any).name || 'Unknown'}
                      </p>
                    </div>
                    <p className="text-gold-500 font-bold text-lg">
                      ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        members={membersWithUsers}
        currentUserId={user!._id}
        onSubmit={handleAddExpense}
      />
    </div>
  );
}
