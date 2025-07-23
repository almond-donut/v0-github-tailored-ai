# 🔧 GitHub OAuth Troubleshooting Guide

## Quick Diagnostics

Visit `/debug` in your application to run comprehensive diagnostics.

## Common Issues & Solutions

### 1. ❌ "OAuth Provider Not Enabled"

**Problem**: GitHub OAuth is not enabled in Supabase
**Solution**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Authentication → Providers
4. Enable GitHub OAuth
5. Add your GitHub OAuth App credentials

### 2. ❌ "Redirect URI Mismatch"

**Problem**: GitHub OAuth App redirect URI doesn't match Supabase
**Solution**:
1. Go to [GitHub OAuth Apps](https://github.com/settings/applications)
2. Edit your OAuth App
3. Set Authorization callback URL to: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. For local development, also add: `http://localhost:54321/auth/v1/callback`

### 3. ❌ Environment Variables Missing

**Problem**: Required environment variables are not set
**Solution**:
1. Check your `.env.local` file exists
2. Verify all variables are set:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   \`\`\`
3. Restart your development server

### 4. ❌ "Database Tables Missing"

**Problem**: Required database tables don't exist
**Solution**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the script from `scripts/create-tables.sql`
3. Verify tables are created in the Table Editor

### 5. ❌ "CORS Error" or "Network Error"

**Problem**: Browser blocking requests or network issues
**Solution**:
1. Check if you're using HTTPS in production
2. Verify Supabase URL is correct
3. Check browser console for specific errors
4. Try disabling browser extensions temporarily

### 6. ❌ "Session Not Persisting"

**Problem**: User gets logged out immediately
**Solution**:
1. Check if cookies are enabled
2. Verify domain settings in Supabase
3. Check for conflicting localStorage/sessionStorage
4. Ensure proper RLS policies

## Step-by-Step Setup Verification

### 1. Supabase Setup
- [ ] Project created
- [ ] GitHub OAuth enabled in Authentication → Providers
- [ ] Database tables created (run SQL script)
- [ ] RLS policies configured
- [ ] Environment variables copied

### 2. GitHub OAuth App Setup
- [ ] OAuth App created at https://github.com/settings/applications
- [ ] Application name set
- [ ] Homepage URL set (e.g., http://localhost:3000)
- [ ] Authorization callback URL set to Supabase auth endpoint
- [ ] Client ID and Secret copied to environment variables

### 3. Local Development
- [ ] `.env.local` file created with all variables
- [ ] Development server restarted after adding env vars
- [ ] Browser cache cleared
- [ ] No ad blockers interfering

## Debug Commands

\`\`\`bash
# Check environment variables
npm run dev -- --debug

# Clear Next.js cache
rm -rf .next

# Check Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
\`\`\`

## Getting Help

1. **Check the debug page**: Visit `/debug` in your app
2. **Browser console**: Look for error messages
3. **Network tab**: Check failed requests
4. **Supabase logs**: Check Authentication logs in dashboard
5. **GitHub webhook logs**: Check OAuth App settings

## Test OAuth Flow Manually

1. Visit: `https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://YOUR_PROJECT.supabase.co/auth/v1/callback&scope=repo%20user`
2. Authorize the app
3. Should redirect to your callback URL
4. Check if session is created in Supabase dashboard

## Production Checklist

- [ ] Environment variables set in deployment platform
- [ ] GitHub OAuth App has production callback URL
- [ ] Supabase project is not paused
- [ ] Domain is properly configured
- [ ] HTTPS is enabled
- [ ] Database migrations run
