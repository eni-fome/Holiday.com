import React, { useContext } from "react";
import Toast from "../components/Toast";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useAuthStore } from "../store/auth.store";
import { useToastStore } from "../store/toast.store";

const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUB_KEY || "";

type ToastMessage = {
  message: string;
  type: "SUCCESS" | "ERROR";
};

type AppContext = {
  showToast: (toastMessage: ToastMessage) => void;
  isLoggedIn: boolean;
  stripePromise: Promise<Stripe | null>;
};

const AppContext = React.createContext<AppContext | undefined>(undefined);

const stripePromise = loadStripe(STRIPE_PUB_KEY);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { toast, showToast, hideToast } = useToastStore();

  return (
    <AppContext.Provider
      value={{
        showToast,
        isLoggedIn: isAuthenticated,
        stripePromise,
      }}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  return context as AppContext;
};
