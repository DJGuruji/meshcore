import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import { User } from '@/lib/models';
import cacheService from '@/lib/cacheService';

// API Documentation Schema
const ApiDocSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  version: { type: String, default: '1.0.0' },
  baseUrl: String,
  endpoints: [{
    path: String,
    method: String,
    description: String,
    parameters: [{
      name: String,
      type: String,
      required: Boolean,
      description: String
    }],
    requestBody: {
      type: String,
      example: String
    },
    responses: [{
      status: Number,
      description: String,
      example: String
    }]
  }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ApiDoc = mongoose.models.ApiDoc || mongoose.model('ApiDoc', ApiDocSchema);

// GET all API documentations for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');

    // Try to get cached response first
    const cacheKey = docId 
      ? `api_doc_${docId}_${session.user.id}`
      : `user_api_docs_${session.user.id}`;
    
    try {
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    } catch (cacheError) {
    }

    await connectDB();
    
    // Check if user is blocked
    const user = await User.findById(session.user.id);
    if (user && user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }

    let result;
    if (docId) {
      // Get specific documentation
      const doc = await ApiDoc.findOne({ _id: docId, user: session.user.id });
      if (!doc) {
        return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
      }
      result = doc;
    } else {
      // Get all documentations for user
      const docs = await ApiDoc.find({ user: session.user.id }).sort({ createdAt: -1 });
      result = docs;
    }

    // Cache the response for 5 minutes
    try {
      await cacheService.set(cacheKey, result, { ttl: 300 }); // 5 minutes
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

// POST - Create new API documentation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, version, baseUrl, endpoints } = body;

    if (!name) {
      return NextResponse.json({ error: 'API name is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if user is blocked
    const user = await User.findById(session.user.id);
    if (user && user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }

    const doc = await ApiDoc.create({
      name,
      description,
      version: version || '1.0.0',
      baseUrl,
      endpoints: endpoints || [],
      user: session.user.id
    });

    // Invalidate cache for this user's API docs
    try {
      const cacheKey = `user_api_docs_${session.user.id}`;
      await cacheService.del(cacheKey);
    } catch (cacheError) {
    }

    return NextResponse.json(doc, { status: 201 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update API documentation
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Documentation ID is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if user is blocked
    const user = await User.findById(session.user.id);
    if (user && user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }

    const doc = await ApiDoc.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    // Invalidate cache for this doc and user's API docs
    try {
      const docCacheKey = `api_doc_${id}_${session.user.id}`;
      const userDocsCacheKey = `user_api_docs_${session.user.id}`;
      
      await cacheService.del(docCacheKey);
      await cacheService.del(userDocsCacheKey);
      
    } catch (cacheError) {
    }

    return NextResponse.json(doc);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete API documentation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Documentation ID is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if user is blocked
    const user = await User.findById(session.user.id);
    if (user && user.blocked) {
      return NextResponse.json({ error: 'Your account has been blocked. Please contact support.' }, { status: 403 });
    }

    const doc = await ApiDoc.findOneAndDelete({ _id: id, user: session.user.id });

    if (!doc) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    // Invalidate cache for this doc and user's API docs
    try {
      const docCacheKey = `api_doc_${id}_${session.user.id}`;
      const userDocsCacheKey = `user_api_docs_${session.user.id}`;
      
      await cacheService.del(docCacheKey);
      await cacheService.del(userDocsCacheKey);
      
    } catch (cacheError) {
    }

    return NextResponse.json({ message: 'Documentation deleted successfully' });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
