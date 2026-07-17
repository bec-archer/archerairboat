'use client';

import { useEffect, useRef } from 'react';

// Cloudflare Turnstile explicit render. Free, invisible for most humans.
// Token is verified SERVER-SIDE in the booking-api Edge Function; this
// component only produces the token.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
    };
    __turnstileOnload?: () => void;
  }
}

export default function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const render = () => {
      if (!window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      window.__turnstileOnload = render;
      if (!document.querySelector('script[data-turnstile]')) {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileOnload';
        s.async = true;
        s.setAttribute('data-turnstile', '1');
        document.head.appendChild(s);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="my-2" />;
}
