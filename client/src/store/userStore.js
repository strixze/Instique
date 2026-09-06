import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setUser: (user, token = null, refreshToken = null) =>
        set((state) => ({
          user,
          token: token !== null ? token : state.token,
          refreshToken: refreshToken !== null ? refreshToken : state.refreshToken,
        })),
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      logout: () => set({ user: null, token: null, refreshToken: null }),
    }),
    { name: 'instique-user' }
  )
);

export const userAuthStore = useUserStore;
