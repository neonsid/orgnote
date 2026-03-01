// hooks/use-mobile.ts
import { useState, useEffect } from 'react'

export function useIsSmallMobile() {
  const [isSmallMobile, setIsSmallMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    const mql = window.matchMedia('(min-width: 320px) and (max-width: 767px)')
    return mql.matches
  })

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 320px) and (max-width: 767px)')
    const onChange = () => setIsSmallMobile(mql.matches)

    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isSmallMobile
}
