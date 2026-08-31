'use client';

import { useEffect, useRef } from 'react';

/**
 * Client-side anti-cheating deterrents.
 *
 * These raise the effort required and give organizers a review trail. They are
 * NOT a security boundary — anyone can disable JavaScript. Answer validity is
 * decided entirely by the server in /api/answer.
 *
 * Deliberately restrained: no fullscreen lock, no right-click blocking, no
 * alerts. Browser functionality is only constrained inside the quiz element,
 * never globally.
 */
export function useAntiCheat({
  active,
  questionId,
}: {
  active: boolean;
  questionId?: string | null;
}) {
  const questionRef = useRef(questionId);
  questionRef.current = questionId;

  useEffect(() => {
    if (!active) return;

    const log = (eventType: string) => {
      const participantCode = sessionStorage.getItem('participant_code');
      const sessionToken = sessionStorage.getItem('participant_session');
      if (!participantCode || !sessionToken) return;

      const body = JSON.stringify({
        participantCode,
        sessionToken,
        eventType,
        questionId: questionRef.current ?? undefined,
      });

      // sendBeacon survives the page being backgrounded or closed.
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/participant/event', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/participant/event', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    const onVisibility = () => log(document.hidden ? 'TAB_HIDDEN' : 'TAB_VISIBLE');
    const onBlur = () => log('WINDOW_BLUR');
    const onCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Only intercept inside the quiz surface, never page-wide.
      if (target?.closest?.('.quiz-shell')) {
        e.preventDefault();
        log('COPY_ATTEMPT');
      }
    };

    // Warn on refresh/close during a live question.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // Neutralise accidental browser-back without disabling history globally.
    const onPopState = () => {
      log('BACK_ATTEMPT');
      history.pushState(null, '', location.href);
    };
    history.pushState(null, '', location.href);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, [active]);
}
