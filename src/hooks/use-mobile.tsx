// Temporarily using fallback to fix React bundling issue
// Original hook caused React import issues

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Fallback implementation without React hooks to prevent bundling issues
  if (typeof window !== 'undefined') {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }
  return false; // SSR fallback
}