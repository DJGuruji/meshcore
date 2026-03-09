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
    enum: ['free', 'plus', 'pro', 'ultra-pro','custom'],
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
    type: {},
    default: {},
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
    index: true,
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
    select: false,
    index: true
  },
  emailVerificationTokenExpiry: {
    type: Date,
    select: false
  },
}, { 
  timestamps: true 
});

// Indexes for performance (email already unique)
UserSchema.index({ role: 1 });
UserSchema.index({ accountType: 1 });
UserSchema.index({ blocked: 1 });

// Hash password and tokens before saving
UserSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(12); // Increased to 12 for better security
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
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
  }
};

// Method to clean up old daily request data
UserSchema.methods.cleanupOldRequestData = function() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Remove entries older than 30 days
    let hasChanges = false;
    const keys = Object.keys(this.dailyRequests);
    for (const dateKey of keys) {
      // Parse the date key and compare with thirty days ago
      const dateKeyDate = new Date(dateKey);
      if (dateKeyDate < thirtyDaysAgo) {
        delete this.dailyRequests[dateKey];
        hasChanges = true;
      }
    }
    
    // If we made changes, mark the object as modified
    if (hasChanges) {
      this.markModified('dailyRequests');
    }
    
    return hasChanges;
  } catch (error) {
    return false;
  }
};

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

interface EndpointField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
  required: boolean;
  description?: string;
  // For nested object validation
  nestedFields?: EndpointField[];
  // For array validation
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'image' | 'video' | 'audio' | 'file';
}

// API Project Schema
const ApiProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    default: 'My API Project',
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  baseUrl: {
    type: String,
    required: [true, 'Base URL is required'],
    default: '/api/v1',
    maxlength: [200, 'Base URL cannot exceed 200 characters']
  },
  // Authentication settings
  authentication: {
    enabled: { type: Boolean, default: false },
    token: { type: String, default: null },
    headerName: { type: String, default: 'Authorization' },
    tokenPrefix: { type: String, default: 'Bearer' }
  },
  // Email configuration settings
  emailConfig: {
    enabled: { type: Boolean, default: false },
    email: { type: String, default: '' },
    appPassword: { type: String, default: '' }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: { type: Date, default: null, index: true }, 
  lastWeekReminderSent: { type: Boolean, default: false }, 
  lastDayReminderSent: { type: Boolean, default: false } 
}, { 
  timestamps: true 
});

ApiProjectSchema.index({ user: 1, createdAt: -1 });

// Endpoint Field Definition (extracted for clarity)
const EndpointFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array', 'image', 'video', 'audio', 'file'],
    required: true
  },
  required: { type: Boolean, default: false },
  description: String,
  nestedFields: { type: [mongoose.Schema.Types.Mixed], default: [] },
  arrayItemType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array', 'image', 'video', 'audio', 'file']
  }
});

// Standalone Endpoint Model (Enterprise Scalability)
const ApiEndpointSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiProject',
    required: true,
    index: true
  },
  path: {
    type: String,
    required: [true, 'Endpoint path is required'],
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'CRUD'],
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
  requiresAuth: {
    type: Boolean,
    default: null 
  },
  fields: [EndpointFieldSchema],
  // Data source for GET endpoints
  dataSource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiEndpoint',
    default: null
  },
  dataSourceMode: {
    type: String,
    enum: ['full', 'field', 'aggregator'],
    default: 'full'
  },
  dataSourceField: {
    type: String,
    default: ''
  },
  dataSourceFields: {
    type: [String],
    default: []
  },
  aggregator: {
    type: String,
    enum: ['count', 'sum', 'avg', 'min', 'max', 'total'],
    default: null
  },
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in'],
      default: 'eq'
    },
    value: mongoose.Schema.Types.Mixed,
    type: { type: String, enum: ['static', 'param', 'header'], default: 'static' }
  }],
  // Scale features
  pagination: {
    enabled: { type: Boolean, default: false },
    defaultLimit: { type: Number, default: 10 },
    maxLimit: { type: Number, default: 100 }
  },
  isCrud: { type: Boolean, default: false },
  resourceName: String
}, { 
  timestamps: true 
});

// Fast lookups for mock server routing
ApiEndpointSchema.index({ projectId: 1, path: 1, method: 1 });
ApiEndpointSchema.index({ projectId: 1, method: 1 });

