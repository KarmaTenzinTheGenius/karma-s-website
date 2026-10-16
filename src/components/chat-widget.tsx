'use client';

import { useEffect } from 'react';

const WIDGET_SRC = 'https://my-chatbot-kpn8.onrender.com/widget.js';
const BOT_ID = process.env.NEXT_PUBLIC_CHAT_BOT_ID || 'demo-bot';

/**
 * Loads the MyChatbot embed script (https://my-chatbot-kpn8.onrender.com)
 * and lets it render its floating chat bubble. The widget reads its
 * configuration from its own <script> tag (document.currentScript), so the
 * tag is injected manually rather than through next/script.
 *
 * Rendered once inside SiteFrame, so it persists across client-side
 * navigation and is absent from the standalone /account and /admin pages.
 */
export function ChatWidget() {
  useEffect(() => {
    if (document.getElementById('mychatbot-wrap')) return;
    if (!document.querySelector(`script[src="${WIDGET_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = WIDGET_SRC;
      script.async = true;
      script.setAttribute('data-bot-id', BOT_ID);
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
