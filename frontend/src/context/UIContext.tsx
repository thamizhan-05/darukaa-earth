import React, { createContext, useContext, useState } from 'react'

interface UIContextType {
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleMobileSidebar = () => setMobileSidebarOpen((prev) => !prev)

  return (
    <UIContext.Provider
      value={{
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (!context) {
    return {
      mobileSidebarOpen: false,
      setMobileSidebarOpen: () => {},
      toggleMobileSidebar: () => {},
    }
  }
  return context
}
