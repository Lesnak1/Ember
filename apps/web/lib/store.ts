import { create } from "zustand";

interface AuthState {
  token: string | null;
  userAddress: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, address: string, userId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe extraction for SSR
  const isClient = typeof window !== "undefined";
  const storedToken = isClient ? localStorage.getItem("ember_token") : null;
  const storedAddress = isClient ? localStorage.getItem("ember_address") : null;
  const storedUserId = isClient ? localStorage.getItem("ember_user_id") : null;

  return {
    token: storedToken,
    userAddress: storedAddress,
    userId: storedUserId,
    isAuthenticated: !!storedToken,
    setAuth: (token, address, userId) => {
      if (isClient) {
        localStorage.setItem("ember_token", token);
        localStorage.setItem("ember_address", address);
        localStorage.setItem("ember_user_id", userId);
      }
      set({ token, userAddress: address, userId, isAuthenticated: true });
    },
    clearAuth: () => {
      if (isClient) {
        localStorage.removeItem("ember_token");
        localStorage.removeItem("ember_address");
        localStorage.removeItem("ember_user_id");
      }
      set({ token: null, userAddress: null, userId: null, isAuthenticated: false });
    },
  };
});
