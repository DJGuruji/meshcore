import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { ApiTesterHistory } from '@/lib/models';

// GET - Retrieve request history with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    await connectDB();

    // Build query
    const query: any = { user: session.user.id };

    if (search) {
      query.url = { $regex: search, $options: 'i' };
    }

    if (method) {
      query.method = method.toUpperCase();
    }

    if (status) {
      const statusCode = parseInt(status);
      if (!isNaN(statusCode)) {
        query.statusCode = statusCode;
      }
    }

    // Get history with pagination
    const history = await ApiTesterHistory
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    const total = await ApiTesterHistory.countDocuments(query);

    return NextResponse.json({
      history,
      total,
      limit,
      skip,
      hasMore: total > skip + limit
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Save request to history
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      requestId, 
      method, 
      url, 
      statusCode, 
      responseTime, 
      responseSize,
      requestData // Full request data including headers, params, body, auth, graphql
    } = body;

    await connectDB();

    const userId = (session.user as any).id || (session.user as any)._id;

    const history = await ApiTesterHistory.create({
      requestId: requestId || null,
      method,
      url,
      statusCode,
      responseTime,
      responseSize,
      user: userId,
      requestData: requestData || null
    });

    return NextResponse.json(history, { status: 201 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Clear history
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await connectDB();

    if (id) {
      // Delete specific history entry
      await ApiTesterHistory.findOneAndDelete({ _id: id, user: session.user.id });
    } else {
      // Clear all history
      await ApiTesterHistory.deleteMany({ user: session.user.id });
    }

    return NextResponse.json({ message: 'History cleared successfully' });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
