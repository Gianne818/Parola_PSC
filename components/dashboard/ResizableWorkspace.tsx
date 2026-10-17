'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import styles from './dashboard.module.css';

const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 320;
const MAX_WIDTH = 560;
const MAP_MIN_WIDTH = 282; // Preserve 280px of map content inside its borders.
const DIVIDER_WIDTH = 16;

/** Visit-local layout preference; does not affect filters, selection or stored account settings. */
export default function ResizableWorkspace({ viewport, view, children, inspector }: {
  viewport: 'desktop' | 'tablet' | 'mobile'; view: 'map' | 'areas'; children: ReactNode; inspector: ReactNode;
}) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; width: number } | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [maximum, setMaximum] = useState(MAX_WIDTH);
  const [dragging, setDragging] = useState(false);
  const clamp = (value: number) => Math.round(Math.min(maximum, Math.max(MIN_WIDTH, value)));

  useLayoutEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || viewport !== 'desktop') return;
    const observer = new ResizeObserver(() => {
      const available = workspace.getBoundingClientRect().width - MAP_MIN_WIDTH - DIVIDER_WIDTH;
      const nextMaximum = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(available)));
      setMaximum(nextMaximum);
      setWidth(previous => Math.min(previous, nextMaximum));
    });
    observer.observe(workspace);
    return () => { observer.disconnect(); dragRef.current = null; setDragging(false); };
  }, [viewport]);

  return <div ref={workspaceRef} className={styles.workspace} data-size={viewport} data-view={view}
    data-resizing={dragging} style={{ '--inspector-width': `${width}px` } as CSSProperties}>
    {children}
    {viewport === 'desktop' && <>
      <div className={styles.resizeHandle} role="separator" tabIndex={0} aria-orientation="vertical" lang="en"
        aria-label="Resize nearby fishing areas panel" aria-controls="dashboard-inspector"
        aria-describedby="workspace-resize-help" aria-valuemin={MIN_WIDTH} aria-valuemax={maximum}
        aria-valuenow={width} aria-valuetext={`${width} pixels wide`}
        title="Drag to resize · Double-click to reset"
        onPointerDown={event => {
          if (event.button !== 0 || !event.isPrimary) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { id: event.pointerId, x: event.clientX, width };
          setDragging(true);
        }}
        onPointerMove={event => {
          const drag = dragRef.current;
          if (drag?.id === event.pointerId) setWidth(clamp(drag.width + drag.x - event.clientX));
        }}
        onPointerUp={event => {
          if (dragRef.current?.id !== event.pointerId) return;
          dragRef.current = null;
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { dragRef.current = null; setDragging(false); }}
        onLostPointerCapture={() => { dragRef.current = null; setDragging(false); }}
        onDoubleClick={() => setWidth(clamp(DEFAULT_WIDTH))}
        onKeyDown={event => {
          const step = event.shiftKey ? 40 : 10;
          const next = event.key === 'ArrowLeft' ? width + step : event.key === 'ArrowRight' ? width - step
            : event.key === 'Home' ? MIN_WIDTH : event.key === 'End' ? maximum : event.key === 'Enter' ? DEFAULT_WIDTH : null;
          if (next === null) return;
          event.preventDefault();
          setWidth(clamp(next));
        }}>
        <GripVertical size={14} aria-hidden="true" />
      </div>
      <span id="workspace-resize-help" className={styles.srOnly} lang="en">Drag to resize. Left arrow widens the panel; right arrow narrows it. Home sets the minimum, End the maximum, and Enter resets the width.</span>
    </>}
    {inspector}
  </div>;
}
