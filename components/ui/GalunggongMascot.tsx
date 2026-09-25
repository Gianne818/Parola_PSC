'use client';

import React, { useEffect, useRef } from 'react';
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface GalunggongMascotProps {
  isTypingPassword?: boolean;
  isTypingEmail?: boolean;
  triggerSuccess?: boolean;
  triggerFailure?: boolean;
  className?: string;
}

export default function GalunggongMascot({
  isTypingPassword = false,
  isTypingEmail = false,
  triggerSuccess = false,
  triggerFailure = false,
  className = '',
}: GalunggongMascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSentMouseOverRef = useRef<boolean>(false);
  // Tracks whether the mascot canvas is currently visible in the viewport.
  // All rive.startRendering() calls are gated on this so the render loop
  // never spins while the mascot is offscreen.
  const isVisibleRef = useRef<boolean>(true);

  const { rive, RiveComponent } = useRive({
    src: '/animations/galunggong.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.BottomCenter,
    }),
  });

  const isTypingEmailInput = useStateMachineInput(rive, 'State Machine 1', 'isTypingEmail');
  const isTypingPasswordInput = useStateMachineInput(rive, 'State Machine 1', 'isTypingPassword');
  const triggerSuccessInput = useStateMachineInput(rive, 'State Machine 1', 'triggerSuccess');
  const triggerFailureInput = useStateMachineInput(rive, 'State Machine 1', 'triggerFailure');
  const cursorXInput = useStateMachineInput(rive, 'State Machine 1', 'cursorX');
  const cursorYInput = useStateMachineInput(rive, 'State Machine 1', 'cursorY');

  // Ensure state machine is playing and rendering once loaded
  useEffect(() => {
    if (rive && isVisibleRef.current) {
      rive.play();
      rive.startRendering();
    }
  }, [rive]);

  // Pause the Rive render loop while the mascot is offscreen and resume
  // when it scrolls back into view. The mascot is decorative and hidden
  // below the lg breakpoint, so this avoids burning frames on mobile.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (!rive) return;
        if (entry.isIntersecting) {
          rive.play();
          rive.startRendering();
        } else {
          rive.pause();
          rive.stopRendering();
        }
      },
      { threshold: 0 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [rive]);

  // Smooth, responsive cursor tracking that works across the entire screen
  useEffect(() => {
    const handlePointerTrack = (clientX: number, clientY: number) => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Center of the character's eye line
      const eyeCenterX = rect.left + rect.width * 0.5;
      const eyeCenterY = rect.top + rect.height * 0.42;

      // Distance vector from character eyes to cursor position
      const dx = clientX - eyeCenterX;
      const dy = clientY - eyeCenterY;

      // Responsive reach radius based on viewport size
      const reachX = Math.max(300, Math.min(window.innerWidth * 0.45, 650));
      const reachY = Math.max(250, Math.min(window.innerHeight * 0.45, 450));

      const normX = Math.max(-1, Math.min(1, dx / reachX));
      const normY = Math.max(-1, Math.min(1, dy / reachY));

      // Map safely within the canvas artboard bounds with safety margin
      // so Rive's internal HitTest is always satisfied and never triggers pointerExit
      const targetClientX = rect.left + rect.width * 0.5 + normX * (rect.width * 0.4);
      const targetClientY = rect.top + rect.height * 0.45 + normY * (rect.height * 0.4);

      // 1. Initial mouseover event on canvas if not yet sent
      if (!hasSentMouseOverRef.current) {
        canvas.dispatchEvent(
          new MouseEvent('mouseover', {
            clientX: targetClientX,
            clientY: targetClientY,
            bubbles: true,
            cancelable: true,
          })
        );
        hasSentMouseOverRef.current = true;
      }

      // 2. Dispatch standard MouseEvent("mousemove") which Rive's internal listener handles
      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: targetClientX,
          clientY: targetClientY,
          bubbles: true,
          cancelable: true,
        })
      );

      // 3. Wake up Rive's rendering loop immediately so the frame renders with the new eye position.
      // Skipped while offscreen: the observer restarts rendering on re-entry.
      if (rive && isVisibleRef.current) {
        rive.startRendering();
      }

      // 4. Update custom inputs if configured
      if (cursorXInput) cursorXInput.value = (normX + 1) * 50;
      if (cursorYInput) cursorYInput.value = (normY + 1) * 50;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Ignore programmatic synthetic events to prevent recursion
      if (!e.isTrusted) return;
      handlePointerTrack(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        handlePointerTrack(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
    };
  }, [rive, cursorXInput, cursorYInput]);

  useEffect(() => {
    if (isTypingEmailInput) {
      isTypingEmailInput.value = isTypingEmail;
      if (rive && isVisibleRef.current) rive.startRendering();
    }
  }, [isTypingEmail, isTypingEmailInput, rive]);

  useEffect(() => {
    if (isTypingPasswordInput) {
      isTypingPasswordInput.value = isTypingPassword;
      if (rive && isVisibleRef.current) rive.startRendering();
    }
  }, [isTypingPassword, isTypingPasswordInput, rive]);

  useEffect(() => {
    if (triggerSuccess && triggerSuccessInput) {
      triggerSuccessInput.fire();
      if (rive && isVisibleRef.current) rive.startRendering();
    }
  }, [triggerSuccess, triggerSuccessInput, rive]);

  useEffect(() => {
    if (triggerFailure && triggerFailureInput) {
      triggerFailureInput.fire();
      if (rive && isVisibleRef.current) rive.startRendering();
    }
  }, [triggerFailure, triggerFailureInput, rive]);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <RiveComponent className="w-full h-full pointer-events-none" />
    </div>
  );
}



