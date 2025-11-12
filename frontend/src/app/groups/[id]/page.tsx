'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Receipt, Loader2, Users as UsersIcon, IndianRupee } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useGroup } from '@/lib/hooks/useGroups';
import { useBalances, useExpenses, useCreateExpense } from '@/lib/hooks/useExpenses';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { formatCurrency } from '@/lib/utils';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const groupId = params.id as string;

  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: balances = [] } = useBalances(groupId);
  const { data: expenses = [] } = useExpenses(groupId);
  const createExpenseMutation = useCreateExpense(groupId);

  useRealtimeUpdates(groupId);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
    },
  });

  const onAddExpense = async (values: ExpenseFormValues) => {
    if (!user) return;

    await createExpenseMutation.mutateAsync({
      description: values.description,
      amount: values.amount,
      paidBy: user._id,
      selectedMembers: group?.members.map((m) => m.userId) || [],
    });

    setIsExpenseDialogOpen(false);
    form.reset();
  };

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Group not found</h2>
          <Button onClick={() => router.push('/groups')}>Back to Groups</Button>
        </div>
      </div>
    );
  }

  const myBalance = balances.find((b) => b.userId === user._id);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-purple-900/10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/groups')}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{group.name}</h1>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-1">
              <UsersIcon className="w-4 h-4" />
              <span>{group.members.length} members</span>
            </div>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* My Balance */}
        {myBalance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-6 rounded-xl border ${
              myBalance.balance > 0
                ? 'bg-green-500/10 border-green-500/50'
                : myBalance.balance < 0
                ? 'bg-red-500/10 border-red-500/50'
                : 'bg-gray-800/50 border-gray-700'
            }`}
          >
            <p className="text-gray-300 text-sm mb-2">Your balance</p>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-6 h-6 text-white" />
              <p
                className={`text-3xl font-bold ${
                  myBalance.balance > 0
                    ? 'text-green-400'
                    : myBalance.balance < 0
                    ? 'text-red-400'
                    : 'text-gray-300'
                }`}
              >
                {formatCurrency(Math.abs(myBalance.balance))}
              </p>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              {myBalance.balance > 0 ? 'You are owed' : myBalance.balance < 0 ? 'You owe' : 'All settled up!'}
            </p>
          </motion.div>
        )}

        {/* Expenses List */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Expenses</h2>
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-600 hover:bg-primary-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Expense</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddExpense)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Description</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Dinner, Groceries, etc."
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Amount (₹)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary-600 hover:bg-primary-700"
                      disabled={createExpenseMutation.isPending}
                    >
                      {createExpenseMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        'Add Expense'
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
              <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No expenses yet</p>
              <p className="text-gray-500 text-sm">Add an expense to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">{expense.description}</h3>
                      <p className="text-gray-400 text-sm">
                        Paid by {expense.paidByUser?.name || 'Unknown'}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(expense.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">₹{expense.amount.toFixed(2)}</p>
                      <p className="text-gray-400 text-sm">
                        ₹{(expense.amount / expense.splits.length).toFixed(2)} per person
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
