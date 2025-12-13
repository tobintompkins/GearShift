import { NextRequest, NextResponse } from 'next/server';

// Google Geocoding API endpoint
const GEOCODE_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file' },
        { status: 500 }
      );
    }

    // Call Google Geocoding API
    const response = await fetch(
      `${GEOCODE_API_URL}?address=${encodeURIComponent(address)}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: 'No results found for this address' },
        { status: 404 }
      );
    }

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Geocoding error: ${data.status}` },
        { status: 400 }
      );
    }

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'No results returned from geocoding API' },
        { status: 404 }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return NextResponse.json({
      address: result.formatted_address,
      lat: location.lat,
      lng: location.lng,
      placeId: result.place_id,
      fullData: result, // Include full response for reference
    });
  } catch (error: any) {
    console.error('Error geocoding address:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to geocode address' },
      { status: 500 }
    );
  }
}


