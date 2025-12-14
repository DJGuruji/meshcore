'use client';

import EndpointListItem from './EndpointListItem';
import { PlayIcon } from '@heroicons/react/24/outline';

interface EndpointField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
  required: boolean;
  description?: string;
  // For nested object validation
  nestedFields?: EndpointField[];
  // For array validation
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
}

type AggregatorType = '' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'total';

interface Endpoint {
  _id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  responseBody: string;
  statusCode: number;
  description?: string;
  requiresAuth?: boolean | null;
  fields?: EndpointField[]; // Add this for POST endpoint field definitions
  // New properties for GET endpoints to reference POST data
  dataSource?: string; // ID of the POST endpoint to get data from
  dataSourceMode?: 'full' | 'field' | 'aggregator';
  dataSourceField?: string;
  dataSourceFields?: string[];
  aggregator?: AggregatorType;
  conditions?: {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
    value: string | number | boolean;
  }[];
  // Pagination settings
  pagination?: {
    enabled: boolean;
    defaultLimit: number;
    maxLimit: number;
  };
}

interface ApiProject {
  _id: string;
  name: string;
  baseUrl: string;
  authentication?: {
    enabled: boolean;
    token?: string | null;
    headerName?: string;
    tokenPrefix?: string;
  };
  endpoints: Endpoint[];
  user: string;
  createdAt: string;
}


interface EndpointListProps {
  project: ApiProject;
  expandedEndpoint: string | null;
  setExpandedEndpoint: (id: string | null) => void;
  handleUpdateEndpoint: (endpointId: string, updates: Partial<Endpoint>) => void;
  handleDeleteEndpoint: (endpointId: string) => void;
  testEndpoint: (endpoint: Endpoint) => void;
  copyEndpointUrl: (endpoint: Endpoint) => void;
  editingConditions: {[key: string]: any[]};
  setEditingConditions: (conditions: {[key: string]: any[]}) => void;
  newEditCondition: {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
  };
  setNewEditCondition: (condition: {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
  }) => void;
  handleAddEditCondition: (endpointId: string) => void;
  handleRemoveEditCondition: (endpointId: string, index: number) => void;
  handleSaveConditions: (endpointId: string) => void;
  handleCancelEditConditions: (endpointId: string) => void;
}

const getSourceFields = (sourceId: string | undefined, project: ApiProject) => {
  if (!sourceId) return [];
  const source = project.endpoints.find((ep: Endpoint) => ep._id === sourceId);
  return source?.fields || [];
};

export default function EndpointList({ 
  project,
  expandedEndpoint,
  setExpandedEndpoint,
  handleUpdateEndpoint,
  handleDeleteEndpoint,
  testEndpoint,
  copyEndpointUrl,
  editingConditions,
  setEditingConditions,
  newEditCondition,
  setNewEditCondition,
  handleAddEditCondition,
  handleRemoveEditCondition,
  handleSaveConditions,
  handleCancelEditConditions
}: EndpointListProps) {
  if (project.endpoints.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 mb-4">
          <PlayIcon className="w-16 h-16 mx-auto opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">No endpoints yet</h3>
        <p className="text-slate-400">Add your first API endpoint to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {project.endpoints.map((endpoint: Endpoint) => {
        const endpointMode = endpoint.dataSourceMode || 'full';
        const endpointAggregator = endpoint.aggregator || '';
        const endpointFields = getSourceFields(endpoint.dataSource, project);
        const endpointSelectedFields =
          (endpoint.dataSourceFields && endpoint.dataSourceFields.length > 0)
            ? endpoint.dataSourceFields
            : endpoint.dataSourceField
              ? [endpoint.dataSourceField]
              : [];
        const isEditingConditions = Boolean(editingConditions[endpoint._id]);
        
        return (
          <EndpointListItem
            key={endpoint._id}
            endpoint={endpoint}
            project={project}
            expandedEndpoint={expandedEndpoint}
            setExpandedEndpoint={setExpandedEndpoint}
            handleUpdateEndpoint={handleUpdateEndpoint}
            handleDeleteEndpoint={handleDeleteEndpoint}
            testEndpoint={testEndpoint}
            copyEndpointUrl={copyEndpointUrl}
            editingConditions={editingConditions}
            setEditingConditions={setEditingConditions}
            newEditCondition={newEditCondition}
            setNewEditCondition={setNewEditCondition}
            handleAddEditCondition={handleAddEditCondition}
            handleRemoveEditCondition={handleRemoveEditCondition}
            handleSaveConditions={handleSaveConditions}
            handleCancelEditConditions={handleCancelEditConditions}
          />
        );
      })}
    </div>
  );
};