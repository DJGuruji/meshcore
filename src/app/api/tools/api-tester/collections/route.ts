import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { ApiTesterCollection } from '@/lib/models';

// GET all collections for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('id');

    await connectDB();

    if (collectionId) {
      const collection = await ApiTesterCollection.findOne({ 
        _id: collectionId, 
        user: session.user.id 
      });
      
      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }
      
      return NextResponse.json(collection);
    }

    const collections = await ApiTesterCollection.find({ 
      user: session.user.id 
    }).sort({ createdAt: -1 });
    
    return NextResponse.json(collections);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST create new collection
export async function POST(request: NextRequest) {
  try {
    console.log('=== Collection POST Request Started ===');
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session || !session.user) {
      console.error('Unauthorized: No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    const { name, description, requests = [], folders = [] } = body;

    if (!name) {
      console.error('Collection name is required');
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected');

    // Ensure user.id exists
    const userId = (session.user as any).id || (session.user as any)._id;
    console.log('User ID:', userId);
    console.log('Session user object:', JSON.stringify(session.user, null, 2));
    
    if (!userId) {
      console.error('User ID not found in session:', session.user);
      return NextResponse.json({ 
        error: 'User ID not found',
        session: session.user 
      }, { status: 400 });
    }

    console.log('Creating collection with data:', { name, description, userId });
    const collection = await ApiTesterCollection.create({
      name,
      description: description || '',
      requests: requests || [],
      folders: folders || [],
      user: userId
    });

    console.log('Collection created successfully:', collection._id);
    return NextResponse.json(collection, { status: 201 });

  } catch (error) {
    console.error('=== Collection creation error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('Full error:', error);
    
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name || 'Unknown',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT update collection
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    await connectDB();

    const collection = await ApiTesterCollection.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE collection
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    await connectDB();

    const collection = await ApiTesterCollection.findOneAndDelete({ 
      _id: id, 
      user: session.user.id 
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Collection deleted successfully' });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
