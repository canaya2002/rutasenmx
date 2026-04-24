import { useEffect, type ReactNode } from 'react';
import { Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { mapWebUrlToAppPath } from '@/lib/deep-links';

/**
 * Listens for incoming https/rutasenmx:// URLs and navigates the app to the
 * matching in-app screen. Handles both the "app was cold-launched from a
 * link" and the "app was already running" cases.
 */
export function DeepLinkProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleUrl = (url: string | null) => {
      if (!url) return;
      const target = mapWebUrlToAppPath(url);
      if (!target) return;
      try {
        router.push(target as never);
      } catch (err) {
        console.warn('[deep-link] navigation failed', err);
      }
    };

    // Cold-launch case.
    void Linking.getInitialURL().then(handleUrl).catch(() => {});

    // Warm case — subscribe to URL events.
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, [router]);

  return <>{children}</>;
}
