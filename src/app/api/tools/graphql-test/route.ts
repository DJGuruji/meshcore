import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables } = body;

    if (typeof query !== 'string') {
      return json({ errors: [{ message: 'Invalid GraphQL request' }] }, 400);
    }

    if (query.includes('users')) {
      return json({
        data: {
          users: [
            { id: '1', name: 'John Doe', email: 'john@example.com' },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
          ]
        }
      });
    }

    if (query.includes('user') && variables?.id) {
      return json({
        data: {
          user: { id: variables.id, name: 'John Doe', email: 'john@example.com' }
        }
      });
    }

    return json({
      data: {
        message: 'Hello from GraphQL test endpoint!'
      }
    });
  } catch {
    return json({ 
      errors: [{ message: 'Invalid GraphQL request' }] 
    }, 400);
  }
}

export async function GET() {
  return json({
    message: 'GraphQL test endpoint. Send POST requests with { query, variables }'
  });
}
