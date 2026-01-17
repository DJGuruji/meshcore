# Environment Variables for Meshcore (Success1)

Copy the content below into your `.env` file and adjust the values as needed.

```env
# Database
# If using the local docker-compose mongodb service: mongodb://mongodb:27017/meshcore
MONGODB_URI=mongodb://localhost:27017/meshcore

# Application URLs
# The external URL where the app is hosted
BASE_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
# Generate a secret: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_here

# Backend Services (from other projects)
# Use the URL of your relay server
NEXT_PUBLIC_RELAY_SERVER_URL=http://localhost:4000
# Use the URL of your cache API
NEXT_PUBLIC_CACHE_API_URL=http://localhost:8080/api/cache

# Docker specific
PORT=3000
```
