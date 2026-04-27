import { create } from 'zustand';
import type { Employee, OnboardingSubmission } from '../types/database';

interface OnboardingStore {
  employee: Employee | null;
  submission: OnboardingSubmission | null;
  currentStep: number;
  isLoading: boolean;
  error: string | null;

  setEmployee: (employee: Employee) => void;
  setSubmission: (submission: OnboardingSubmission) => void;
  setDocuments: (documents: OnboardingSubmission['documents']) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  employee: null,
  submission: null,
  currentStep: 1,
  isLoading: false,
  error: null,

  setEmployee: (employee) => set({ employee }),
  setSubmission: (submission) => set({ submission, currentStep: submission.current_step }),
  setDocuments: (documents) => set((state) => ({
    submission: state.submission ? { ...state.submission, documents } : null,
  })),
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 6) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
  reset: () => set({ employee: null, submission: null, currentStep: 1, isLoading: false, error: null }),
}));
