import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { ApiTesterEnvironment } from '@/lib/models';
import cacheService from '@/lib/cacheService';

// GET all environments for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const environmentId = searchParams.get('id');

    // Try to get cached response first
    const cacheKey = environmentId 
      ? `api_tester_env_${environmentId}_${session.user.id}`
      : `user_api_tester_envs_${session.user.id}`;
    
    try {
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for API tester environments: ${cacheKey}`);
        return NextResponse.json(cachedData);
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }

    await connectDB();

    let result;
    if (environmentId) {
      const environment = await ApiTesterEnvironment.findOne({ 
        _id: environmentId, 
        user: session.user.id 
      });
      
      if (!environment) {
        return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
      }
      
      result = environment;
    } else {
      const environments = await ApiTesterEnvironment.find({ 
        user: session.user.id 
      }).sort({ isGlobal: -1, createdAt: -1 });
      
      result = environments;
    }

    // Cache the response for 5 minutes
    try {
      await cacheService.set(cacheKey, result, { ttl: 300 }); // 5 minutes
      console.log(`Cached API tester environments: ${cacheKey}`);
    } catch (cacheError) {
      console.error('Cache storage error:', cacheError);
    }

    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST create new environment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, variables = [], isGlobal = false } = body;

    if (!name) {
      return NextResponse.json({ error: 'Environment name is required' }, { status: 400 });
    }

    await connectDB();

    // Ensure user.id exists
    const userId = (session.user as any).id || (session.user as any)._id;
    
    if (!userId) {
      console.error('User ID not found in session:', session.user);
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const environment = await ApiTesterEnvironment.create({
      name,
      variables: variables || [],
      isGlobal: isGlobal || false,
      user: userId
    });

    // Invalidate cache for this user's environments
    try {
      const cacheKey = `user_api_tester_envs_${userId}`;
      await cacheService.del(cacheKey);
      console.log(`Invalidated cache for user API tester environments: ${cacheKey}`);
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    return NextResponse.json(environment, { status: 201 });

  } catch (error) {
    console.error('Environment creation error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT update environment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Environment ID is required' }, { status: 400 });
    }

    await connectDB();

    const environment = await ApiTesterEnvironment.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!environment) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
    }

    // Invalidate cache for this environment and user's environments
    try {
      const envCacheKey = `api_tester_env_${id}_${session.user.id}`;
      const userEnvsCacheKey = `user_api_tester_envs_${session.user.id}`;
      
      await cacheService.del(envCacheKey);
      await cacheService.del(userEnvsCacheKey);
      
      console.log(`Invalidated cache for API tester environment: ${envCacheKey}`);
      console.log(`Invalidated cache for user API tester environments: ${userEnvsCacheKey}`);
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    return NextResponse.json(environment);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE environment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Environment ID is required' }, { status: 400 });
    }

    await connectDB();

    const environment = await ApiTesterEnvironment.findOneAndDelete({ 
      _id: id, 
      user: session.user.id 
    });

    if (!environment) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
    }

    // Invalidate cache for this environment and user's environments
    try {
      const envCacheKey = `api_tester_env_${id}_${session.user.id}`;
      const userEnvsCacheKey = `user_api_tester_envs_${session.user.id}`;
      
      await cacheService.del(envCacheKey);
      await cacheService.del(userEnvsCacheKey);
      
      console.log(`Invalidated cache for API tester environment: ${envCacheKey}`);
      console.log(`Invalidated cache for user API tester environments: ${userEnvsCacheKey}`);
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    return NextResponse.json({ message: 'Environment deleted successfully' });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
