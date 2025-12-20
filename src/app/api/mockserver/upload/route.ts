import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { ApiProject, MockServerData, User } from '@/lib/models';
import { uploadFileToCloudinary } from '@/lib/cloudinary';
import { extractTokenFromHeader } from '@/lib/tokenUtils';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
      case 'plus':
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
    user.markModified('lastRequestAt');
    await user.save();
    
    return { allowed: true };
  } catch (error: any) {
    // Allow the operation if there's an error checking limits
    return { allowed: true };
  }
}

// Helper function to check daily request limits
async function checkDailyRequestLimit(project: any): Promise<{ allowed: boolean; message?: string }> {
  try {
    // Get the user associated with the project
    let user = await User.findById(project.user);
    if (!user) {
      return { allowed: false, message: 'User not found' };
    }
    
    // Initialize lastRequestReset if it doesn't exist
    if (!user.lastRequestReset) {
      user.lastRequestReset = new Date();
      user.markModified('lastRequestReset');
      await user.save();
      // Refresh the user object after saving
      user = await User.findById(project.user);
      if (!user) {
        return { allowed: false, message: 'User not found after save' };
      }
    }
    
    // Check if 24 hours have passed since last reset
    const now = new Date();
    const lastReset = new Date(user.lastRequestReset);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
    
    // If 24 hours have passed, reset the counter
    if (hoursSinceReset >= 24) {
      user.dailyRequests = {}; // Clear all daily request counts
      user.markModified('dailyRequests'); // Mark as modified for Mongoose
      user.lastRequestReset = now;
      user.markModified('lastRequestReset');
      await user.save();
      // Refresh the user object after saving
      user = await User.findById(project.user);
      if (!user) {
        return { allowed: false, message: 'User not found after reset' };
      }
    }
    
    // Calculate request limits based on account type
    let maxRequests = 300; // Default to 300 for free tier
    switch (user.accountType) {
      case 'free':
        maxRequests = 300;
        break;
      case 'plus':
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
    const currentRequests = user.dailyRequests[currentWindowKey] || 0;
    
    // Check if limit is exceeded
    if (currentRequests >= maxRequests) {
      // Calculate when the limit will renew
      const renewalTime = new Date(lastReset.getTime() + (24 * 60 * 60 * 1000));
      
      return { 
        allowed: false, 
        message: `Daily request limit exceeded. You have used all ${maxRequests} requests for your ${user.accountType} account. Limit will renew at ${renewalTime.toLocaleString()}.`
      };
    }
    
    // Update request count
    const newCount = currentRequests + 1;
    user.dailyRequests[currentWindowKey] = newCount;
    
    // CRITICAL: Mark the Map as modified so Mongoose knows to save it
    // Without this, Map changes are not persisted to MongoDB!
    user.markModified('dailyRequests');
    
    await user.save();
    
    return { allowed: true };
  } catch (error: any) {
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
      case 'plus':
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
  } catch (error: any) {
    // Allow the operation if there's an error checking limits
    return { allowed: true };
  }
}

// Helper function to parse multipart form data manually
async function parseMultipartFormData(request: NextRequest): Promise<{ fields: Record<string, string>; files: Record<string, { buffer: Buffer; filename: string; mimetype: string }> }> {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data');
  }

  // Get boundary from Content-Type header
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) {
    throw new Error('Boundary not found in Content-Type header');
  }
  const boundary = '--' + boundaryMatch[1];

  // Convert request to buffer
  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Split buffer by boundary
  const parts = splitBufferByBoundary(buffer, boundary);

  const fields: Record<string, string> = {};
  const files: Record<string, { buffer: Buffer; filename: string; mimetype: string }> = {};

  // Process each part
  for (const part of parts) {
    const { headers, body } = parsePart(part);
    
    const contentDisposition = headers['content-disposition'] || '';
    const contentType = headers['content-type'] || '';
    
    // Extract field name
    const nameMatch = contentDisposition.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    
    // Check if this is a file
    const filenameMatch = contentDisposition.match(/filename="([^"]*)"/);
    
    if (filenameMatch) {
      // This is a file
      const filename = filenameMatch[1];
      files[fieldName] = {
        buffer: body,
        filename,
        mimetype: contentType
      };
    } else {
      // This is a regular field
      fields[fieldName] = body.toString('utf-8').trim();
    }
  }

  return { fields, files };
}

