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
  avatar_url?: string | null;
  bio?: string | null;
}

interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  setGuest: () => void;
  logout: () => void;
  updateAvatar: (url: string) => void;
  updateBio: (bio: string) => void;
  updateUsername: (username: string) => void;
  updateStats: (deltas: { attack: number; defence: number; focus: number; agility: number }) => void;
  pendingRequests: number;
  setPendingRequests: (count: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      pendingRequests: 0,
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
      logout: () => set({ user: null, pendingRequests: 0 }),
      updateAvatar: (url) => set((s) => s.user ? { user: { ...s.user, avatar_url: url } } : {}),
      updateBio: (bio) => set((s) => s.user ? { user: { ...s.user, bio } } : {}),
      updateUsername: (username) => set((s) => s.user ? { user: { ...s.user, username } } : {}),
      updateStats: (deltas) => set((s) => {
        if (!s.user) return {};
        return {
          user: {
            ...s.user,
            stat_attack: (s.user.stat_attack || 0) + deltas.attack,
            stat_defence: (s.user.stat_defence || 0) + deltas.defence,
            stat_focus: (s.user.stat_focus || 0) + deltas.focus,
            stat_agility: (s.user.stat_agility || 0) + deltas.agility,
          },
        };
      }),
      setPendingRequests: (count) => set({ pendingRequests: count }),
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

interface GauntletState {
  bossIndex: number | null;
  currentPhase: number;
  totalPhases: number;
  phasesComplete: boolean[];
  phaseReps: Record<number, number>;
  isActive: boolean;
  startGauntlet: (bossIndex: number, totalPhases: number) => void;
  completePhase: (phase: number, reps: number) => void;
  resetGauntlet: () => void;
}

export const useGauntletStore = create<GauntletState>()((set) => ({
  bossIndex: null,
  currentPhase: 1,
  totalPhases: 0,
  phasesComplete: [],
  phaseReps: {},
  isActive: false,
  startGauntlet: (bossIndex, totalPhases) => set({
    bossIndex,
    currentPhase: 1,
    totalPhases,
    phasesComplete: Array(totalPhases).fill(false),
    phaseReps: {},
    isActive: true,
  }),
  completePhase: (phase, reps) => set((s) => {
    const newComplete = [...s.phasesComplete];
    newComplete[phase - 1] = true;
    const newReps = { ...s.phaseReps, [phase]: reps };
    const nextPhase = phase < s.totalPhases ? phase + 1 : phase;
    return {
      phasesComplete: newComplete,
      phaseReps: newReps,
      currentPhase: nextPhase,
    };
  }),
  resetGauntlet: () => set({
    bossIndex: null, currentPhase: 1, totalPhases: 0,
    phasesComplete: [], phaseReps: {}, isActive: false,
  }),
}));
