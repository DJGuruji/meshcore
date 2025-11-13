'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NavigationState {
  // Mock server state
  selectedProjectId: string | null;
  
  // API tester state
  apiTesterTabs: any[];
  activeApiTesterTabId: string | null;
  
  // GraphQL tester state
  graphQlTesterTabs: any[];
  activeGraphQlTesterTabId: string | null;
}

interface NavigationStateContextType {
  state: NavigationState;
  updateState: (newState: Partial<NavigationState>) => void;
  resetState: () => void;
}

const NavigationStateContext = createContext<NavigationStateContextType | undefined>(undefined);

const DEFAULT_STATE: NavigationState = {
  selectedProjectId: null,
  apiTesterTabs: [],
  activeApiTesterTabId: null,
  graphQlTesterTabs: [],
  activeGraphQlTesterTabId: null,
};

export function NavigationStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationState>(DEFAULT_STATE);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('navigationState');
    if (savedState) {
      try {
        setState(JSON.parse(savedState));
      } catch (error) {
        console.error('Failed to parse navigation state from localStorage:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('navigationState', JSON.stringify(state));
  }, [state]);

  const updateState = (newState: Partial<NavigationState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const resetState = () => {
    setState(DEFAULT_STATE);
    localStorage.removeItem('navigationState');
  };

  return (
    <NavigationStateContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </NavigationStateContext.Provider>
  );
}

export function useNavigationState() {
  const context = useContext(NavigationStateContext);
  if (context === undefined) {
    throw new Error('useNavigationState must be used within a NavigationStateProvider');
  }
  return context;
}