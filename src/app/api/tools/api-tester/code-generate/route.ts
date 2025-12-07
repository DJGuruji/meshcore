import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CodeGenerator } from '@/lib/codeGenerator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { language, request: req } = body;

    if (!language || !req) {
      return NextResponse.json({ error: 'Language and request are required' }, { status: 400 });
    }

    const generator = new CodeGenerator();
    let code = '';

    switch (language) {
      case 'curl':
        code = generator.generateCurl(req);
        break;
      case 'javascript':
        code = generator.generateJavaScript(req);
        break;
      case 'python':
        code = generator.generatePython(req);
        break;
      case 'nodejs':
        code = generator.generateNodeJS(req);
        break;
      default:
        return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    return NextResponse.json({ code });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Code generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}