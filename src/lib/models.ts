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
  // Role field with default value
  role: {
    type: String,
    enum: ['user', 'staff', 'admin', 'super-admin'],
    default: 'user',
    required: true
  },
  // Account type field with default value
  accountType: {
    type: String,
    enum: ['free', 'freemium', 'pro', 'ultra-pro','custom'],
    default: 'free',
    required: true
  },
  // Block state field
  blocked: {
    type: Boolean,
    default: false,
    required: true
  },
  // Storage usage in bytes
  storageUsage: {
    type: Number,
    default: 0,
    required: true
  },
  // Daily request count with timestamp
  dailyRequests: {
    type: Map,
    of: Number,
    default: () => ({}),
    required: true
  },
  // Rate limiting - timestamp of last request
  lastRequestAt: {
    type: Date,
    default: null
  },
  // Last request reset time for rolling 24-hour window
  lastRequestReset: {
    type: Date,
    default: null
  },
  // Timestamp of last request limit exceeded email sent
  lastRequestLimitEmailSent: {
    type: Date,
    default: null
  },
  // Timestamp of last storage limit exceeded email sent
  lastStorageLimitEmailSent: {
    type: Date,
    default: null
  },
  resetToken: {
    type: String,
    select: false, // Don't include in query results by default
  },
  resetTokenExpiry: {
    type: Date,
    select: false, // Don't include in query results by default
  },
  // Email verification fields
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationTokenExpiry: {
    type: Date,
    select: false
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

// Method to calculate approximate size of stored data in bytes
UserSchema.methods.calculateDataSize = function(data: any): number {
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
};

// Method to update user's storage usage
UserSchema.methods.updateStorageUsage = async function(projectId: string, dataSize: number, operation: 'add' | 'subtract' = 'add') {
  try {
    const project = await ApiProject.findById(projectId);
  if (!project) return;
  
  const user = await User.findById(project.user);
  if (!user) return;
  
  const currentUsage = user.storageUsage || 0;
  const newUsage = operation === 'add' 
    ? currentUsage + dataSize 
    : Math.max(0, currentUsage - dataSize);
  
  await User.findByIdAndUpdate(user._id, { storageUsage: newUsage });
  } catch (error) {
    console.error('Error updating storage usage:', error);
  }
};

// Method to clean up old daily request data
UserSchema.methods.cleanupOldRequestData = function() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Remove entries older than 30 days
    for (const [dateKey, count] of this.dailyRequests.entries()) {
      if (dateKey < thirtyDaysAgoString) {
        this.dailyRequests.delete(dateKey);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old request data:', error);
  }
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
    // Field definitions for POST endpoints
    fields: [{
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'object', 'array'],
        required: true
      },
      required: {
        type: Boolean,
        default: false
      },
      description: String
    }],
    // Data source for GET endpoints
    dataSource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiProject.endpoints',
      default: null
    },
    // Conditions for filtering data
    conditions: [{
      field: {
        type: String,
        required: true
      },
      operator: {
        type: String,
        enum: ['=', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith'],
        required: true
      },
      value: mongoose.Schema.Types.Mixed
    }],
    // Pagination settings for GET endpoints
    pagination: {
      enabled: {
        type: Boolean,
        default: false
      },
      defaultLimit: {
        type: Number,
        default: 10
      },
      maxLimit: {
        type: Number,
        default: 100
      }
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
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null }, // Expiration date for auto-deletion
  lastWeekReminderSent: { type: Boolean, default: false }, // Track if 1-week reminder was sent
  lastDayReminderSent: { type: Boolean, default: false } // Track if 1-day reminder was sent
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

// Mock Server Data Schema - to store data from POST requests
const MockServerDataSchema = new mongoose.Schema({
  endpointId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ApiProject.endpoints'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ApiProject'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const MockServerData = mongoose.models.MockServerData || mongoose.model('MockServerData', MockServerDataSchema);

// GraphQL Tester Collection Schema
const GraphQLTesterCollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Collection name is required'],
  },
  description: String,
  requests: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    query: { type: String, required: true },
    variables: String,
    url: { type: String, required: true },
    headers: [{
      key: String,
      value: String,
      enabled: { type: Boolean, default: true }
    }],
    auth: {
      type: { type: String, enum: ['none', 'basic', 'bearer'], default: 'none' },
      bearerToken: String,
      basicAuth: {
        username: String,
        password: String
      }
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

// GraphQL Tester Environment Schema
const GraphQLTesterEnvironmentSchema = new mongoose.Schema({
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

// GraphQL Tester Request History Schema
const GraphQLTesterHistorySchema = new mongoose.Schema({
  query: String,
  variables: String,
  url: String,
  headers: [{
    key: String,
    value: String,
    enabled: Boolean
  }],
  auth: {
    type: { type: String, enum: ['none', 'basic', 'bearer'], default: 'none' },
    bearerToken: String,
    basicAuth: {
      username: String,
      password: String
    }
  },
  response: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

export const GraphQLTesterCollection = mongoose.models.GraphQLTesterCollection || mongoose.model('GraphQLTesterCollection', GraphQLTesterCollectionSchema);
export const GraphQLTesterEnvironment = mongoose.models.GraphQLTesterEnvironment || mongoose.model('GraphQLTesterEnvironment', GraphQLTesterEnvironmentSchema);
export const GraphQLTesterHistory = mongoose.models.GraphQLTesterHistory || mongoose.model('GraphQLTesterHistory', GraphQLTesterHistorySchema);
