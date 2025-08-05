# Azure AD SSO Authentication Implementation

This document describes the Azure AD Single Sign-On (SSO) authentication implementation for the Sustainability API.

## Overview

The authentication system uses Azure AD OAuth 2.0 with OpenID Connect for secure authentication. It supports both session-based authentication (for web applications) and token-based authentication (for API clients).

## Features

- ✅ Azure AD OAuth 2.0 SSO
- ✅ Session management with express-session
- ✅ JWT token validation
- ✅ CSRF protection
- ✅ Role-based access control
- ✅ Secure cookie configuration
- ✅ CORS with credentials support
- ✅ Environment-specific configuration
- ✅ Comprehensive error handling

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/login` | Initiate Azure AD SSO login |
| GET | `/auth/callback` | Handle Azure AD callback |
| GET | `/auth/logout` | Logout user |
| GET | `/auth/user` | Get current user information |
| GET | `/auth/status` | Check authentication status |
| POST | `/auth/refresh` | Refresh access token |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/protected/example` | Example protected route |
| GET | `/protected/admin` | Admin-only route |
| POST | `/protected/data` | Protected POST with CSRF |
| GET | `/protected/sku/:id` | Protected SKU route |
| POST | `/protected/component` | Protected component route |

## Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Azure AD Configuration
AZURE_TENANT_ID=d1e23d19-ded6-4d66-850c-0d4f35bf2edc
AZURE_CLIENT_ID=9e96c018-8b47-4aed-99f2-5a4897bb44a0
AZURE_CLIENT_SECRET=zyb8Q~Fh3Iwj_QFWrnd_9rP12LJbwz.jeRMMsbmb
AZURE_REDIRECT_URI=http://localhost:5000/dashboard
AZURE_LOGOUT_REDIRECT_URI=http://localhost:5000/auth/logout

# Security Configuration
SESSION_SECRET=your-super-secret-session-key-change-in-production
CSRF_SECRET=your-csrf-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-key-change-in-production

# Frontend Configuration
FRONTEND_URL=http://localhost:5000
```

### Azure AD App Registration

1. Register your application in Azure AD
2. Configure redirect URIs:
   - `http://localhost:5000/dashboard` (development)
   - `https://your-domain.com/dashboard` (production)
3. Configure logout redirect URIs
4. Grant necessary API permissions (Microsoft Graph)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp env.example .env
```

3. Update `.env` with your Azure AD configuration

4. Start the server:
```bash
npm run dev
```

## Usage

### Web Application Flow

1. **Initiate Login**: Redirect users to `/auth/login`
2. **Azure AD Authentication**: User authenticates with Azure AD
3. **Callback**: Azure AD redirects to `/auth/callback`
4. **Session Creation**: User session is created
5. **Access Protected Routes**: User can now access protected endpoints

### API Client Flow

1. **Get Authorization URL**: Call `/auth/login` to get authorization URL
2. **User Authentication**: User authenticates with Azure AD
3. **Get Access Token**: Use authorization code to get access token
4. **API Calls**: Include token in `Authorization: Bearer <token>` header

### Frontend Integration

#### React Example

```javascript
// Login component - add this to your main App component or wherever you want the login button
const handleLogin = async () => {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    window.location.href = data.authUrl;
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Add this to your main App component to handle authentication results
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success');
  const userParam = urlParams.get('user');
  const errorParam = urlParams.get('error');

  if (success === 'true' && userParam) {
    try {
      const userData = JSON.parse(decodeURIComponent(userParam));
      console.log('User authenticated:', userData);
      // Handle successful authentication
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }

  if (errorParam) {
    console.error('Authentication error:', decodeURIComponent(errorParam));
    // Handle authentication error
  }
}, []);

// Check authentication status
const checkAuthStatus = async () => {
  try {
    const response = await fetch('/auth/status');
    const data = await response.json();
    return data.authenticated;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
};

// Get user information
const getUserInfo = async () => {
  try {
    const response = await fetch('/auth/user');
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};
```

## Middleware Usage

### Protect Routes

```javascript
const { requireAuth, requireRole, csrfProtection } = require('./middleware/middleware.auth');

// Basic authentication
fastify.get('/protected', { preHandler: [requireAuth] }, async (request, reply) => {
  // Route handler
});

// Role-based access
fastify.get('/admin', { preHandler: [requireRole(['admin'])] }, async (request, reply) => {
  // Admin-only route
});

// CSRF protection for POST requests
fastify.post('/data', { preHandler: [requireAuth, csrfProtection] }, async (request, reply) => {
  // Protected POST route
});
```

### Access User Information

```javascript
fastify.get('/user-profile', { preHandler: [requireAuth] }, async (request, reply) => {
  const user = request.user;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles
  };
});
```

## Security Features

### Session Security
- Secure cookies in production
- HTTP-only cookies
- SameSite cookie policy
- Session timeout configuration

### CSRF Protection
- Automatic CSRF token generation
- Token validation for state-changing operations
- Configurable CSRF secret

### Token Validation
- JWT signature verification
- Issuer validation
- Audience validation
- Clock skew tolerance

### CORS Configuration
- Credentials support
- Configurable allowed origins
- Security headers

## Error Handling

The authentication system provides comprehensive error handling:

- Invalid or expired tokens
- Missing authentication
- Insufficient permissions
- CSRF token validation failures
- Azure AD authentication errors

## Production Deployment

### Environment Configuration

1. Set `NODE_ENV=production`
2. Use HTTPS in production
3. Configure secure session settings
4. Set strong secret keys
5. Configure proper CORS origins

### Azure AD Configuration

1. Update redirect URIs for production domain
2. Configure proper logout redirect URIs
3. Set appropriate API permissions
4. Configure app roles if needed

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong session secrets
- [ ] Configure secure cookies
- [ ] Set proper CORS origins
- [ ] Enable CSRF protection
- [ ] Configure proper Azure AD settings
- [ ] Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS configuration and allowed origins
2. **Session Issues**: Verify session configuration and cookie settings
3. **Token Validation Errors**: Check Azure AD configuration and token format
4. **CSRF Errors**: Ensure CSRF tokens are included in requests

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

## API Documentation

### Authentication Flow

1. **GET /auth/login**
   - Returns authorization URL and CSRF token
   - Initiates Azure AD SSO flow

2. **GET /auth/callback**
   - Handles Azure AD callback
   - Creates user session
   - Returns user information

3. **GET /auth/logout**
   - Destroys user session
   - Returns Azure AD logout URL

4. **GET /auth/user**
   - Returns current user information
   - Requires authentication

5. **GET /auth/status**
   - Returns authentication status
   - Optional authentication

6. **POST /auth/refresh**
   - Refreshes access token
   - Requires refresh token

### Response Formats

#### Success Response
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["user", "admin"]
  },
  "message": "Authentication successful"
}
```

#### Error Response
```json
{
  "error": "Authentication failed",
  "message": "Invalid or expired token"
}
```

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review Azure AD configuration
3. Verify environment variables
4. Check server logs for detailed error messages 