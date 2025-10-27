import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { GraphQLTesterEnvironment } from '@/lib/models';

// GET all environments for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const environmentId = searchParams.get('id');

    await connectDB();

    if (environmentId) {
      const environment = await GraphQLTesterEnvironment.findOne({ 
        _id: environmentId, 
        user: session.user.id 
      });
      
      if (!environment) {
        return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
      }
      
      return NextResponse.json(environment);
    }

    const environments = await GraphQLTesterEnvironment.find({ 
      user: session.user.id 
    }).sort({ createdAt: -1 });
    
    return NextResponse.json(environments);

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
      return NextResponse.json({ 
        error: 'User ID not found',
        session: session.user 
      }, { status: 400 });
    }

    const environment = await GraphQLTesterEnvironment.create({
      name,
      variables: variables || [],
      isGlobal: isGlobal || false,
      user: userId
    });

    return NextResponse.json(environment, { status: 201 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
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

    const environment = await GraphQLTesterEnvironment.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!environment) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
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

    const environment = await GraphQLTesterEnvironment.findOneAndDelete({ 
      _id: id, 
      user: session.user.id 
    });

    if (!environment) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Environment deleted successfully' });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}