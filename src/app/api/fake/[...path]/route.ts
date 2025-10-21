import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ApiProject, MockServerData } from '@/lib/models';
import { extractTokenFromHeader } from '@/lib/tokenUtils';

// Helper function to match endpoint path with project name
function matchEndpoint(requestPath: string, projectName: string, baseUrl: string, endpointPath: string, method: string): boolean {
  // Expected path format: /{projectName}{baseUrl}{endpointPath}
  const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const expectedPath = `/${cleanProjectName}${baseUrl}${endpointPath}`;

   // For PUT, PATCH, DELETE methods, the path might include an ID parameter at the end


  if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {


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
    console.error('Error evaluating condition:', error);
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
      switch (field.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Field '${field.name}' should be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Field '${field.name}' should be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Field '${field.name}' should be a boolean`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            errors.push(`Field '${field.name}' should be an object`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Field '${field.name}' should be an array`);
          }
          break;
      }
    }
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
              
              // Store the data in the database
              try {
                const mockData = new MockServerData({
                  endpointId: endpoint._id,
                  projectId: project._id,
                  data: requestBody
                });
                await mockData.save();
                console.log('Stored POST data:', requestBody);
                
                // Return success response with the stored data
                const successResponse = NextResponse.json({ 
                  message: 'Data stored successfully',
                  data: requestBody,
                  id: mockData._id
                }, { status: 201 });
                return addCorsHeaders(successResponse);
              } catch (saveError) {
                console.error('Error storing POST data:', saveError);
                // Return error response
                const errorResponse = NextResponse.json({ 
                  error: 'Failed to store data',
                  message: 'Data validation passed but storage failed'
                }, { status: 500 });
                return addCorsHeaders(errorResponse);
              }
            } catch (error) {
              console.error('Error parsing request body:', error);
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
                    // Delete the filtered data
                    if (isValidId) {
                      await MockServerData.deleteOne({ _id: id });
                    }
                    
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
                    }
                    
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
              console.error('Error processing data source:', error);
              // Fall back to original response handling
            }
          }
          
          // Handle GET endpoints with data source
          if (method === 'GET' && endpoint.dataSource) {
            // Find the source endpoint
            const sourceEndpoint = project.endpoints.find((ep: typeof endpoint) => 
              ep._id && endpoint.dataSource && 
              ep._id.toString() === endpoint.dataSource.toString());
            if (sourceEndpoint) {
              try {
                // Get data from the database instead of using the response body
                const storedData = await MockServerData.find({ 
                  endpointId: sourceEndpoint._id,
                  projectId: project._id
                }).sort({ createdAt: -1 });
                
                let sourceData;
                if (storedData.length > 0) {
                  // Use the stored data
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
                } else {
                  // Fall back to the original response body if no data is stored
                  sourceData = JSON.parse(sourceEndpoint.responseBody);
                }
                
                // Apply conditions if any
                const filteredData = filterDataByConditions(sourceData, endpoint.conditions || []);
                
                const response = NextResponse.json(filteredData, { status: endpoint.statusCode });
                return addCorsHeaders(response);
              } catch (error) {
                console.error('Error processing data source:', error);
                // Fall back to original response body
              }
            }
          }
          
          try {
            const responseBody = JSON.parse(endpoint.responseBody);
            const response = NextResponse.json(responseBody, { status: endpoint.statusCode });
            return addCorsHeaders(response);
          } catch (error) {
            // If JSON parsing fails, return as plain text
            const response = new NextResponse(endpoint.responseBody, { 
              status: endpoint.statusCode,
              headers: { 'Content-Type': 'text/plain' }
            });
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
    console.error('Fake API error:', error);
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
