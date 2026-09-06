import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserStore } from './store/userStore';
import { authApi } from './api/auth.api';
import AppRouter from './routes/AppRouter';
import ToastProvider from './components/ui/Toast';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const setUser = useUserStore((s) => s.setUser);
  const logout = useUserStore((s) => s.logout);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authApi.getProfile();
        setUser(res.data);
      } catch {
        logout();
      }
    };
    checkAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider />
      <AppRouter />
    </QueryClientProvider>
  );
}
