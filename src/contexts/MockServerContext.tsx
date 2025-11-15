'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiProject as ApiProjectModel } from '@/lib/models';

// Define the ApiProject interface to match the Mongoose model structure
interface ApiProjectType {
  _id: string;
  name: string;
  baseUrl: string;
  authentication?: {
    enabled: boolean;
    token?: string | null;
    headerName?: string;
    tokenPrefix?: string;
  };
  endpoints: {
    _id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    responseBody: string;
    statusCode: number;
    description?: string;
    requiresAuth?: boolean | null;
    fields?: {
      name: string;
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required: boolean;
      description?: string;
    }[];
    dataSource?: string;
    conditions?: {
      field: string;
      operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
      value: string | number | boolean;
    }[];
    pagination?: {
      enabled: boolean;
      defaultLimit: number;
      maxLimit: number;
    };
  }[];
  user: string;
  createdAt: string;
  updatedAt: string;
}

interface MockServerState {
  projects: ApiProjectType[];
  selectedProject: ApiProjectType | null;
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