import { useState, useEffect } from "react"

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const MOBILE_BREAKPOINT = 640
const TABLET_BREAKPOINT = 1024

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallMobile, setIsSmallMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      
      setIsSmallMobile(width < MOBILE_BREAKPOINT)
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < TABLET_BREAKPOINT)
      
      if (width < 768) {
        setBreakpoint('mobile')
      } else if (width < TABLET_BREAKPOINT) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    checkBreakpoint()
    
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkBreakpoint)
    
    return () => mql.removeEventListener("change", checkBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile,
    isSmallMobile,
    isTablet,
    isDesktop: breakpoint === 'desktop'
  }
}
