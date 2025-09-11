import React from "../reactAvailability"
import { ensureReactAvailability } from "../reactAvailability"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Ensure React is available before using hooks
  if (!ensureReactAvailability()) {
    console.error('React is not available in useIsMobile');
    return false; // Safe fallback
  }

  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}