// Helper function to split buffer by boundary
function splitBufferByBoundary(buffer: Buffer, boundary: string): Buffer[] {
  const boundaryBytes = Buffer.from(boundary);
  const parts: Buffer[] = [];
  let startIndex = 0;
  
  while (startIndex < buffer.length) {
    const boundaryIndex = buffer.indexOf(boundaryBytes, startIndex);
    if (boundaryIndex === -1) break;
    
    if (startIndex > 0) {
      // Extract part between previous boundary and current boundary
      const part = buffer.subarray(startIndex, boundaryIndex);
      // Remove trailing \r\n if present
      const trimmedPart = part.subarray(0, part.lastIndexOf('\r\n'));
      parts.push(trimmedPart);
    }
    
    startIndex = boundaryIndex + boundaryBytes.length;
  }
  
  return parts;
}

// Helper function to parse a part into headers and body
function parsePart(part: Buffer): { headers: Record<string, string>; body: Buffer } {
  // Find the header-body separator (\r\n\r\n)
  const separatorIndex = part.indexOf('\r\n\r\n');
  if (separatorIndex === -1) {
    return { headers: {}, body: part };
  }
  
  const headersBuffer = part.subarray(0, separatorIndex);
  const bodyBuffer = part.subarray(separatorIndex + 4); // Skip \r\n\r\n
  
  // Parse headers
  const headers: Record<string, string> = {};
  const headersStr = headersBuffer.toString('utf-8');
  const headerLines = headersStr.split('\r\n');
  
  for (const line of headerLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }
  
  return { headers, body: bodyBuffer };
}

