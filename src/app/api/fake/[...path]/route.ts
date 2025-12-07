import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ApiProject, MockServerData, User } from '@/lib/models';
import { extractTokenFromHeader } from '@/lib/tokenUtils';
import cache from '@/lib/cache';
import { sendRequestLimitNotification, sendStorageLimitNotification } from '@/lib/email';

// Helper function to match endpoint path with project name
function matchEndpoint(requestPath: string, projectName: string, baseUrl: string, endpointPath: string, method: string): boolean {
  // Expected path format: /{projectName}{baseUrl}{endpointPath}
  const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const expectedPath = `/${cleanProjectName}${baseUrl}${endpointPath}`;

   // For GET, PUT, PATCH, DELETE methods, the path might include an ID parameter at the end
  if (method === 'GET' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    // Check if the request path matches the expected path with an ID at the end
    const pathWithIdPattern = new RegExp(`^${expectedPath}/[0-9a-fA-F]{24}$`);
    if (pathWithIdPattern.test(requestPath)) {
      return true;
    }
  }
  
  return requestPath === expectedPath;
}

// Helper function to evaluate conditions
function evaluateCondition(dataValue: any, operator: string, conditionValue: any): boolean {
  try {
    switch (operator) {
      case '=':
        return dataValue == conditionValue;
      case '!=':
        return dataValue != conditionValue;
      case '>':
        return dataValue > conditionValue;
      case '<':
        return dataValue < conditionValue;
      case '>=':
        return dataValue >= conditionValue;
      case '<=':
        return dataValue <= conditionValue;
      case 'contains':
        return String(dataValue).includes(String(conditionValue));
      case 'startsWith':
        return String(dataValue).startsWith(String(conditionValue));
      case 'endsWith':
        return String(dataValue).endsWith(String(conditionValue));
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

// Helper function to validate POST request body against defined fields
function validatePostRequestBody(fields: any[], requestBody: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = fields.filter(field => field.required);
  
  // Check if all required fields are present
  for (const field of requiredFields) {
    if (!(field.name in requestBody)) {
      errors.push(`Required field '${field.name}' is missing`);
    } else if (requestBody[field.name] === null || requestBody[field.name] === undefined || requestBody[field.name] === '') {
      errors.push(`Required field '${field.name}' cannot be null or empty`);
    }
  }
  
  // Check field types if present
  for (const field of fields) {
    if (field.name in requestBody && requestBody[field.name] !== null && requestBody[field.name] !== undefined) {
      const value = requestBody[field.name];
      const fieldTypeResult = validateFieldType(field, value, `Field '${field.name}'`);
      if (!fieldTypeResult.isValid) {
        errors.push(...fieldTypeResult.errors);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// Helper function to validate a field's type recursively
function validateFieldType(field: any, value: any, fieldName: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (field.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} should be a string`);
      }
      break;
    case 'number':
      if (typeof value !== 'number') {
        errors.push(`${fieldName} should be a number`);
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`${fieldName} should be a boolean`);
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`${fieldName} should be an object`);
      } else if (field.nestedFields && Array.isArray(field.nestedFields)) {
        // Recursively validate nested fields
        for (const nestedField of field.nestedFields) {
          if (nestedField.name in value) {
            const nestedValue = value[nestedField.name];
            const nestedFieldName = `${fieldName}.${nestedField.name}`;
            const nestedResult = validateFieldType(nestedField, nestedValue, nestedFieldName);
            if (!nestedResult.isValid) {
              errors.push(...nestedResult.errors);
            }
          } else if (nestedField.required) {
            errors.push(`Required field ${fieldName}.${nestedField.name} is missing`);
          }
        }
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`${fieldName} should be an array`);
      } else if (field.arrayItemType) {
        // Validate each item in the array
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          const itemFieldName = `${fieldName}[${i}]`;
          
          // Create a temporary field object for validation
          const itemField = {
            type: field.arrayItemType,
            nestedFields: field.nestedFields // For object arrays
          };
          
          const itemResult = validateFieldType(itemField, item, itemFieldName);
          if (!itemResult.isValid) {
            errors.push(...itemResult.errors);
          }
        }
      }
      break;
  }
  
  return { isValid: errors.length === 0, errors };
}

// Helper function to filter data based on conditions
function filterDataByConditions(data: any, conditions: any[]): any {
  if (!conditions || conditions.length === 0) {
    return data;
  }

  // If data is an array, filter each item
  if (Array.isArray(data)) {
    return data.filter(item => {
      return conditions.every(condition => {
        const dataValue = item[condition.field];
        return evaluateCondition(dataValue, condition.operator, condition.value);
      });
    });
  }
  
  // If data is a single object, check if it matches all conditions
  const matches = conditions.every(condition => {
    const dataValue = data[condition.field];
    return evaluateCondition(dataValue, condition.operator, condition.value);
  });
  
  return matches ? data : null;
}

function normalizeToArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
}

function getFieldValue(entry: any, field: string) {
  if (!entry || typeof entry !== 'object') return undefined;
  return entry[field];
}

function projectEntryFields(entry: any, fields: string[]) {
  if (!entry || typeof entry !== 'object' || fields.length === 0) {
    return entry;
  }

  if (fields.length === 1) {
    return getFieldValue(entry, fields[0]);
  }

  const projected: Record<string, any> = {};
  fields.forEach((field) => {
    const value = getFieldValue(entry, field);
    if (value !== undefined) {
      projected[field] = value;
    }
  });
  return projected;
}

function applyFieldProjection(data: any, fields: string[]) {
  if (!fields || fields.length === 0) return data;
  if (Array.isArray(data)) {
    return data.map(item => projectEntryFields(item, fields));
  }
  if (data && typeof data === 'object') {
    return projectEntryFields(data, fields);
  }
  return data;
}

function calculateAggregatorResult(data: any, field: string, aggregator: string) {
  const rows = normalizeToArray(data);
  if (aggregator === 'count') {
    return {
      field,
      aggregator,
      value: rows.length,
      totalRecords: rows.length
    };
  }

  const numericValues = rows
    .map(item => Number(getFieldValue(item, field)))
    .filter(value => !Number.isNaN(value));
  const safeValues = numericValues.length > 0 ? numericValues : [0];
  const sum = safeValues.reduce((acc, value) => acc + value, 0);
  const normalizedAggregator = aggregator === 'total' ? 'sum' : aggregator;

  let value = 0;
  switch (normalizedAggregator) {
    case 'sum':
      value = sum;
      break;
    case 'avg':
      value = numericValues.length > 0 ? sum / numericValues.length : 0;
      break;
    case 'min':
      value = Math.min(...safeValues);
      break;
    case 'max':
      value = Math.max(...safeValues);
      break;
    default:
      value = sum;
      break;
  }

  return {
    field,
    aggregator,
    value,
    totalRecords: rows.length,
    processedValues: numericValues.length
  };
}

// Helper function to check rate limits
async function checkRateLimit(project: any): Promise<{ allowed: boolean; message?: string }> {
  try {
    // Get the user associated with the project
    const user = await User.findById(project.user);
    if (!user) {
      return { allowed: false, message: 'User not found' };
    }
    
    // Calculate rate limits based on account type
    let maxRequestsPerSecond = 5; // Default to 5 r/s for free tier
    switch (user.accountType) {
      case 'free':
        maxRequestsPerSecond = 5;
        break;
      case 'freemium':
        maxRequestsPerSecond = 20;
        break;
      case 'pro':
        maxRequestsPerSecond = 100;
        break;
      case 'ultra-pro':
        maxRequestsPerSecond = 500;
        break;
    }
    
    // Check if enough time has passed since last request
    const now = Date.now();
    const lastRequestTime = user.lastRequestAt ? user.lastRequestAt.getTime() : 0;
    const timeSinceLastRequest = now - lastRequestTime;
    
    // Calculate minimum time between requests (in milliseconds)
    const minTimeBetweenRequests = 1000 / maxRequestsPerSecond;
    
    if (timeSinceLastRequest < minTimeBetweenRequests) {
      const waitTime = Math.ceil(minTimeBetweenRequests - timeSinceLastRequest);
      return { 
        allowed: false, 
        message: `Rate limit exceeded. Please wait ${waitTime}ms before making another request.`
      };
    }
    
    // Update last request time
    user.lastRequestAt = new Date(now);
    await user.save();
    
    return { allowed: true };
  } catch (error) {
    // Allow the operation if there's an error checking limits
    return { allowed: true };
  }
}

// Helper function to check daily request limits
async function checkDailyRequestLimit(project: any): Promise<{ allowed: boolean; message?: string }> {
  try {
    // Get the user associated with the project
    const user = await User.findById(project.user);
    if (!user) {
      return { allowed: false, message: 'User not found' };
    }
    
    // Initialize lastRequestReset if it doesn't exist
    if (!user.lastRequestReset) {
      user.lastRequestReset = new Date();
      await user.save();
    }
    
    // Check if 24 hours have passed since last reset
    const now = new Date();
    const lastReset = new Date(user.lastRequestReset);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
    
    // If 24 hours have passed, reset the counter
    if (hoursSinceReset >= 24) {
      user.dailyRequests.clear(); // Clear all daily request counts
      user.lastRequestReset = now;
      await user.save();
    }
    
    // Calculate request limits based on account type
    let maxRequests = 300; // Default to 300 for free tier
    switch (user.accountType) {
      case 'free':
        maxRequests = 300;
        break;
      case 'freemium':
        maxRequests = 3000;
        break;
      case 'pro':
        maxRequests = 20000;
        break;
      case 'ultra-pro':
        maxRequests = 200000;
        break;
    }
    
    // Get current request count for the current 24-hour window
    const currentWindowKey = lastReset.toISOString();
    const currentRequests = user.dailyRequests.get(currentWindowKey) || 0;
    
    // Check if limit is exceeded
    if (currentRequests >= maxRequests) {
      // Calculate when the limit will renew
      const renewalTime = new Date(lastReset.getTime() + (24 * 60 * 60 * 1000));
      
      // Send email notification (only once per limit exceeded period)
      const shouldSendEmail = !user.lastRequestLimitEmailSent || 
        (now.getTime() - new Date(user.lastRequestLimitEmailSent).getTime()) > (24 * 60 * 60 * 1000);
      
      if (shouldSendEmail) {
        try {
          await sendRequestLimitNotification(
            user.email,
            user.accountType,
            currentRequests,
            maxRequests,
            renewalTime
          );
          
          // Update the last email sent time
          user.lastRequestLimitEmailSent = now;
          await user.save();
        } catch (emailError) {
        }
      }
      
      return { 
        allowed: false, 
        message: `Daily request limit exceeded. You have used all ${maxRequests} requests for your ${user.accountType} account. Limit will renew at ${renewalTime.toLocaleString()}.`
      };
    }
    
    // Update request count
    user.dailyRequests.set(currentWindowKey, currentRequests + 1);
    await user.save();
    
    return { allowed: true };
  } catch (error) {
    // Allow the operation if there's an error checking limits
    return { allowed: true };
  }
}

// Helper function to check storage limits
async function checkStorageLimit(project: any, dataSize: number, isWriteOperation: boolean = true): Promise<{ allowed: boolean; message?: string }> {
  try {
    // Get the user associated with the project
    const user = await User.findById(project.user);
    if (!user) {
      return { allowed: false, message: 'User not found' };
    }
    
    // Calculate storage limits based on account type
    let maxStorage = 10 * 1024 * 1024; // Default to 10 MB for free tier
    switch (user.accountType) {
      case 'free':
        maxStorage = 10 * 1024 * 1024; // 10 MB
        break;
      case 'freemium':
        maxStorage = 200 * 1024 * 1024; // 200 MB
        break;
      case 'pro':
        maxStorage = 1024 * 1024 * 1024; // 1 GB
        break;
      case 'ultra-pro':
        maxStorage = 5 * 1024 * 1024 * 1024; // 5 GB
        break;
    }
    
    // Check if adding this data would exceed the limit
    const currentUsage = user.storageUsage || 0;
    const newUsage = currentUsage + dataSize;
    
    if (newUsage > maxStorage) {
      // For write operations, block when storage is full
      if (isWriteOperation) {
        // Send email notification (only once per limit exceeded period)
        const now = new Date();
        const shouldSendEmail = !user.lastStorageLimitEmailSent || 
          (now.getTime() - new Date(user.lastStorageLimitEmailSent).getTime()) > (24 * 60 * 60 * 1000);
        
        if (shouldSendEmail) {
          try {
            await sendStorageLimitNotification(
              user.email,
              user.accountType,
              currentUsage,
              maxStorage
            );
            
            // Update the last email sent time
            user.lastStorageLimitEmailSent = now;
            await user.save();
          } catch (emailError) {
          }
        }
        
        return { 
          allowed: false, 
          message: `Storage limit exceeded. You have used ${Math.round(currentUsage / (1024 * 1024))} MB of your ${Math.round(maxStorage / (1024 * 1024))} MB limit for your ${user.accountType} account. Only read operations are allowed until storage is freed by deleting some data.`
        };
      }
      // For read operations, allow even when storage is full
      // This enables read-only mode when storage is full
      return { allowed: true };
    }
    
    return { allowed: true };
  } catch (error) {
    // Allow the operation if there's an error checking limits
    return { allowed: true };
  }
}

// Helper function to add CORS headers to response
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// Handle all HTTP methods for fake API endpoints
async function handleRequest(request: NextRequest, method: string) {
  try {
    await connectDB();
    
    // Extract path from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/api/fake/');
    
    // Periodically clean up old request data (roughly 1 in 100 requests)
    if (Math.random() < 0.01) {
      try {
        // Find a few users and clean up their old request data
        const users = await User.find().limit(10);
        for (const user of users) {
          user.cleanupOldRequestData();
          await user.save();
        }
      } catch (cleanupError) {
      }
    }
    
    if (pathSegments.length < 2) {
      const response = NextResponse.json({ error: 'Invalid API path' }, { status: 404 });
      return addCorsHeaders(response);
    }
    
    const fullPath = '/' + pathSegments[1];
    
    // Find all projects and check their endpoints
    const projects = await ApiProject.find({});
    
    for (const project of projects) {
      for (const endpoint of project.endpoints) {
        if (matchEndpoint(fullPath, project.name, project.baseUrl, endpoint.path, method) && endpoint.method === method) {
                    
          // Check daily request limit
          const requestLimitCheck = await checkDailyRequestLimit(project);
          if (!requestLimitCheck.allowed) {
            const response = NextResponse.json({ 
              error: 'Daily request limit exceeded',
              message: requestLimitCheck.message
            }, { status: 429 });
            return addCorsHeaders(response);
          }
          
          // Check rate limit
          const rateLimitCheck = await checkRateLimit(project);
          if (!rateLimitCheck.allowed) {
            const response = NextResponse.json({ 
              error: 'Rate limit exceeded',
              message: rateLimitCheck.message
            }, { status: 429 });
            return addCorsHeaders(response);
          }
                    
          // Check authentication requirements
          const projectAuthEnabled = project.authentication?.enabled || false;
          const endpointRequiresAuth = endpoint.requiresAuth !== null ? endpoint.requiresAuth : projectAuthEnabled;
          
          if (endpointRequiresAuth) {
            const authHeader = request.headers.get(project.authentication?.headerName || 'Authorization');
            const providedToken = extractTokenFromHeader(authHeader || '', project.authentication?.tokenPrefix || 'Bearer');
            
            if (!providedToken || providedToken !== project.authentication?.token) {
              const response = NextResponse.json({ 
                error: 'Unauthorized',
                message: 'Valid authentication token required',
                requiredHeader: project.authentication?.headerName || 'Authorization',
                tokenFormat: `${project.authentication?.tokenPrefix || 'Bearer'} <token>`
              }, { status: 401 });
              return addCorsHeaders(response);
            }
          }
          
          // For POST requests, validate required fields if defined
          if (method === 'POST' && endpoint.fields && endpoint.fields.length > 0) {
            try {
              const requestBody = await request.json();
              const validation = validatePostRequestBody(endpoint.fields, requestBody);
              
              if (!validation.isValid) {
                const response = NextResponse.json({ 
                  error: 'Validation failed',
                  message: 'Required fields are missing or invalid',
                  details: validation.errors
                }, { status: 400 });
                return addCorsHeaders(response);
              }
              
              // Check storage limit before storing data (write operation)
              const dataSize = Buffer.byteLength(JSON.stringify(requestBody), 'utf8');
              const storageCheck = await checkStorageLimit(project, dataSize, true);
              if (!storageCheck.allowed) {
                const response = NextResponse.json({ 
                  error: 'Storage limit exceeded',
                  message: storageCheck.message,
                  readOnlyMode: true
                }, { status: 400 });
                return addCorsHeaders(response);
              }
              
              // Store the data in the database
              try {
                const mockData = new MockServerData({
                  endpointId: endpoint._id,
                  projectId: project._id,
                  data: requestBody
                });
                await mockData.save();
                
                // Update user's storage usage
                try {
                  const user = await User.findById(project.user);
                  if (user) {
                    const dataSize = Buffer.byteLength(JSON.stringify(requestBody), 'utf8');
                    const currentUsage = user.storageUsage || 0;
                    await User.findByIdAndUpdate(project.user, { 
                      storageUsage: currentUsage + dataSize 
                    });
                  }
                } catch (storageError) {
                }
                
                // Invalidate cache for this endpoint (fire-and-forget)
                const cacheKeyPattern = `mock:${project._id}:${endpoint._id}:*`;
                cache.del(cacheKeyPattern).catch(err => {
                });
                
                // Return success response with the stored data
                const successResponse = NextResponse.json({ 
                  message: 'Data stored successfully',
                  data: requestBody,
                  id: mockData._id
                }, { status: 201 });
                return addCorsHeaders(successResponse);
              } catch (saveError) {
                // Return error response
                const errorResponse = NextResponse.json({ 
                  error: 'Failed to store data',
                  message: 'Data validation passed but storage failed'
                }, { status: 500 });
                return addCorsHeaders(errorResponse);
              }
            } catch (error) {
              // Return error response for invalid JSON
              const errorResponse = NextResponse.json({ 
                error: 'Invalid JSON',
                message: 'Request body must be valid JSON'
              }, { status: 400 });
              return addCorsHeaders(errorResponse);
            }
          }
          
          // For PUT, PATCH, DELETE requests, handle data source if defined
          if ((method === 'PUT' || method === 'PATCH' || method === 'DELETE') && endpoint.dataSource) {
            try {
              // Extract ID from path if present
              const pathParts = fullPath.split('/');
              const id = pathParts[pathParts.length - 1];
              const basePath = pathParts.slice(0, -1).join('/');
              
              // Check if the ID is a valid MongoDB ObjectId format
              const isValidId = /^[0-9a-fA-F]{24}$/.test(id);
              
              // Find the source endpoint
              const sourceEndpoint = project.endpoints.find((ep: typeof endpoint) => 
                ep._id && endpoint.dataSource && 
                ep._id.toString() === endpoint.dataSource.toString());
              
              if (sourceEndpoint) {
                // Get data from the database
                let query: any = { 
                  endpointId: sourceEndpoint._id,
                  projectId: project._id
                };
                
                // If we have a valid ID, filter by it
                if (isValidId) {
                  query._id = id;
                }
                
                const storedData = await MockServerData.find(query).sort({ createdAt: -1 });
                
                if (storedData.length > 0) {
                  let sourceData;
                  if (storedData.length === 1) {
                    sourceData = {
                      id: storedData[0]._id,
                      ...storedData[0].data
                    };
                  } else {
                    // Return array of all stored data with IDs
                    sourceData = storedData.map(item => ({
                      id: item._id,
                      ...item.data
                    }));
                  }
                  
                  // Apply conditions if any
                  const filteredData = filterDataByConditions(sourceData, endpoint.conditions || []);
                  
                  // For DELETE requests, remove the data
                  if (method === 'DELETE') {
                    // Get the data size before deleting to update storage usage
                    let dataSize = 0;
                    if (isValidId) {
                      const dataToDelete = await MockServerData.findById(id);
                      if (dataToDelete) {
                        dataSize = Buffer.byteLength(JSON.stringify(dataToDelete.data), 'utf8');
                      }
                    }
                    
                    // Delete the filtered data
                    if (isValidId) {
                      await MockServerData.deleteOne({ _id: id });
                      
                      // Update user's storage usage
                      try {
                        const user = await User.findById(project.user);
                        if (user && dataSize > 0) {
                          const currentUsage = user.storageUsage || 0;
                          await User.findByIdAndUpdate(project.user, { 
                            storageUsage: Math.max(0, currentUsage - dataSize) 
                          });
                        }
                      } catch (storageError) {
                      }
                    }
                    
                    // Invalidate cache for this endpoint (fire-and-forget)
                    const cacheKeyPattern = `mock:${project._id}:${endpoint._id}:*`;
                    cache.del(cacheKeyPattern).catch(err => {
                    });
                    
                    const deleteResponse = NextResponse.json({ 
                      message: 'Data deleted successfully',
                      deletedData: filteredData
                    }, { status: 200 });
                    return addCorsHeaders(deleteResponse);
                  }
                  
                  // For PUT/PATCH requests, update the data
                  if (method === 'PUT' || method === 'PATCH') {
                    let requestBody;
                    try {
                      requestBody = await request.json();
                    } catch (jsonError) {
                      requestBody = {};
                    }
                    
                    // Check storage limit before updating data
                    const newDataSize = Buffer.byteLength(JSON.stringify(requestBody), 'utf8');
                    let oldDataSize = 0;
                    
                    // Get the old data size for storage calculation
                    if (isValidId) {
                      const oldData = await MockServerData.findById(id);
                      if (oldData) {
                        oldDataSize = Buffer.byteLength(JSON.stringify(oldData.data), 'utf8');
                      }
                    }
                    
                    // Check if the update would exceed storage limits (write operation)
                    const storageDiff = newDataSize - oldDataSize;
                    if (storageDiff > 0) {
                      const storageCheck = await checkStorageLimit(project, storageDiff, true);
                      if (!storageCheck.allowed) {
                        const response = NextResponse.json({ 
                          error: 'Storage limit exceeded',
                          message: storageCheck.message,
                          readOnlyMode: true
                        }, { status: 400 });
                        return addCorsHeaders(response);
                      }
                    }
                    
                    // Update the data
                    if (isValidId) {
                      await MockServerData.updateOne(
                        { _id: id },
                        { 
                          $set: { 
                            data: {
                              ...storedData[0].data,
                              ...requestBody
                            },
                            updatedAt: new Date()
                          }
                        }
                      );
                      
                      // Update user's storage usage
                      try {
                        const user = await User.findById(project.user);
                        if (user) {
                          const currentUsage = user.storageUsage || 0;
                          const newUsage = Math.max(0, currentUsage + storageDiff);
                          await User.findByIdAndUpdate(project.user, { 
                            storageUsage: newUsage 
                          });
                        }
                      } catch (storageError) {
                      }
                    }
                    
                    // Invalidate cache for this endpoint (fire-and-forget)
                    const cacheKeyPattern = `mock:${project._id}:${endpoint._id}:*`;
                    cache.del(cacheKeyPattern).catch(err => {
                    });
                    
                    const updateResponse = NextResponse.json({ 
                      message: 'Data updated successfully',
                      updatedData: {
                        id: isValidId ? id : undefined,
                        ...filteredData,
                        ...requestBody
                      }
                    }, { status: 200 });
                    return addCorsHeaders(updateResponse);
                  }
                } else {
                  // No data found
                  if (method === 'DELETE') {
                    const deleteResponse = NextResponse.json({ 
                      message: 'No data found to delete'
                    }, { status: 404 });
                    return addCorsHeaders(deleteResponse);
                  } else if (method === 'PUT' || method === 'PATCH') {
                    const updateResponse = NextResponse.json({ 
                      message: 'No data found to update'
                    }, { status: 404 });
                    return addCorsHeaders(updateResponse);
                  }
                }
              }
            } catch (error) {
              // Fall back to original response handling
            }
          }
          
          // Handle GET endpoints with data source
          if (method === 'GET' && endpoint.dataSource) {
            // Check storage limit for read operations (to inform user about read-only mode)
            const storageCheck = await checkStorageLimit(project, 0, false);
            if (!storageCheck.allowed) {
              // Add a header to indicate read-only mode
              // We still allow the GET request to proceed
            }
            // Generate cache key
            const configuredFields = Array.isArray(endpoint.dataSourceFields) ? endpoint.dataSourceFields : [];
            const fallbackField = endpoint.dataSourceField ? [endpoint.dataSourceField] : [];
            const dataSourceFields = configuredFields.length > 0 ? configuredFields : fallbackField;
            const fieldsKey = dataSourceFields.length > 0 ? dataSourceFields.slice().sort().join('|') : 'all';
            const cacheKey = `mock:${project._id}:${endpoint._id}:${fullPath}:${endpoint.dataSourceMode || 'full'}:${fieldsKey}:${endpoint.aggregator || 'none'}`;
            
            // Try to get from cache first
            const cachedResponse = await cache.get(cacheKey);
            if (cachedResponse) {
              const response = NextResponse.json(cachedResponse, { status: endpoint.statusCode });
              return addCorsHeaders(response);
            }
            
            
            // Find the source endpoint
            const sourceEndpoint = project.endpoints.find((ep: typeof endpoint) => 
              ep._id && endpoint.dataSource && 
              ep._id.toString() === endpoint.dataSource.toString());
            if (sourceEndpoint) {
              try {
                // Extract ID from path if present
                const pathParts = fullPath.split('/');
                const potentialId = pathParts[pathParts.length - 1];
                
                // Check if the last part of the path is a valid MongoDB ObjectId
                const isValidId = /^[0-9a-fA-F]{24}$/.test(potentialId);
                
                let query: any = { 
                  endpointId: sourceEndpoint._id,
                  projectId: project._id
                };
                
                // If we have a valid ID, filter by it
                if (isValidId) {
                  query._id = potentialId;
                }
                
                // Get data from the database
                const storedData = await MockServerData.find(query).sort({ createdAt: -1 });
                
                let sourceData;
                if (storedData.length > 0) {
                  // Use the stored data
                  if (storedData.length === 1 && isValidId) {
                    // If we're fetching a specific item by ID, return just that item
                    sourceData = {
                      id: storedData[0]._id,
                      ...storedData[0].data
                    };
                  } else if (!isValidId) {
                    // If no ID was provided, return all items (array)
                    sourceData = storedData.map(item => ({
                      id: item._id,
                      ...item.data
                    }));
                  } else {
                    // If ID was provided but no item found, return 404
                    const notFoundResponse = NextResponse.json({ 
                      error: 'Item not found',
                      id: potentialId
                    }, { status: 404 });
                    return addCorsHeaders(notFoundResponse);
                  }
                } else {
                  // If no data is stored, fall back to the original response body
                  if (!isValidId) {
                    // Only fall back for general GET requests, not specific ID requests
                    sourceData = JSON.parse(sourceEndpoint.responseBody);
                  } else {
                    // If specific ID requested but no data found, return 404
                    const notFoundResponse = NextResponse.json({ 
                      error: 'Item not found',
                      id: potentialId
                    }, { status: 404 });
                    return addCorsHeaders(notFoundResponse);
                  }
                }
                
                // Apply conditions if any
                const filteredData = filterDataByConditions(sourceData, endpoint.conditions || []);
                const dataSourceMode = endpoint.dataSourceMode || 'full';
                const selectedAggregator = endpoint.aggregator || '';

                if (dataSourceMode === 'aggregator' && dataSourceFields.length > 0 && selectedAggregator) {
                  const aggregatorResults = dataSourceFields.map((fieldName: string) =>
                    calculateAggregatorResult(filteredData, fieldName, selectedAggregator)
                  );
                  const aggregatorPayload = aggregatorResults.length === 1 ? aggregatorResults[0] : aggregatorResults;
                  cache.set(cacheKey, aggregatorPayload, { ttl: 300 }).catch(err => {
                  });
                  const response = NextResponse.json(aggregatorPayload, { status: endpoint.statusCode });
                  return addCorsHeaders(response);
                }
                
                // Handle pagination if enabled (only for general GET requests, not specific ID requests)
                let paginatedData = filteredData;
                let paginationInfo = null;
                
                if (endpoint.pagination?.enabled && Array.isArray(filteredData) && !isValidId) {
                  // Get pagination parameters from query string
                  const url = new URL(request.url);
                  const page = parseInt(url.searchParams.get('page') || '1');
                  const limit = Math.min(
                    parseInt(url.searchParams.get('limit') || endpoint.pagination.defaultLimit.toString()),
                    endpoint.pagination.maxLimit
                  );
                  
                  // Calculate pagination
                  const startIndex = (page - 1) * limit;
                  const endIndex = startIndex + limit;
                  const totalPages = Math.ceil(filteredData.length / limit);
                  
                  // Slice the data
                  paginatedData = filteredData.slice(startIndex, endIndex);
                  
                  // Add pagination info
                  paginationInfo = {
                    page,
                    limit,
                    total: filteredData.length,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                  };
                }

                if (dataSourceMode === 'field' && dataSourceFields.length > 0) {
                  paginatedData = applyFieldProjection(paginatedData, dataSourceFields);
                }
                
                // Prepare response data
                const responseData = paginationInfo 
                  ? { data: paginatedData, pagination: paginationInfo }
                  : paginatedData;
                
                // Cache the response (fire-and-forget, don't await)
                cache.set(cacheKey, responseData, { ttl: 300 }).catch(err => {
                });
                
                const response = NextResponse.json(responseData, { status: endpoint.statusCode });
                return addCorsHeaders(response);
              } catch (error) {
                // Fall back to original response body
              }
            }
          }
          
          // Check storage limit for read operations (to inform user about read-only mode)
          const storageCheck = await checkStorageLimit(project, 0, false);
          
          try {
            const responseBody = JSON.parse(endpoint.responseBody);
            const response = NextResponse.json(responseBody, { status: endpoint.statusCode });
            // Add read-only mode indicator if needed
            if (!storageCheck.allowed) {
              response.headers.set('X-Read-Only-Mode', 'true');
            }
            return addCorsHeaders(response);
          } catch (error) {
            // If JSON parsing fails, return as plain text
            const response = new NextResponse(endpoint.responseBody, { 
              status: endpoint.statusCode,
              headers: { 'Content-Type': 'text/plain' }
            });
            // Add read-only mode indicator if needed
            if (!storageCheck.allowed) {
              response.headers.set('X-Read-Only-Mode', 'true');
            }
            return addCorsHeaders(response);
          }
        }
      }
    }
    
    const notFoundResponse = NextResponse.json({ 
      error: 'Endpoint not found',
      path: fullPath,
      method: method 
    }, { status: 404 });
    return addCorsHeaders(notFoundResponse);
    
  } catch (error) {
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(errorResponse);
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

export async function OPTIONS(request: NextRequest) {
  // Handle preflight requests
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}
