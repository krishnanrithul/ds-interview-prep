import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(undefined)
const KEY = 'ds-theme'

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(KEY) || 'system' } catch { return 'system' }
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, theme) } catch { /* ignore */ }
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && systemDark())
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(dark ? 'dark' : 'light')
    }
    apply()
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
