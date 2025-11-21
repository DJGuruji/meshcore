# Frontend Environment Variables for Cloudflare/Vercel Deployment
# Copy this file to .env.local for local development
# Add these variables to your deployment platform (Vercel/Cloudflare Pages)

# ============================================
# NextAuth Configuration (REQUIRED)
# ============================================
# Generate a random secret: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters

# Your production URL (required for OAuth and callbacks)
NEXTAUTH_URL=https://your-domain.com

# ============================================
# Database Configuration (REQUIRED)
# ============================================
# MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# MongoDB Connection Pool Settings (OPTIONAL - defaults are production-ready)
# Adjust these only if you need custom scaling behavior
MONGODB_MAX_POOL_SIZE=10              # Max connections per serverless instance (default: 10)
MONGODB_MIN_POOL_SIZE=2               # Minimum warm connections (default: 2)
MONGODB_MAX_IDLE_TIME_MS=10000        # Close idle connections after 10s (default: 10000)
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000  # Fail fast if MongoDB is down (default: 5000)
MONGODB_SOCKET_TIMEOUT_MS=45000       # Socket timeout in ms (default: 45000)
MONGODB_RETRY_WRITES=true             # Auto-retry failed writes (default: true)
MONGODB_RETRY_READS=true              # Auto-retry failed reads (default: true)

# ============================================
# Email Configuration (REQUIRED for email features)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Your App Name

# ============================================
# Cloudflare Turnstile (REQUIRED for CAPTCHA)
# ============================================
# Get from: https://dash.cloudflare.com/
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# ============================================
# Optional: Redis for Caching
# ============================================
# REDIS_URL=redis://username:password@host:port

# ============================================
# Optional: WebSocket Relay Server
# ============================================
# NEXT_PUBLIC_RELAY_SERVER_URL=wss://your-relay-server.com
