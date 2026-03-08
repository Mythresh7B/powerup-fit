import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Exercise, PostureLabel } from './pose';

export interface UserProfile {
  id: string;
  username: string;
  level: number;
  total_xp: number;
  streak: number;
  isGuest?: boolean;
  stat_attack?: number;
  stat_defence?: number;
  stat_focus?: number;
  stat_agility?: number;
}

interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  setGuest: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      setGuest: () => set({
        user: {
          id: 'guest',
          username: 'Guest',
          level: 1,
          total_xp: 0,
          streak: 0,
          isGuest: true,
          stat_attack: 0,
          stat_defence: 0,
          stat_focus: 0,
          stat_agility: 0,
        },
      }),
      logout: () => set({ user: null }),
    }),
    { name: 'powerup-auth' }
  )
);

interface SessionState {
  exercise: Exercise;
  isActive: boolean;
  repCount: number;
  correctReps: number;
  fatigueIndex: number;
  postureLabel: PostureLabel;
  xp: number;
  targetReps: number;
  accuracyHistory: PostureLabel[];
  startSession: () => void;
  endSession: () => void;
  onRepComplete: (isCorrect: boolean, posture: PostureLabel) => void;
  setExercise: (exercise: Exercise) => void;
  setTargetReps: (target: number) => void;
  setFatigue: (fatigue: number) => void;
  setPosture: (posture: PostureLabel) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  exercise: 'bicep_curl',
  isActive: false,
  repCount: 0,
  correctReps: 0,
  fatigueIndex: 0,
  postureLabel: 'correct',
  xp: 0,
  targetReps: 10,
  accuracyHistory: [],
  startSession: () => set({ isActive: true, repCount: 0, correctReps: 0, fatigueIndex: 0, xp: 0, accuracyHistory: [] }),
  endSession: () => set({ isActive: false }),
  onRepComplete: (isCorrect, posture) =>
    set((state) => ({
      repCount: state.repCount + 1,
      correctReps: state.correctReps + (isCorrect ? 1 : 0),
      accuracyHistory: [...state.accuracyHistory, posture],
    })),
  setExercise: (exercise) => set({ exercise }),
  setTargetReps: (targetReps) => set({ targetReps }),
  setFatigue: (fatigueIndex) => set({ fatigueIndex }),
  setPosture: (postureLabel) => set({ postureLabel }),
  resetSession: () => set({
    isActive: false, repCount: 0, correctReps: 0, fatigueIndex: 0,
    postureLabel: 'correct', xp: 0, accuracyHistory: [],
  }),
}));