// Handle POST requests with file uploads
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Extract path from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/api/mockserver/upload/');
    
    if (pathSegments.length < 2) {
      return Response.json({ error: 'Invalid API path' }, { status: 404 });
    }
    
    const fullPath = '/' + pathSegments[1];
    
    // Extract project slug from the path
    const pathParts = fullPath.substring(1).split('/');
    if (pathParts.length < 1) {
      return Response.json({ error: 'Invalid API path - missing project identifier' }, { status: 404 });
    }
    
    const projectSlug = pathParts[0];
    const remainingPath = '/' + pathParts.slice(1).join('/');
    
    // Find all projects and check their endpoints
    const projects = await ApiProject.find({});
    
    for (const project of projects) {
      // Generate the project slug and compare
      const generatedSlug = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      if (generatedSlug === projectSlug) {
        for (const endpoint of project.endpoints) {
          // Match endpoint path with project name
          const cleanBaseUrl = project.baseUrl.startsWith('/') ? project.baseUrl : `/${project.baseUrl}`;
          const cleanEndpointPath = endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`;
          const expectedCombinedPath = `${cleanBaseUrl}${cleanEndpointPath}`;
          
          if (remainingPath === expectedCombinedPath && endpoint.method === 'POST') {
            // Check daily request limit
            const requestLimitCheck = await checkDailyRequestLimit(project);
            if (!requestLimitCheck.allowed) {
              return Response.json({ 
                error: 'Daily request limit exceeded',
                message: requestLimitCheck.message
              }, { status: 429 });
            }
            
            // Check rate limit
            const rateLimitCheck = await checkRateLimit(project);
            if (!rateLimitCheck.allowed) {
              return Response.json({ 
                error: 'Rate limit exceeded',
                message: rateLimitCheck.message
              }, { status: 429 });
            }
                    
            // Check authentication requirements
            const projectAuthEnabled = project.authentication?.enabled || false;
            const endpointRequiresAuth = endpoint.requiresAuth !== null ? endpoint.requiresAuth : projectAuthEnabled;
            
            if (endpointRequiresAuth) {
              const authHeader = request.headers.get(project.authentication?.headerName || 'Authorization');
              const providedToken = extractTokenFromHeader(authHeader || '', project.authentication?.tokenPrefix || 'Bearer');
              
              if (!providedToken || providedToken !== project.authentication?.token) {
                return Response.json({ 
                  error: 'Unauthorized',
                  message: 'Valid authentication token required',
                  requiredHeader: project.authentication?.headerName || 'Authorization',
                  tokenFormat: `${project.authentication?.tokenPrefix || 'Bearer'} <token>`
                }, { status: 401 });
              }
            }
            
            // For file uploads, we need to handle multipart form data
            const contentType = request.headers.get('content-type') || '';
            
            if (contentType.includes('multipart/form-data')) {
              try {
                // Parse multipart form data
                const { fields, files } = await parseMultipartFormData(request);
                
                // Process file uploads
                const uploadedFiles = [];
                const fileFields = endpoint.fields?.filter((field: any) => 
                  field.type === 'image' || field.type === 'video' || field.type === 'audio' || field.type === 'file'
                ) || [];
                
                // Validate required file fields
                const errors: string[] = [];
                const requiredFileFields = fileFields.filter((field: any) => field.required);
                
                for (const field of requiredFileFields) {
                  if (!files[field.name]) {
                    errors.push(`Required file field '${field.name}' is missing`);
                  }
                }
                
                // Upload files to Cloudinary
                for (const [fieldName, fileData] of Object.entries(files)) {
                  const fieldDef = endpoint.fields?.find((f: any) => f.name === fieldName);
                  if (!fieldDef) {
                    errors.push(`Unexpected file field '${fieldName}' provided`);
                    continue;
                  }
                  
                  // Skip non-file fields
                  if (!['image', 'video', 'audio', 'file'].includes(fieldDef.type)) {
                    continue;
                  }
                  
                  try {
                    const uploadedFile = await uploadFileToCloudinary(
                      fileData.buffer,
                      fileData.filename,
                      fileData.mimetype,
                      fieldName
                    );
                    uploadedFiles.push(uploadedFile);
                  } catch (uploadError: any) {
                    errors.push(`Failed to upload file '${fieldName}': ${uploadError.message}`);
                  }
                }
                
                if (errors.length > 0) {
                  return Response.json({ 
                    error: 'File upload validation failed',
                    message: 'One or more file uploads failed validation',
                    details: errors
                  }, { status: 400 });
                }
                
                // Prepare request data with file information
                const requestBody: any = { ...fields };
                
                // Add file information to the request body
                for (const file of uploadedFiles) {
                  requestBody[file.fieldName] = {
                    type: file.fileType,
                    fileName: file.fileName,
                    originalName: file.originalName,
                    url: file.url,
                    secureUrl: file.secureUrl,
                    publicId: file.publicId,
                    format: file.format,
                    resourceType: file.resourceType,
                    fileSize: file.fileSize,
                    uploadedAt: new Date()
                  };
                }
                
                // Validate other required fields if defined
                if (endpoint.fields && endpoint.fields.length > 0) {
                  const requiredFields = endpoint.fields.filter((field: any) => 
                    field.required && !['image', 'video', 'audio', 'file'].includes(field.type)
                  );
                  
                  // Check if all required non-file fields are present
                  for (const field of requiredFields) {
                    if (!(field.name in requestBody)) {
                      errors.push(`Required field '${field.name}' is missing`);
                    } else if (requestBody[field.name] === null || requestBody[field.name] === undefined || requestBody[field.name] === '') {
                      errors.push(`Required field '${field.name}' cannot be null or empty`);
                    }
                  }
                }
                
                if (errors.length > 0) {
                  return Response.json({ 
                    error: 'Validation failed',
                    message: 'Required fields are missing or invalid',
                    details: errors
                  }, { status: 400 });
                }
                
                // Calculate total storage size (data + files)
                const dataString = JSON.stringify(requestBody);
                const dataSize = Buffer.byteLength(dataString, 'utf8');
                const filesSize = uploadedFiles.reduce((total, file) => total + file.fileSize, 0);
                const totalSize = dataSize + filesSize;
                
                // Check storage limit before storing data (write operation)
                const storageCheck = await checkStorageLimit(project, totalSize, true);
                if (!storageCheck.allowed) {
                  return Response.json({ 
                    error: 'Storage limit exceeded',
                    message: storageCheck.message,
                    readOnlyMode: true
                  }, { status: 400 });
                }
                
                // Store the data in the database including file metadata
                try {
                  const mockData = new MockServerData({
                    endpointId: endpoint._id,
                    projectId: project._id,
                    data: requestBody,
                    files: uploadedFiles
                  });
                  await mockData.save();
                  
                  // Update user's storage usage
                  try {
                    const user = await User.findById(project.user);
                    if (user) {
                      const currentUsage = user.storageUsage || 0;
                      await User.findByIdAndUpdate(project.user, { 
                        storageUsage: currentUsage + totalSize 
                      });
                    }
                  } catch (storageError) {
                    console.error('Failed to update storage usage:', storageError);
                  }
                  
                  // Return success response with the stored data
                  return Response.json({ 
                    message: 'Data and files stored successfully',
                    data: requestBody,
                    files: uploadedFiles,
                    id: mockData._id
                  }, { status: 201 });
                } catch (saveError: any) {
                  // Return error response
                  return Response.json({ 
                    error: 'Failed to store data',
                    message: 'Data validation passed but storage failed'
                  }, { status: 500 });
                }
              } catch (parseError: any) {
                return Response.json({ 
                  error: 'Failed to parse form data',
                  message: parseError.message
                }, { status: 400 });
              }
            } else {
              // Handle regular JSON POST requests
              try {
                const requestBody = await request.json();
                
                // Validate required fields if defined
                if (endpoint.fields && endpoint.fields.length > 0) {
                  const errors: string[] = [];
                  const requiredFields = endpoint.fields.filter((field: any) => field.required);
                  
                  // Check if all required fields are present
                  for (const field of requiredFields) {
                    if (!(field.name in requestBody)) {
                      errors.push(`Required field '${field.name}' is missing`);
                    } else if (requestBody[field.name] === null || requestBody[field.name] === undefined || requestBody[field.name] === '') {
                      errors.push(`Required field '${field.name}' cannot be null or empty`);
                    }
                  }
                  
                  if (errors.length > 0) {
                    return Response.json({ 
                      error: 'Validation failed',
                      message: 'Required fields are missing or invalid',
                      details: errors
                    }, { status: 400 });
                  }
                }
                
                // Check storage limit before storing data (write operation)
                const dataSize = Buffer.byteLength(JSON.stringify(requestBody), 'utf8');
                const storageCheck = await checkStorageLimit(project, dataSize, true);
                if (!storageCheck.allowed) {
                  return Response.json({ 
                    error: 'Storage limit exceeded',
                    message: storageCheck.message,
                    readOnlyMode: true
                  }, { status: 400 });
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
                    console.error('Failed to update storage usage:', storageError);
                  }
                  
                  // Return success response with the stored data
                  return Response.json({ 
                    message: 'Data stored successfully',
                    data: requestBody,
                    id: mockData._id
                  }, { status: 201 });
                } catch (saveError: any) {
                  // Return error response
                  return Response.json({ 
                    error: 'Failed to store data',
                    message: 'Data validation passed but storage failed'
                  }, { status: 500 });
                }
              } catch (error: any) {
                // Return error response for invalid JSON
                return Response.json({ 
                  error: 'Invalid JSON',
                  message: 'Request body must be valid JSON'
                }, { status: 400 });
              }
            }
          }
        }
      }
    }
    
    return Response.json({ 
      error: 'Endpoint not found',
      path: fullPath,
      method: 'POST'
    }, { status: 404 });
    
  } catch (error: any) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Disable body parsing for this route as we're handling it manually
export const config = {
  api: {
    bodyParser: false,
  },
};