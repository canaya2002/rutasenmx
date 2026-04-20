'use client';

import type { ReactNode } from 'react';

/**
 * Light-only theme wrapper. Replaced next-themes (which injected a <script>
 * inside a client component, triggering a React 19 console warning) with a
 * simple pass-through since the app forces light mode everywhere.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
