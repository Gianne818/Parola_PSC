'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useRetryAfter() {
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const deadlineRef = useRef(0);
  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [deadline]);
  const deferUntil = useCallback((value: number) => { deadlineRef.current = value; setNow(Date.now()); setDeadline(value); }, []);
  const isWaiting = useCallback(() => Date.now() < deadlineRef.current, []);
  return { seconds: Math.max(0, Math.ceil((deadline - now) / 1000)), deferUntil, isWaiting };
}
