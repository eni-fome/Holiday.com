import { create } from 'zustand';

type ToastMessage = {
  message: string;
  type: 'SUCCESS' | 'ERROR';
};

interface ToastState {
  toast: ToastMessage | null;
  showToast: (message: ToastMessage) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (message) => set({ toast: message }),
  hideToast: () => set({ toast: null }),
}));
