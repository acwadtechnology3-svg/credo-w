import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  authReady: false,

  login: (user, token) =>
    set({ user, token, isAuthenticated: true, authReady: true }),

  logout: () =>
    set({ user: null, token: null, isAuthenticated: false, authReady: true }),

  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setAuthReady: (authReady) => set({ authReady }),

  hasRole: (...roles) => roles.includes(get().user?.role),
}))
