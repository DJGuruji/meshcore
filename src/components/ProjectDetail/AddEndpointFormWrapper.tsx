// This file contains the wrapper logic for the three-mode API creation system
// It routes between ApiModeSelector and the three mode-specific forms

import { useState, useEffect } from 'react';
import ApiModeSelector from './ApiModeSelector';
import StaticApiForm from './StaticApiForm';
import CrudApiForm from './CrudApiForm';
import CustomApiForm from './CustomApiForm';

interface AddEndpointFormWrapperProps {
  project: any;
  showAddEndpoint: boolean;
  newEndpoint: any;
  setNewEndpoint: (endpoint: any) => void;
  validationErrors: Record<string, boolean>;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  handleAddEndpoint: () => void;
  setShowAddEndpoint: (show: boolean) => void;
}

export default function AddEndpointFormWrapper({
  project,
  showAddEndpoint,
  newEndpoint,
  setNewEndpoint,
  validationErrors,
  setValidationErrors,
  handleAddEndpoint,
  setShowAddEndpoint
}: AddEndpointFormWrapperProps) {
  const [apiMode, setApiMode] = useState<'static' | 'crud' | 'custom' | null>(null);

  // Reset mode when modal closes
  useEffect(() => {
    if (!showAddEndpoint) {
      setApiMode(null);
    }
  }, [showAddEndpoint]);

  if (!showAddEndpoint) return null;

  // Show mode selector if no mode selected
  if (!apiMode) {
    return (
      <ApiModeSelector
        onSelectMode={(mode) => {
          setApiMode(mode);
          // Set initial values based on mode
          if (mode === 'static') {
            setNewEndpoint({ ...newEndpoint, method: 'GET', apiMode: 'static' });
          } else if (mode === 'crud') {
            setNewEndpoint({ 
              ...newEndpoint, 
              method: 'POST', 
              apiMode: 'crud', 
              resourceName: '', 
              fields: [], 
              conditions: [],
              pagination: { enabled: true, defaultLimit: 10, maxLimit: 100 }
            });
          } else if (mode === 'custom') {
            setNewEndpoint({ 
              ...newEndpoint, 
              method: 'GET', 
              apiMode: 'custom', 
              dataSource: '', 
              conditions: [],
              pagination: { enabled: false, defaultLimit: 10, maxLimit: 100 }
            });
          }
        }}
        onCancel={() => {
          setShowAddEndpoint(false);
          setValidationErrors({});
        }}
      />
    );
  }

  // Show Static API form
  if (apiMode === 'static') {
    return (
      <StaticApiForm
        project={project}
        newEndpoint={newEndpoint}
        setNewEndpoint={setNewEndpoint}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        handleAddEndpoint={handleAddEndpoint}
        onBack={() => setApiMode(null)}
        onCancel={() => {
          setShowAddEndpoint(false);
          setValidationErrors({});
          setApiMode(null);
        }}
      />
    );
  }

  // Show CRUD API form
  if (apiMode === 'crud') {
    return (
      <CrudApiForm
        project={project}
        newEndpoint={newEndpoint}
        setNewEndpoint={setNewEndpoint}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        handleAddEndpoint={handleAddEndpoint}
        onBack={() => setApiMode(null)}
        onCancel={() => {
          setShowAddEndpoint(false);
          setValidationErrors({});
          setApiMode(null);
        }}
      />
    );
  }

  // Show Custom API form
  if (apiMode === 'custom') {
    return (
      <CustomApiForm
        project={project}
        newEndpoint={newEndpoint}
        setNewEndpoint={setNewEndpoint}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        handleAddEndpoint={handleAddEndpoint}
        onBack={() => setApiMode(null)}
        onCancel={() => {
          setShowAddEndpoint(false);
          setValidationErrors({});
          setApiMode(null);
        }}
      />
    );
  }

  return null;
}
