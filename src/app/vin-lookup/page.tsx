'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface VINDecodeResult {
  vin: string;
  year: string | null;
  make: string | null;
  model: string | null;
  engineType: string | null;
  engineCylinders: string | null;
  engineConfiguration: string | null;
  engineModel: string | null;
  engineDisplacement: string | null;
  fuelType: string | null;
  bodyClass: string | null;
  vehicleType: string | null;
  driveType: string | null;
  transmissionStyle: string | null;
  trim: string | null;
  series: string | null;
  doors: string | null;
  gvwr: string | null;
  plantCountry: string | null;
  plantState: string | null;
  manufacturer: string | null;
}

export default function VINLookupPage() {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VINDecodeResult | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vin.trim()) {
      setError('Please enter a VIN');
      return;
    }

    const cleanVin = vin.trim().toUpperCase();
    
    // Basic validation
    if (cleanVin.length !== 17) {
      setError('VIN must be exactly 17 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch(`/api/vin-lookup?vin=${encodeURIComponent(cleanVin)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to decode VIN');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while decoding VIN');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setVin('');
    setResult(null);
    setError(null);
    setShowFullDetails(false);
  };

  const handleCreateVehicle = () => {
    if (!result) return;
    
    // Build vehicle data from decoded VIN
    const vehicleData = {
      make: result.make || '',
      model: result.model || '',
      year: result.year || '',
      engine: result.engineType || result.engineModel || result.engineDisplacement 
        ? `${result.engineDisplacement || ''}L ${result.engineCylinders || ''} ${result.engineConfiguration || ''} ${result.engineModel || ''}`.trim()
        : '',
      vin: result.vin,
    };

    // Store in sessionStorage for vehicle creation page to pick up
    sessionStorage.setItem('vinDecodeData', JSON.stringify(vehicleData));
    
    // Navigate to vehicles page - user can create vehicle from there
    window.location.href = '/vehicles';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            VIN Lookup & Decoder
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Decode Vehicle Identification Numbers to get vehicle details including Year, Make, Model, and Engine information
          </p>
        </div>

        {/* VIN Input Form */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter VIN Number (17 characters)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                    if (value.length <= 17) {
                      setVin(value);
                    }
                  }}
                  placeholder="1HGBH41JXMN109186"
                  maxLength={17}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono tracking-wider"
                />
                <button
                  type="submit"
                  disabled={loading || vin.length !== 17}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? 'Decoding...' : 'Decode VIN'}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="bg-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-400 font-medium whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                VIN must be 17 characters (letters and numbers, excluding I, O, Q)
              </p>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Decoding VIN...</p>
          </div>
        )}

        {/* Results Display */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Primary Information */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Vehicle Information</h2>
                <button
                  onClick={handleCreateVehicle}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium text-sm"
                >
                  + Create Vehicle from VIN
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.vin && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">VIN:</span>
                    <p className="text-lg font-mono font-semibold text-gray-900">{result.vin}</p>
                  </div>
                )}
                {result.year && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Year:</span>
                    <p className="text-lg font-semibold text-gray-900">{result.year}</p>
                  </div>
                )}
                {result.make && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Make:</span>
                    <p className="text-lg font-semibold text-gray-900">{result.make}</p>
                  </div>
                )}
                {result.model && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Model:</span>
                    <p className="text-lg font-semibold text-gray-900">{result.model}</p>
                  </div>
                )}
                {result.trim && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Trim:</span>
                    <p className="text-lg font-semibold text-gray-900">{result.trim}</p>
                  </div>
                )}
                {result.series && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Series:</span>
                    <p className="text-lg font-semibold text-gray-900">{result.series}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Engine Information */}
            {(result.engineType || result.engineCylinders || result.engineModel || result.engineDisplacement || result.fuelType) && (
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Engine Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.engineType && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Engine Type:</span>
                      <p className="text-lg font-semibold text-gray-900">{result.engineType}</p>
                    </div>
                  )}
                  {result.engineCylinders && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Cylinders:</span>
                      <p className="text-lg font-semibold text-gray-900">{result.engineCylinders}</p>
                    </div>
                  )}
                  {result.engineConfiguration && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Configuration:</span>
                      <p className="text-lg font-semibold text-gray-900">{result.engineConfiguration}</p>
                    </div>
                  )}
                  {result.engineModel && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Engine Model:</span>
                      <p className="text-lg font-semibold text-gray-900">{result.engineModel}</p>
                    </div>
                  )}
                  {result.engineDisplacement && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Displacement:</span>
                      <p className="text-lg font-semibold text-gray-900">{result.engineDisplacement}L</p>
                    </div>
                  )}
                  {result.fuelType && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Fuel Type:</span>
                      <p className="text-lg font-semibold text-gray-900">{result.fuelType}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Additional Details</h2>
                <button
                  onClick={() => setShowFullDetails(!showFullDetails)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showFullDetails ? 'Hide' : 'Show'} Full Details
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.bodyClass && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Body Class:</span>
                    <p className="text-gray-900">{result.bodyClass}</p>
                  </div>
                )}
                {result.vehicleType && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Vehicle Type:</span>
                    <p className="text-gray-900">{result.vehicleType}</p>
                  </div>
                )}
                {result.driveType && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Drive Type:</span>
                    <p className="text-gray-900">{result.driveType}</p>
                  </div>
                )}
                {result.transmissionStyle && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Transmission:</span>
                    <p className="text-gray-900">{result.transmissionStyle}</p>
                  </div>
                )}
                {result.doors && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Doors:</span>
                    <p className="text-gray-900">{result.doors}</p>
                  </div>
                )}
                {result.manufacturer && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Manufacturer:</span>
                    <p className="text-gray-900">{result.manufacturer}</p>
                  </div>
                )}
                {result.plantCountry && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Plant Country:</span>
                    <p className="text-gray-900">{result.plantCountry}</p>
                  </div>
                )}
                {result.plantState && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Plant State:</span>
                    <p className="text-gray-900">{result.plantState}</p>
                  </div>
                )}
                {result.gvwr && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">GVWR:</span>
                    <p className="text-gray-900">{result.gvwr}</p>
                  </div>
                )}
              </div>

              {showFullDetails && result.fullData && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Full API Response</h3>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs max-h-96">
                    {JSON.stringify(result.fullData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Copy Information */}
            <div className="bg-gray-50 rounded-lg shadow-md p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Copy Information</h3>
              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard(`${result.year || ''} ${result.make || ''} ${result.model || ''}`.trim())}
                  className="w-full text-left bg-white px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                >
                  📋 Copy: {result.year || ''} {result.make || ''} {result.model || ''}
                </button>
                {result.engineType && (
                  <button
                    onClick={() => copyToClipboard(result.engineType!)}
                    className="w-full text-left bg-white px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                  >
                    📋 Copy Engine: {result.engineType}
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(result.vin)}
                  className="w-full text-left bg-white px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                >
                  📋 Copy VIN: {result.vin}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-50 rounded-lg shadow-md p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCreateVehicle}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium text-sm"
                >
                  + Create Vehicle Record
                </button>
                <Link
                  href="/vehicles"
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium text-sm"
                >
                  View All Vehicles
                </Link>
                <button
                  onClick={handleClear}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium text-sm"
                >
                  Lookup Another VIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!result && !loading && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use VIN Lookup</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>What is a VIN?</strong> A Vehicle Identification Number (VIN) is a unique 17-character code that identifies a specific vehicle.
              </p>
              <p>
                <strong>Where to find it:</strong> The VIN is typically located on the driver's side dashboard (visible through the windshield), on the driver's door jamb, or in vehicle registration documents.
              </p>
              <p>
                <strong>What you'll get:</strong> Year, Make, Model, Engine Type, and additional vehicle specifications.
              </p>
              <p className="text-xs text-gray-500 mt-4">
                <strong>Note:</strong> This feature uses the NHTSA (National Highway Traffic Safety Administration) VIN Decoder API. 
                Some vehicles may have limited information available depending on the VIN database.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


