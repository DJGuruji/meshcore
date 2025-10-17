import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { ApiTesterCollection } from '@/lib/models';
import { CodeGenerator } from '@/lib/codeGenerator';

// POST - Export collection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, format = 'json' } = body;

    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    await connectDB();
    const collection = await ApiTesterCollection.findOne({
      _id: collectionId,
      user: session.user.id
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const generator = new CodeGenerator();
    let exportData: string;

    if (format === 'postman') {
      exportData = generator.exportToPostman(collection.toObject());
    } else {
      exportData = JSON.stringify(collection.toObject(), null, 2);
    }

    return NextResponse.json({
      data: exportData,
      filename: `${collection.name.replace(/\s+/g, '_')}_${format}.json`,
      format
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Import collection
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, format = 'json' } = body;

    if (!data) {
      return NextResponse.json({ error: 'Import data is required' }, { status: 400 });
    }

    await connectDB();
    const generator = new CodeGenerator();
    let collectionData: any;

    try {
      if (format === 'postman') {
        collectionData = generator.importFromPostman(data);
      } else {
        collectionData = JSON.parse(data);
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid import format',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }

    // Create new collection from imported data
    const collection = await ApiTesterCollection.create({
      name: collectionData.name,
      description: collectionData.description || '',
      requests: collectionData.requests || [],
      folders: collectionData.folders || [],
      user: session.user.id
    });

    return NextResponse.json(collection, { status: 201 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
