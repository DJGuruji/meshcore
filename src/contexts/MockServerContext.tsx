'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiProject } from '@/lib/models';

interface MockServerState {
  projects: ApiProject[];
  selectedProject: ApiProject | null;
  isLoading: boolean;
  isCreatingProject: boolean;
}

interface MockServerContextType {
  state: MockServerState;
  updateState: (newState: Partial<MockServerState>) => void;
  resetState: () => void;
}

const MockServerContext = createContext<MockServerContextType | undefined>(undefined);

const DEFAULT_STATE: MockServerState = {
  projects: [],
  selectedProject: null,
  isLoading: true,
  isCreatingProject: false,
};

export function MockServerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MockServerState>(DEFAULT_STATE);

  const updateState = (newState: Partial<MockServerState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const resetState = () => {
    setState(DEFAULT_STATE);
  };

  return (
    <MockServerContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </MockServerContext.Provider>
  );
}

export function useMockServer() {
  const context = useContext(MockServerContext);
  if (context === undefined) {
    throw new Error('useMockServer must be used within a MockServerProvider');
  }
  return context;
}