# Fake API Generator

A powerful and intuitive fake API generator built with Next.js that allows you to create mock REST APIs with custom endpoints and responses. Perfect for frontend development, testing, and prototyping.

## Features

- 🚀 **Easy Project Management**: Create multiple API projects with custom base URLs
- 🔧 **Full HTTP Methods Support**: GET, POST, PUT, PATCH, DELETE
- 📝 **Custom JSON Responses**: Write your own JSON responses or use built-in templates
- 🎯 **Template Library**: Pre-built JSON templates for common use cases (users, products, orders, etc.)
- 🔗 **Instant URLs**: Copy-paste ready API endpoints
- 🧪 **Built-in Testing**: Test endpoints directly from the interface
- 🔐 **User Authentication**: Secure project management with user accounts
- 🛡️ **API Authentication**: Protect endpoints with tokens and custom headers
- 📱 **Responsive Design**: Works perfectly on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fake-api-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/fake-api-generator
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
BASE_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### 1. Create an Account
- Register a new account or sign in with existing credentials
- All your API projects will be saved to your account

### 2. Create a Project
- Click the "+" button in the sidebar
- Enter a project name (e.g., "My Blog API")
- Set a base URL (e.g., "/api/v1")

### 3. Add Endpoints
- Select your project from the sidebar
- Click "Add Endpoint" 
- Configure:
  - **Path**: `/users`, `/posts/{id}`, etc.
  - **Method**: GET, POST, PUT, PATCH, DELETE
  - **Status Code**: 200, 201, 404, 500, etc.
  - **Authentication**: Inherit from project, always require, or no auth
  - **Response Body**: Custom JSON or use templates

### 4. Use Your API
- Copy the generated URL for each endpoint
- Make HTTP requests to: `http://localhost:3000/api/fake{baseUrl}{path}`
- Example: `http://localhost:3000/api/fake/api/v1/users`

## API URL Structure

Your fake APIs follow this pattern:
```
{BASE_URL}/api/fake/{projectName}{projectBaseUrl}{endpointPath}
```

**Example:**
- Project Name: "My Blog API" (becomes `my-blog-api`)
- Project Base URL: `/api/v1`
- Endpoint Path: `/users`
- Full URL: `http://localhost:3000/api/fake/my-blog-api/api/v1/users`

**Project Name Conversion:**
- Spaces and special characters are converted to hyphens
- Uppercase letters are converted to lowercase
- "My Blog API" → `my-blog-api`
- "User Management System" → `user-management-system`

## Authentication

Protect your fake API endpoints with token-based authentication.

### Enable Authentication

1. **Project Level**: Enable authentication for the entire project
2. **Endpoint Level**: Override authentication per endpoint
3. **Token Generation**: Auto-generate secure tokens or create custom ones
4. **Custom Headers**: Configure header name and token prefix

### Authentication Settings

- **Header Name**: Default is `Authorization` (customizable)
- **Token Prefix**: Default is `Bearer` (customizable)
- **Token Format**: Auto-generated tokens use format `xxxx-xxxx-xxxx-xxxx`

### Usage Examples

**Protected Endpoint:**
```bash
# Without token (401 Unauthorized)
curl http://localhost:3000/api/fake/my-api/api/v1/users

# With token (200 Success)
curl -H "Authorization: Bearer abcd-1234-efgh-5678" \
     http://localhost:3000/api/fake/my-api/api/v1/users
```

**Custom Header:**
```bash
# Using custom header name and prefix
curl -H "X-API-Key: Token abcd-1234-efgh-5678" \
     http://localhost:3000/api/fake/my-api/api/v1/users
```

### Authentication Levels

1. **Project Authentication**: All endpoints inherit project settings
2. **Always Require**: Endpoint always requires auth (overrides project)
3. **No Authentication**: Endpoint never requires auth (overrides project)

## Built-in JSON Templates

Choose from pre-built templates:
- **Simple Message**: Basic success/error responses
- **User Object**: Single user data
- **User List**: Array of users
- **Product Object**: E-commerce product data
- **Product List**: Array of products
- **Paginated Response**: Data with pagination metadata
- **Error Response**: Standardized error format
- **Auth Token**: Authentication response
- **Blog Post**: Blog/article data
- **Order Object**: E-commerce order data

## Example Usage

### Create a User API

1. **Create Project**: "User Management API" with base URL `/api/v1`

2. **Add Endpoints**:
   - `GET /users` → Returns user list
   - `GET /users/{id}` → Returns single user
   - `POST /users` → Returns created user
   - `PUT /users/{id}` → Returns updated user
   - `DELETE /users/{id}` → Returns success message

3. **Use in Your App**:
```javascript
// Fetch all users (project name: "User Management API")
const users = await fetch('http://localhost:3000/api/fake/user-management-api/api/v1/users');

// Create a user
const newUser = await fetch('http://localhost:3000/api/fake/user-management-api/api/v1/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John Doe' })
});
```

## Development

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── fake/[...path]/     # Dynamic fake API routes
│   │   ├── projects/           # Project management API
│   │   └── auth/               # Authentication API
│   ├── auth/                   # Auth pages
│   └── page.tsx                # Main application
├── components/
│   ├── ProjectPanel.tsx        # Project sidebar
│   ├── ProjectDetail.tsx       # Endpoint management
│   └── Header.tsx              # Navigation header
└── lib/
    ├── models.ts               # Database models
    ├── jsonGenerator.ts        # Template system
    └── auth.ts                 # Auth configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the code examples above