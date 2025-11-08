'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Users, User as UserIcon } from 'lucide-react';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Array<{ userId: string; user: User }>;
  currentUserId: string;
  onSubmit: (data: {
    description: string;
    amount: number;
    paidBy: string;
    selectedMembers: string[];
  }) => void;
}

export function ExpenseModal({ isOpen, onClose, members, currentUserId, onSubmit }: ExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.user._id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || selectedMembers.length === 0) {
      return;
    }

    onSubmit({
      description,
      amount: parseFloat(amount),
      paidBy,
      selectedMembers,
    });

    // Reset form
    setDescription('');
    setAmount('');
    setSelectedMembers(members.map((m) => m.user._id));
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const perPersonAmount = selectedMembers.length > 0 ? parseFloat(amount || '0') / selectedMembers.length : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-felt-700 rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add Expense</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-felt-600 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Dinner at Joe's"
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-gold-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="120.00"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-gold-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors text-2xl font-bold"
                    />
                  </div>
                  {amount && selectedMembers.length > 0 && (
                    <p className="mt-2 text-sm text-gray-400">
                      ${perPersonAmount.toFixed(2)} per person
                    </p>
                  )}
                </div>

                {/* Paid By */}
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">Paid By</label>
                  <div className="grid grid-cols-2 gap-2">
                    {members.map((member) => (
                      <button
                        key={member.user._id}
                        type="button"
                        onClick={() => setPaidBy(member.user._id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          paidBy === member.user._id
                            ? 'border-gold-500 bg-gold-500/20'
                            : 'border-gold-900/30 bg-slate-900/50 hover:border-gold-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                            <span className="text-slate-950 font-bold text-xs">
                              {getInitials(member.user.name)}
                            </span>
                          </div>
                          <span className="text-white font-semibold text-sm">{member.user.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split With */}
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Split With ({selectedMembers.length} people)
                  </label>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <button
                        key={member.user._id}
                        type="button"
                        onClick={() => toggleMember(member.user._id)}
                        className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          selectedMembers.includes(member.user._id)
                            ? 'border-gold-500 bg-gold-500/20'
                            : 'border-gold-900/30 bg-slate-900/50 hover:border-gold-700'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                          <span className="text-slate-950 font-bold">
                            {getInitials(member.user.name)}
                          </span>
                        </div>
                        <span className="text-white font-semibold flex-1 text-left">
                          {member.user.name}
                        </span>
                        {selectedMembers.includes(member.user._id) && (
                          <span className="text-gold-500 text-sm font-semibold">
                            ${perPersonAmount.toFixed(2)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!description || !amount || selectedMembers.length === 0}
                  className="w-full py-4 bg-gold-500 text-slate-950 rounded-lg font-bold text-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-chip"
                >
                  Add to Table
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
