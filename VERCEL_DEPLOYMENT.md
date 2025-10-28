# Vercel Deployment Configuration

This document explains how to configure your backend for deployment on Vercel with JWT authentication.

## Environment Variables

You need to set the following environment variables in your Vercel project settings:

### Required Variables

1. **`FRONTEND_ORIGIN`**
   - Set this to your frontend URL
   - Example: `https://your-frontend.vercel.app`
   - For multiple origins, separate with commas: `https://your-frontend.vercel.app,https://www.your-domain.com`

2. **`NODE_ENV`**
   - Set to `production` when deploying to Vercel

### Optional Variables (No longer needed with JWT)

The following environment variables are NOT needed with JWT token authentication:
- ~~`COOKIE_SAME_SITE`~~ - No longer needed
- ~~`COOKIE_DOMAIN`~~ - No longer needed

### Other Required Variables

Make sure you also have:
- `JWT_SECRET` - Secret key for JWT signing (REQUIRED)
- `MONGODB_URI` - MongoDB connection string (REQUIRED)
- `GOOGLE_CLIENT_ID` (if using Google OAuth) - Google OAuth client ID
- Any other API keys your backend needs

## Frontend Configuration

In your frontend Vercel project, set:

1. **`NEXT_PUBLIC_API_BASE`**
   - Set to your backend Vercel URL
   - Example: `https://your-backend.vercel.app`
   - **Important**: Do NOT include a trailing slash

## How It Works

### CORS Configuration

The backend now properly handles CORS with:
- Configurable allowed origins via `FRONTEND_ORIGIN`
- Credentials support for cookies (maintained for compatibility)
- All HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- Proper headers for JWT token transmission: `Content-Type`, `Authorization`

### JWT Token Authentication

Authentication now uses JWT tokens:
- Tokens are sent in the `Authorization: Bearer <token>` header
- Tokens are stored on the client in localStorage
- Tokens expire after 15 minutes
- No cookies required for authentication

## Troubleshooting

### Issue: CORS errors on Vercel

**Solutions:**
1. Make sure `FRONTEND_ORIGIN` is set to your exact frontend URL in Vercel
2. Check browser console for specific CORS error messages
3. Verify that your frontend URL matches what's in `FRONTEND_ORIGIN`
4. Ensure both `allowedHeaders` and `exposedHeaders` include 'Authorization'

### Issue: Authentication not working

**Solutions:**
1. Check that `JWT_SECRET` is set in Vercel backend environment variables
2. Verify that tokens are being stored in localStorage on the frontend
3. Check browser Network tab to see if `Authorization` header is being sent
4. Check Vercel function logs for authentication errors

### Issue: APIs loading but failing

**Solutions:**
1. Check Vercel function logs for errors
2. Verify all environment variables are set
3. Make sure both frontend and backend are deployed on Vercel
4. Check that `NEXT_PUBLIC_API_BASE` points to the correct backend URL
5. Ensure `MONGODB_URI` is properly configured

## Example Configuration

### Backend Environment Variables (Vercel):
```
FRONTEND_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
JWT_SECRET=your-secret-key
MONGODB_URI=your-mongodb-connection-string
```

### Frontend Environment Variables (Vercel):
```
NEXT_PUBLIC_API_BASE=https://your-backend.vercel.app
OPENAI_API_KEY=your-openai-key
```

## Local Development

For local development, these are the default configurations:
- **Frontend**: Runs on `http://localhost:3000` or `3001`
- **Backend**: Runs on `http://localhost:4000`
- **CORS**: Automatically allows localhost origins
- **JWT**: Uses same configuration as production

No additional configuration needed for local development.
