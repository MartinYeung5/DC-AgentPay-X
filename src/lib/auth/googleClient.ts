'use client';
/**
 * Client-side Google Identity Services (GSI) integration.
 * Loads the Google GSI script and prompts for sign-in.
 */

declare global {
  interface Window {
    google?: any;
    handleGoogleCredentialResponse?: (response: any) => void;
  }
}

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

export function loadGoogleScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'));
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
  return scriptLoading;
}

/**
 * Trigger Google sign-in and receive an ID token.
 * Uses One Tap / popup depending on availability.
 */
export async function signInWithGoogle(clientId: string): Promise<string> {
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      return reject(new Error('Google Identity Services unavailable'));
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        if (response.credential) resolve(response.credential);
        else reject(new Error('No credential returned'));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Try One Tap first; fallback to explicit popup via renderButton
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap not shown — fallback to server-side redirect flow
        window.location.href = '/api/auth/google';
      }
    });

    // Safety timeout
    setTimeout(() => reject(new Error('Google sign-in timeout')), 60000);
  });
}
