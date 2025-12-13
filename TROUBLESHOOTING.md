# Troubleshooting Login & Redirect Loop Issues

## If you're experiencing infinite redirect loops or white pages:

### 1. Check Environment Variables
Make sure your `.env.local` file contains:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secret if missing:
```bash
openssl rand -base64 32
```

### 2. Clear Browser Cache
- Open Chrome DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"
- Or use Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### 3. Restart Development Server
After adding/changing environment variables:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### 4. Check Browser Console
Open DevTools (F12) → Console tab
Look for red error messages and share them

### 5. Check Server Terminal
Look for error messages in the terminal where you run `npm run dev`

### 6. Verify Database
Make sure you have at least one user:
```bash
npx prisma studio
```
Open http://localhost:5555 and check the `users` table

### 7. Test Direct Access
Try accessing these URLs directly:
- http://localhost:3000/login
- http://localhost:3000/register
- http://localhost:3000/api/auth/session

### 8. Temporary Fix: Disable Middleware
If nothing works, temporarily comment out middleware:
1. Rename `src/middleware.ts` to `src/middleware.ts.bak`
2. Restart server
3. Test login
4. If it works, the issue is in middleware configuration


