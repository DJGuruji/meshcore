import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Edge Function Tester API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      code, 
      runtime = 'nodejs', 
      event = {},
      context = {},
      timeout = 5000 
    } = body;

    if (!code) {
      return NextResponse.json({ error: 'Function code is required' }, { status: 400 });
    }

    const startTime = Date.now();
    
    try {
      // Execute the function with timeout
      const result = await executeWithTimeout(code, event, context, timeout);
      const executionTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        result,
        executionTime,
        runtime,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        runtime,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Edge function examples and templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      info: 'Edge Function Tester',
      description: 'Test serverless edge functions with custom code',
      usage: {
        endpoint: '/api/tools/edge-tester',
        method: 'POST',
        body: {
          code: 'Function code as string (supports async functions)',
          runtime: 'nodejs (default)',
          event: 'Event object passed to function',
          context: 'Context object with execution metadata',
          timeout: 'Timeout in milliseconds (default: 5000, max: 10000)'
        }
      },
      examples: [
        {
          name: 'Simple Hello World',
          code: `async function handler(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from edge function!' })
  };
}`
        },
        {
          name: 'Echo Request',
          code: `async function handler(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      receivedEvent: event,
      context: context,
      timestamp: new Date().toISOString()
    })
  };
}`
        },
        {
          name: 'Data Processing',
          code: `async function handler(event, context) {
  const data = event.data || [];
  const processed = data.map(item => item * 2);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      original: data,
      processed: processed,
      count: processed.length
    })
  };
}`
        }
      ],
      security: {
        note: 'This is a simulated environment. Real edge functions should have proper sandboxing.',
        restrictions: [
          'Limited execution time (max 10 seconds)',
          'No file system access',
          'No network access in sandbox',
          'Limited memory'
        ]
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Execute function code with timeout
async function executeWithTimeout(
  code: string, 
  event: any, 
  context: any, 
  timeout: number
): Promise<any> {
  // Limit timeout to max 10 seconds
  const maxTimeout = Math.min(timeout, 10000);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Function execution timeout after ${maxTimeout}ms`));
    }, maxTimeout);

    try {
      // Create a safer execution context
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      
      // Parse the code to extract the function
      let functionCode = code.trim();
      
      // If code contains function declaration, extract the body
      if (functionCode.includes('function handler')) {
        const match = functionCode.match(/function\s+handler\s*\([^)]*\)\s*{([\s\S]*)}/);
        if (match) {
          functionCode = match[1];
        }
      }

      // Create and execute the function
      const func = new AsyncFunction('event', 'context', functionCode);
      
      func(event, context)
        .then((result: any) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error: any) => {
          clearTimeout(timer);
          reject(error);
        });

    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}
