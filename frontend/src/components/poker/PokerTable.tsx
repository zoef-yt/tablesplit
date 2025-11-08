'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User, Balance } from '@/types';
import { formatCurrency, calculateSeatPosition, getInitials } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface PokerTableProps {
  members: Array<{ userId: string; user: User; seatPosition: number }>;
  balances: Balance[];
  currentUserId: string;
  onAddExpense: () => void;
}

export function PokerTable({ members, balances, currentUserId, onAddExpense }: PokerTableProps) {
  const getBalanceForUser = (userId: string): number => {
    const balance = balances.find((b) => b.userId === userId);
    return balance?.balance || 0;
  };

  const totalMembers = members.length;

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[4/3] p-8">
      {/* Poker Table Surface */}
      <div className="relative w-full h-full poker-table rounded-[50%] shadow-felt-inset shadow-glow-gold flex items-center justify-center">
        {/* Center Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="text-center">
            <div className="poker-chip w-24 h-24 mx-auto mb-2 shadow-chip" />
            <p className="text-gold-500 font-bold text-sm">TableSplit</p>
          </div>
        </motion.div>

        {/* Player Seats */}
        {members.map((member, index) => {
          const position = calculateSeatPosition(member.seatPosition, totalMembers);
          const balance = getBalanceForUser(member.user._id);
          const isCurrentUser = member.user._id === currentUserId;

          return (
            <PlayerSeat
              key={member.user._id}
              user={member.user}
              balance={balance}
              position={position}
              isCurrentUser={isCurrentUser}
            />
          );
        })}

        {/* Add Expense Button (Floating) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAddExpense}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gold-500 rounded-full shadow-chip flex items-center justify-center hover:bg-gold-400 transition-colors z-50"
        >
          <Plus className="w-8 h-8 text-slate-950" />
        </motion.button>
      </div>
    </div>
  );
}

interface PlayerSeatProps {
  user: User;
  balance: number;
  position: { x: number; y: number; angle: number };
  isCurrentUser: boolean;
}

function PlayerSeat({ user, balance, position, isCurrentUser }: PlayerSeatProps) {
  const balanceColor = balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-gray-400';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`absolute ${isCurrentUser ? 'active-seat' : ''}`}
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Avatar */}
      <div className="relative">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-full border-4 border-gold-700 shadow-chip"
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-4 border-gold-700 shadow-chip bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
            <span className="text-slate-950 font-bold text-xl">{getInitials(user.name)}</span>
          </div>
        )}

        {isCurrentUser && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-felt-900" />
        )}
      </div>

      {/* Name and Balance */}
      <div className="mt-2 text-center min-w-[120px]">
        <p className="text-white font-semibold text-sm truncate">{user.name}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={balance}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`${balanceColor} font-bold text-lg`}
          >
            {formatCurrency(Math.abs(balance))}
          </motion.p>
        </AnimatePresence>
        {balance !== 0 && (
          <p className="text-xs text-gray-400">
            {balance > 0 ? 'owed to you' : 'you owe'}
          </p>
        )}
      </div>

      {/* Chip Stack Animation */}
      {balance !== 0 && (
        <motion.div
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="poker-chip w-8 h-8 shadow-chip" />
        </motion.div>
      )}
    </motion.div>
  );
}
