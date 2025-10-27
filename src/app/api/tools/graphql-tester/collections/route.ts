import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { GraphQLTesterCollection } from '@/lib/models';

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
      const collection = await GraphQLTesterCollection.findOne({ 
        _id: collectionId, 
        user: session.user.id 
      });
      
      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }
      
      return NextResponse.json(collection);
    }

    const collections = await GraphQLTesterCollection.find({ 
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
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, requests = [] } = body;

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
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

    const collection = await GraphQLTesterCollection.create({
      name,
      description: description || '',
      requests: requests || [],
      user: userId
    });

    return NextResponse.json(collection, { status: 201 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
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

    const collection = await GraphQLTesterCollection.findOneAndUpdate(
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

    const collection = await GraphQLTesterCollection.findOneAndDelete({ 
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