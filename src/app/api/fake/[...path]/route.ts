import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ApiProject } from '@/lib/models';
import { extractTokenFromHeader } from '@/lib/tokenUtils';

// Helper function to match endpoint path with project name
function matchEndpoint(requestPath: string, projectName: string, baseUrl: string, endpointPath: string): boolean {
  // Expected path format: /{projectName}{baseUrl}{endpointPath}
  const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const expectedPath = `/${cleanProjectName}${baseUrl}${endpointPath}`;
  
  return requestPath === expectedPath;
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
        if (matchEndpoint(fullPath, project.name, project.baseUrl, endpoint.path) && endpoint.method === method) {
          
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
