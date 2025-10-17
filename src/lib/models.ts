import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// User Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password should be at least 6 characters'],
    select: false, // Don't include password in query results by default
  },
  resetToken: {
    type: String,
    select: false, // Don't include in query results by default
  },
  resetTokenExpiry: {
    type: Date,
    select: false, // Don't include in query results by default
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// API Project Schema
const ApiProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    default: 'My API Project'
  },
  baseUrl: {
    type: String,
    required: [true, 'Base URL is required'],
    default: '/api/v1'
  },
  // Authentication settings
  authentication: {
    enabled: {
      type: Boolean,
      default: false
    },
    token: {
      type: String,
      default: null
    },
    headerName: {
      type: String,
      default: 'Authorization'
    },
    tokenPrefix: {
      type: String,
      default: 'Bearer'
    }
  },
  endpoints: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    path: {
      type: String,
      required: [true, 'Endpoint path is required']
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      required: [true, 'HTTP method is required'],
      default: 'GET'
    },
    responseBody: {
      type: String, // JSON string
      default: '{"message": "Hello World"}'
    },
    statusCode: {
      type: Number,
      default: 200
    },
    description: String,
    // Per-endpoint authentication override
    requiresAuth: {
      type: Boolean,
      default: null // null means inherit from project settings
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const ApiProject = mongoose.models.ApiProject || mongoose.model('ApiProject', ApiProjectSchema);

// API Tester Collection Schema
const ApiTesterCollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Collection name is required'],
  },
  description: String,
  requests: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      default: 'GET'
    },
    url: { type: String, required: true },
    headers: [{
      key: String,
      value: String,
      enabled: { type: Boolean, default: true }
    }],
    params: [{
      key: String,
      value: String,
      enabled: { type: Boolean, default: true }
    }],
    body: {
      type: { type: String, enum: ['none', 'raw', 'json', 'form-data', 'x-www-form-urlencoded'], default: 'none' },
      raw: String,
      json: String,
      formData: [{
        key: String,
        value: String,
        type: { type: String, enum: ['text', 'file'], default: 'text' },
        enabled: { type: Boolean, default: true }
      }]
    },
    auth: {
      type: { type: String, enum: ['none', 'basic', 'bearer', 'api-key', 'oauth2'], default: 'none' },
      basic: {
        username: String,
        password: String
      },
      bearer: {
        token: String
      },
      apiKey: {
        key: String,
        value: String,
        addTo: { type: String, enum: ['header', 'query'], default: 'header' }
      }
    },
    preRequestScript: String,
    testScript: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  folders: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: String,
    description: String,
    requestIds: [mongoose.Schema.Types.ObjectId]
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// API Tester Environment Schema
const ApiTesterEnvironmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Environment name is required'],
  },
  variables: [{
    key: String,
    value: String,
    enabled: { type: Boolean, default: true },
    description: String
  }],
  isGlobal: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// API Tester Request History Schema
const ApiTesterHistorySchema = new mongoose.Schema({
  requestId: mongoose.Schema.Types.ObjectId,
  method: String,
  url: String,
  statusCode: Number,
  responseTime: Number,
  responseSize: Number,
  timestamp: { type: Date, default: Date.now },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestData: {
    headers: [{
      key: String,
      value: String,
      enabled: Boolean
    }],
    params: [{
      key: String,
      value: String,
      enabled: Boolean
    }],
    body: mongoose.Schema.Types.Mixed,
    auth: mongoose.Schema.Types.Mixed
  }
});

export const ApiTesterCollection = mongoose.models.ApiTesterCollection || mongoose.model('ApiTesterCollection', ApiTesterCollectionSchema);
export const ApiTesterEnvironment = mongoose.models.ApiTesterEnvironment || mongoose.model('ApiTesterEnvironment', ApiTesterEnvironmentSchema);
export const ApiTesterHistory = mongoose.models.ApiTesterHistory || mongoose.model('ApiTesterHistory', ApiTesterHistorySchema);
