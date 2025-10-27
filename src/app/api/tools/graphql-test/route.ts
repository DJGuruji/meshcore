import { NextRequest, NextResponse } from 'next/server';

// Simple GraphQL test endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables } = body;

    // Simple GraphQL resolver for testing
    if (query.includes('users')) {
      return NextResponse.json({
        data: {
          users: [
            { id: '1', name: 'John Doe', email: 'john@example.com' },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
          ]
        }
      });
    } else if (query.includes('user') && variables?.id) {
      return NextResponse.json({
        data: {
          user: { id: variables.id, name: 'John Doe', email: 'john@example.com' }
        }
      });
    } else {
      return NextResponse.json({
        data: {
          message: 'Hello from GraphQL test endpoint!'
        }
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      errors: [{ message: 'Invalid GraphQL request' }] 
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GraphQL test endpoint. Send POST requests with { query, variables }'
  });
}