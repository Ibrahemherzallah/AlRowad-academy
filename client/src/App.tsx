import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { DirectionProvider } from '@/providers/DirectionProvider';
import { router } from '@/routes/router';
import { useAuthStore } from '@/store/auth.store';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  // Attempt silent session restore once on mount.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <ThemeProvider>
      <DirectionProvider>
        <RouterProvider router={router} />
      </DirectionProvider>
    </ThemeProvider>
  );
}
