# Vercel Deployment Configuration

This document explains how to configure your backend for deployment on Vercel with proper CORS and cookie handling.

## Environment Variables

You need to set the following environment variables in your Vercel project settings:

### Required Variables

1. **`FRONTEND_ORIGIN`**
   - Set this to your frontend URL
   - Example: `https://your-frontend.vercel.app`
   - For multiple origins, separate with commas: `https://your-frontend.vercel.app,https://www.your-domain.com`

2. **`NODE_ENV`**
   - Set to `production` when deploying to Vercel
   - This ensures cookies use secure flag and proper sameSite settings

### Optional Variables

3. **`COOKIE_SAME_SITE`**
   - Set to `'none'` if frontend and backend are on different domains
   - Options: `'lax'`, `'strict'`, or `'none'`
   - Defaults to `'none'` in production if not set

4. **`COOKIE_DOMAIN`**
   - Only needed if using a shared domain pattern
   - Example: `.yourdomain.com` for sharing cookies across subdomains
   - Usually not needed for separate Vercel deployments

### Other Variables

Make sure you also have:
- `JWT_SECRET` - Secret key for JWT signing
- `MONGODB_URI` - MongoDB connection string
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
- Credentials support for cookies
- All HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- Proper headers for cookie transmission

### Cookie Configuration

Cookies are configured to work across domains:
- **SameSite**: Automatically set to `'none'` in production (required for cross-origin cookies)
- **Secure**: Automatically `true` in production or when SameSite is 'none'
- **HttpOnly**: `true` for access_token (security)
- **HttpOnly**: `false` for authp cookie (needed for Next.js middleware)

## Troubleshooting

### Issue: Cookies not being sent/set

**Solutions:**
1. Make sure `FRONTEND_ORIGIN` is set to your exact frontend URL
2. Set `COOKIE_SAME_SITE=none` if domains are different
3. Verify `NEXT_PUBLIC_API_BASE` points to your backend URL

### Issue: CORS errors

**Solutions:**
1. Check that `FRONTEND_ORIGIN` includes your frontend URL
2. Check browser console for specific CORS error messages
3. Verify credentials: 'include' is set in frontend fetch calls

### Issue: APIs loading but failing

**Solutions:**
1. Check Vercel function logs for errors
2. Verify all environment variables are set
3. Make sure both frontend and backend are deployed on Vercel
4. Check that `NEXT_PUBLIC_API_BASE` points to the correct backend URL

## Example Configuration

### Backend Environment Variables (Vercel):
```
FRONTEND_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
COOKIE_SAME_SITE=none
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
- **Cookies**: Uses `SameSite: 'lax'` and `secure: false`

No additional configuration needed for local development.

