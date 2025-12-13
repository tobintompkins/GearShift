# Authentication Setup

## Required Environment Variables

Add these to your `.env.local` file:

```env
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Generate a Secret Key

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use any random string generator. This secret is used to encrypt JWT tokens.

## Troubleshooting Login Issues

If login is hanging or not working:

1. **Check Environment Variables**: Make sure `NEXTAUTH_SECRET` is set in `.env.local`
2. **Restart Dev Server**: After adding environment variables, restart your dev server
3. **Check Console Logs**: Open browser console and server terminal to see error messages
4. **Verify User Exists**: Make sure you've created a user account via `/register`
5. **Check Database**: Verify the user was created in the database

## Testing

1. Go to `/register` and create an account
2. Go to `/login` and sign in
3. Check browser console for any errors
4. Check server terminal for authentication logs


