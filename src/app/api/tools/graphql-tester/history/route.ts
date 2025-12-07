import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { GraphQLTesterHistory } from '@/lib/models';
import cacheService from '@/lib/cacheService';

// GET history for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get cached response first
    const cacheKey = `graphql_history_${session.user.id}_${request.url}`;
    
    try {
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    } catch (cacheError) {
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const history = await GraphQLTesterHistory.find({ 
      user: session.user.id 
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(offset);
    
    const total = await GraphQLTesterHistory.countDocuments({ 
      user: session.user.id 
    });
    
    const result = {
      history,
      total,
      limit,
      offset
    };

    // Cache the response for 2 minutes (shorter since history changes frequently)
    try {
      await cacheService.set(cacheKey, result, { ttl: 120 }); // 2 minutes
    } catch (cacheError) {
    }
    
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST add new history item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, variables, url, headers, auth, response } = body;

    await connectDB();

    // Ensure user.id exists
    const userId = (session.user as any).id || (session.user as any)._id;
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID not found',
        session: session.user 
      }, { status: 400 });
    }

    const historyItem = await GraphQLTesterHistory.create({
      query,
      variables,
      url,
      headers,
      auth,
      response,
      user: userId
    });

    // Invalidate cache for this user's GraphQL history
    try {
      // Delete all GraphQL history cache entries for this user
      const deletedCount = await cacheService.delPattern(`graphql_history_${userId}_*`);
    } catch (cacheError) {
    }

    return NextResponse.json(historyItem, { status: 201 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE history items
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
      // Delete specific history item
      const historyItem = await GraphQLTesterHistory.findOneAndDelete({ 
        _id: id, 
        user: session.user.id 
      });

      if (!historyItem) {
        return NextResponse.json({ error: 'History item not found' }, { status: 404 });
      }
    } else {
      // Delete all history for user
      await GraphQLTesterHistory.deleteMany({ 
        user: session.user.id 
      });
    }

    // Invalidate cache for this user's GraphQL history
    try {
      // Delete all GraphQL history cache entries for this user
      const deletedCount = await cacheService.delPattern(`graphql_history_${session.user.id}_*`);
    } catch (cacheError) {
    }

    return NextResponse.json({ message: 'History cleared successfully' });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}