import * as React from "react"

const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot(): boolean {
  return false
}

// useSyncExternalStore gives the correct value on the first client render
// (no setTimeout second pass, no desktop-first flash) with a proper server
// snapshot for hydration instead of a useState+effect re-sync.
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
