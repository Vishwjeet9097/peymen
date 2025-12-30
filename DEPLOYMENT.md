# Deployment Guide - Peymen

This guide covers deploying Peymen to various static hosting platforms.

## 📦 Build for Production

Before deploying, build the production version:

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## 🚀 Deployment Platforms

### Vercel (Recommended)

1. **Install Vercel CLI** (optional):

   ```bash
   npm i -g vercel
   ```

2. **Deploy**:

   ```bash
   vercel
   ```

   Or connect your GitHub repository to Vercel for automatic deployments.

3. **Configuration**: `vercel.json` is already configured with:
   - SPA routing (all routes → index.html)
   - Cache headers for optimal performance
   - Security headers
   - Service worker support

### Netlify

1. **Install Netlify CLI** (optional):

   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:

   ```bash
   netlify deploy --prod
   ```

   Or connect your GitHub repository to Netlify.

3. **Configuration**: `netlify.toml` is already configured with:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - SPA routing rules
   - Security and cache headers

### Firebase Hosting

1. **Install Firebase CLI**:

   ```bash
   npm i -g firebase-tools
   ```

2. **Login and Initialize**:

   ```bash
   firebase login
   firebase init hosting
   ```

   Select `dist` as the public directory.

3. **Deploy**:

   ```bash
   firebase deploy --only hosting
   ```

4. **Configuration**: `firebase.json` is already configured.

### Apache / Shared Hosting

1. **Upload Files**:

   - Upload all files from `dist/` to your web root
   - Ensure `.htaccess` is uploaded (it's in the root)

2. **Configuration**: `.htaccess` is already configured with:
   - SPA routing
   - Security headers
   - Cache control
   - Gzip compression

### GitHub Pages

1. **Install gh-pages**:

   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**:

   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Deploy**:

   ```bash
   npm run deploy
   ```

4. **Note**: Update `vite.config.ts` base path if using a subdirectory:
   ```typescript
   base: "/your-repo-name/";
   ```

## ⚙️ Environment Variables

Set these in your hosting platform's environment variables:

- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `VITE_GEMINI_API_KEY` - Google Gemini API Key (optional)

### Vercel

- Go to Project Settings → Environment Variables
- Add variables for Production, Preview, and Development

### Netlify

- Go to Site Settings → Build & Deploy → Environment
- Add variables

### Firebase

- Use `.env.production` file or Firebase Functions config

## 🔍 Post-Deployment Checklist

- [ ] Verify app loads at root URL
- [ ] Test navigation (all routes work)
- [ ] Check service worker registration (DevTools → Application → Service Workers)
- [ ] Verify PWA manifest (DevTools → Application → Manifest)
- [ ] Test offline functionality
- [ ] Check console for errors
- [ ] Verify Google OAuth redirects work
- [ ] Test on mobile devices
- [ ] Verify HTTPS is enabled (required for PWA features)

## 🐛 Troubleshooting

### Routes return 404

- Ensure SPA routing is configured (all routes → index.html)
- Check `vercel.json`, `netlify.toml`, or `.htaccess` is present

### Service Worker not registering

- Verify HTTPS is enabled (required for service workers)
- Check `sw.js` is accessible at `/sw.js`
- Check browser console for errors

### Assets not loading

- Verify `base` path in `vite.config.ts` matches your deployment path
- Check asset paths are relative (not absolute)
- Clear browser cache

### Environment variables not working

- Ensure variables are prefixed with `VITE_`
- Rebuild after adding environment variables
- Check hosting platform's environment variable configuration

## 📝 Notes

- The app is a PWA and requires HTTPS in production
- Service workers only work on HTTPS (or localhost)
- All static assets are cached for optimal performance
- HTML files are not cached to ensure updates are visible
