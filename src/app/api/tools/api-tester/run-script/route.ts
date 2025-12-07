import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ScriptRunner } from '@/lib/scriptRunner';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, script, request: req, response: res, environment = [] } = body;

    if (!script || !type) {
      return NextResponse.json({ error: 'Script and type are required' }, { status: 400 });
    }

    const runner = new ScriptRunner(environment);

    if (type === 'pre-request') {
      const result = await runner.runPreRequestScript(script, req);
      return NextResponse.json(result);
    } else if (type === 'test') {
      const result = await runner.runTestScript(script, req, res);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'Invalid script type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Script execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
