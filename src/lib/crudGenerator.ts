import { generateJsonFromFields } from '@/lib/jsonGenerator';

interface EndpointField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
  required: boolean;
  description?: string;
  nestedFields?: EndpointField[];
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
}

interface CrudSettings {
  resourceName: string;
  fields: EndpointField[];
  description?: string;
  requiresAuth?: boolean | null;
  pagination?: {
    enabled: boolean;
    defaultLimit: number;
    maxLimit: number;
  };
}

export interface CrudEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CRUD'; // Add 'CRUD' as a virtual method
  statusCode: number;
  responseBody: string;
  description: string;
  requiresAuth?: boolean | null;
  fields?: EndpointField[];
  dataSource?: string;
  dataSourceMode?: 'full' | 'field' | 'aggregator';
  pagination?: {
    enabled: boolean;
    defaultLimit: number;
    maxLimit: number;
  };
  conditions?: any[];
  isCrud?: boolean;
  resourceName?: string;
}

/**
 * Generate a consolidated CRUD endpoint definition
 * Returns a single endpoint object flagged with isCrud: true
 */
export function generateCrudEndpoints(settings: CrudSettings): CrudEndpoint {
  const { resourceName, fields, description, requiresAuth, pagination } = settings;
  
  // Normalize path (ensure it starts with / and remove trailing /:id if present)
  let basePath = resourceName.startsWith('/') ? resourceName : `/${resourceName}`;
  
  // Remove trailing /:id if user included it
  basePath = basePath.replace(/\/:id$/i, '');
  
  // Extract resource name for descriptions
  const resourceDisplayName = basePath.replace('/', '').replace(/-/g, ' ');
  
  // Generate sample JSON from fields
  const sampleJson = generateJsonFromFields(fields);
  
  return {
    path: basePath,
    method: 'CRUD', // Virtual method for UI display
    statusCode: 200,
    responseBody: sampleJson,
    description: description || `Unified CRUD endpoint for ${resourceDisplayName}`,
    requiresAuth: requiresAuth !== undefined ? requiresAuth : null,
    fields: fields,
    isCrud: true,
    resourceName: resourceDisplayName,
    pagination: pagination || {
      enabled: true,
      defaultLimit: 10,
      maxLimit: 100
    },
    conditions: []
  };
}
