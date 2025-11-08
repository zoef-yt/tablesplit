import { create } from 'zustand';
import type { Group } from '@/types';

interface GroupState {
  currentGroup: Group | null;
  groups: Group[];
  setCurrentGroup: (group: Group | null) => void;
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  currentGroup: null,
  groups: [],
  setCurrentGroup: (group) => set({ currentGroup: group }),
  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
  updateGroup: (groupId, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g._id === groupId ? { ...g, ...updates } : g
      ),
      currentGroup:
        state.currentGroup?._id === groupId
          ? { ...state.currentGroup, ...updates }
          : state.currentGroup,
    })),
  removeGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g._id !== groupId),
      currentGroup:
        state.currentGroup?._id === groupId ? null : state.currentGroup,
    })),
}));
