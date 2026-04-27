import { create } from 'zustand';
import type { HrUser, OnboardingSubmission, SubmissionStatus } from '../types/database';

interface AdminStore {
  hrUser: HrUser | null;
  submissions: OnboardingSubmission[];
  selectedSubmission: OnboardingSubmission | null;
  filters: {
    status: SubmissionStatus | 'all';
    search: string;
  };
  isLoading: boolean;

  setHrUser: (user: HrUser) => void;
  setSubmissions: (submissions: OnboardingSubmission[]) => void;
  setSelectedSubmission: (submission: OnboardingSubmission | null) => void;
  setFilter: (key: string, value: string) => void;
  updateSubmissionStatus: (id: string, status: SubmissionStatus) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  hrUser: null,
  submissions: [],
  selectedSubmission: null,
  filters: { status: 'all', search: '' },
  isLoading: false,

  setHrUser: (hrUser) => set({ hrUser }),
  setSubmissions: (submissions) => set({ submissions }),
  setSelectedSubmission: (selectedSubmission) => set({ selectedSubmission }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  updateSubmissionStatus: (id, status) =>
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === id ? { ...s, status } : s
      ),
      selectedSubmission:
        state.selectedSubmission?.id === id
          ? { ...state.selectedSubmission, status }
          : state.selectedSubmission,
    })),
}));
