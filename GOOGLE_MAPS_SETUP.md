# Google Maps API Setup

To use the Job Location Map feature, you need to set up a Google Maps API key.

## Steps:

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Geocoding API
     - Directions API
   - Create credentials (API Key)
   - Restrict the API key to your domain (recommended for production)

2. **Add to Environment Variables:**
   - Open your `.env.local` file
   - Add the following line:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```
   - Replace `your_api_key_here` with your actual API key

3. **Restart Development Server:**
   - Stop your dev server (Ctrl+C)
   - Run `npm run dev` again

## Features Enabled:

- **Maps JavaScript API**: For displaying the map
- **Geocoding API**: For converting addresses to coordinates
- **Directions API**: For route planning between jobs

## Cost Notes:

- Google Maps offers a free tier with $200 credit per month
- This typically covers:
  - 28,000 map loads per month
   - 40,000 geocoding requests per month
   - 40,000 directions requests per month
- For most small businesses, this should be sufficient

## Security:

- The API key is prefixed with `NEXT_PUBLIC_` which makes it available to the client
- For production, restrict the API key to your domain in Google Cloud Console
- Never commit your API key to version control (`.env.local` is already in `.gitignore`)