export const ApiProject = mongoose.models.ApiProject || mongoose.model('ApiProject', ApiProjectSchema);
export const ApiEndpoint = mongoose.models.ApiEndpoint || mongoose.model('ApiEndpoint', ApiEndpointSchema);

// Hash app password before saving
ApiProjectSchema.pre('save', async function(next) {
  // Only hash if emailConfig.appPassword is modified and not empty
  if (this.emailConfig && 
      this.isModified('emailConfig.appPassword') && 
      this.emailConfig.appPassword && 
      this.emailConfig.appPassword.trim() !== '') {
    try {
      const salt = await bcrypt.genSalt(10);
      this.emailConfig.appPassword = await bcrypt.hash(this.emailConfig.appPassword, salt);
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Subscription Schema (New: Single Source of Truth for Plan State)
const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'plus', 'pro', 'ultra-pro', 'custom'],
    default: 'free',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'expired'],
    default: 'active',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  razorpaySubscriptionId: String,
  lastPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }
}, { 
  timestamps: true 
});

export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

// Method to verify app password
ApiProjectSchema.methods.verifyAppPassword = async function(enteredPassword: string) {
  if (!this.emailConfig || !this.emailConfig.appPassword) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.emailConfig.appPassword);
};


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
}, { 
  timestamps: true 
});

ApiTesterCollectionSchema.index({ user: 1, updatedAt: -1 });

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
}, { 
  timestamps: true 
});

// index on user already created via field-level index: true

// API Tester Request History Schema
const ApiTesterHistorySchema = new mongoose.Schema({
  requestId: mongoose.Schema.Types.ObjectId,
  method: String,
  url: String,
  statusCode: Number,
  responseTime: Number,
  responseSize: Number,
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
}, { 
  timestamps: true 
});

ApiTesterHistorySchema.index({ user: 1, createdAt: -1 });

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
  // Store Cloudinary file information
  files: {
    type: [{
      fieldName: String,
      fileType: {
        type: String,
        enum: ['image', 'video', 'audio', 'file']
      },
      fileName: String,
      originalName: String,
      url: String,
      secureUrl: String,
      publicId: String,
      format: String,
      resourceType: String,
      fileSize: Number,
      uploadedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
}, { 
  timestamps: true 
});

export const MockServerData = mongoose.models.MockServerData || mongoose.model('MockServerData', MockServerDataSchema);

// Add compound index for MockServerData
MockServerDataSchema.index({ endpointId: 1, projectId: 1, createdAt: -1 });

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
}, { 
  timestamps: true 
});

GraphQLTesterCollectionSchema.index({ user: 1, updatedAt: -1 });

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
}, { 
  timestamps: true 
});

// index on user already created via field-level index: true

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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

GraphQLTesterHistorySchema.index({ user: 1, createdAt: -1 });

export const GraphQLTesterCollection = mongoose.models.GraphQLTesterCollection || mongoose.model('GraphQLTesterCollection', GraphQLTesterCollectionSchema);
export const GraphQLTesterEnvironment = mongoose.models.GraphQLTesterEnvironment || mongoose.model('GraphQLTesterEnvironment', GraphQLTesterEnvironmentSchema);
export const GraphQLTesterHistory = mongoose.models.GraphQLTesterHistory || mongoose.model('GraphQLTesterHistory', GraphQLTesterHistorySchema);

// Payment Schema
const PaymentSchema = new mongoose.Schema({
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    required: false
  },
  razorpaySignature: {
    type: String,
    required: false
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
    default: 'created',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['plus', 'pro', 'ultra-pro', 'custom'],
    required: true
  },
  // Expiration date for the payment/subscription
  expiresAt: {
    type: Date,
    required: true
  },
  // Queue for next plan (used for upgrades/downgrades)
  nextPlan: {
    type: String,
    enum: ['free', 'plus', 'pro', 'ultra-pro', 'custom'],
    default: null
  },
  // Additional payment details
  transactionId: {
    type: String,
    required: false
  },
  bankRrn: {
    type: String,
    required: false
  },
  paymentMethod: {
    type: String,
    required: false
  },
  customerEmail: {
    type: String,
    required: false
  },
  customerPhone: {
    type: String,
    required: false
  },
  gatewayPayload: {
    type: mongoose.Schema.Types.Mixed,
    select: false // Only fetch when explicitly needed
  }
}, { 
  timestamps: true 
});

// Critical Payment Indexes
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ razorpayPaymentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ expiresAt: 1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
