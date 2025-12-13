import { NextRequest, NextResponse } from 'next/server';

// NHTSA VIN Decoder API endpoint
const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin');

    if (!vin) {
      return NextResponse.json(
        { error: 'VIN is required' },
        { status: 400 }
      );
    }

    // Validate VIN format (17 characters, alphanumeric)
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      return NextResponse.json(
        { error: 'VIN must be exactly 17 characters' },
        { status: 400 }
      );
    }

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
      return NextResponse.json(
        { error: 'Invalid VIN format. VIN must contain only letters (excluding I, O, Q) and numbers' },
        { status: 400 }
      );
    }

    // Call NHTSA API
    const response = await fetch(`${NHTSA_API_URL}/${cleanVin}?format=json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.Results || data.Results.length === 0) {
      return NextResponse.json(
        { error: 'No data returned from VIN decoder' },
        { status: 404 }
      );
    }

    const result = data.Results[0];

    // Check for errors from NHTSA
    if (result.ErrorCode && result.ErrorCode !== '0') {
      return NextResponse.json(
        { error: result.ErrorText || 'Error decoding VIN' },
        { status: 400 }
      );
    }

    // Extract relevant information
    const decodedVin = {
      vin: cleanVin,
      year: result.ModelYear || null,
      make: result.Make || null,
      model: result.Model || null,
      engineType: result.EngineModel || result.EngineConfiguration || result.EngineCylinders 
        ? `${result.EngineCylinders || ''} ${result.EngineConfiguration || ''} ${result.EngineModel || ''}`.trim() 
        : null,
      engineCylinders: result.EngineCylinders || null,
      engineConfiguration: result.EngineConfiguration || null,
      engineModel: result.EngineModel || null,
      engineDisplacement: result.DisplacementL || null,
      fuelType: result.FuelTypePrimary || null,
      bodyClass: result.BodyClass || null,
      vehicleType: result.VehicleType || null,
      driveType: result.DriveType || null,
      transmissionStyle: result.TransmissionStyle || null,
      trim: result.Trim || null,
      series: result.Series || null,
      doors: result.Doors || null,
      gvwr: result.GVWR || null,
      plantCountry: result.PlantCountry || null,
      plantState: result.PlantState || null,
      manufacturer: result.ManufacturerName || null,
      // Additional useful fields
      fullData: result, // Include full response for reference
    };

    return NextResponse.json(decodedVin);
  } catch (error: any) {
    console.error('Error decoding VIN:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to decode VIN' },
      { status: 500 }
    );
  }
}


