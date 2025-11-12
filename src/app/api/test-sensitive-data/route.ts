import { NextResponse } from 'next/server';

export async function GET() {
  // Simulate sensitive data response
  const sensitiveData = {
    id: '12345',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'supersecretpassword123',
    apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
    creditCard: '4111-1111-1111-1111',
    ssn: '123-45-6789',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    userData: {
      username: 'johndoe',
      password: 'anothersecretpassword',
      token: 'Bearer abcdefghijklmnopqrstuvwxyz',
      credentials: {
        apiKey: 'secret-api-key-7890',
        secret: 'top-secret-value'
      }
    }
  };

  return NextResponse.json(sensitiveData);
}

export async function POST(request: Request) {
  // Simulate receiving sensitive data
  const requestData = await request.json();
  
  // Return the same data with a success message
  return NextResponse.json({
    message: 'Data received successfully',
    receivedData: requestData,
    timestamp: new Date().toISOString()
  });
}