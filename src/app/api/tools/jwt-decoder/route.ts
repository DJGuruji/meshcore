import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// JWT Decoder API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token, secret } = body;

    if (!token) {
      return NextResponse.json({ error: 'JWT token is required' }, { status: 400 });
    }

    try {
      // Decode JWT without verification (just parsing)
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return NextResponse.json({ 
          error: 'Invalid JWT format',
          message: 'JWT must have 3 parts separated by dots'
        }, { status: 400 });
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      // Decode header
      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
      
      // Decode payload
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

      // Check expiration if present
      let isExpired = false;
      let expiresAt = null;
      if (payload.exp) {
        expiresAt = new Date(payload.exp * 1000);
        isExpired = Date.now() >= payload.exp * 1000;
      }

      // If secret is provided, attempt verification
      let verified = null;
      if (secret && header.alg !== 'none') {
        try {
          verified = verifySignature(headerB64, payloadB64, signatureB64, secret, header.alg);
        } catch (error) {
          verified = false;
        }
      }

      return NextResponse.json({
        header,
        payload,
        signature: signatureB64,
        isExpired,
        expiresAt,
        verified,
        message: 'JWT decoded successfully'
      });

    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to decode JWT',
        message: error instanceof Error ? error.message : 'Invalid JWT format'
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simple signature verification (supports HS256 only for demo)
function verifySignature(header: string, payload: string, signature: string, secret: string, algorithm: string): boolean {
  if (algorithm !== 'HS256') {
    throw new Error('Only HS256 algorithm is supported for verification');
  }

  const crypto = require('crypto');
  const data = `${header}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  return signature === expectedSignature;
}
