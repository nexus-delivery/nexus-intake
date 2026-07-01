import { NextRequest, NextResponse } from "next/server";

type GeocodeResult = { latitude: number; longitude: number };

type DistanceResult = { distanceKm: number; journeyMinutes: number };

const googleApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

async function geocode(address: string): Promise<GeocodeResult | null> {
  if (!googleApiKey) return null;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(googleApiKey)}`
  );

  const payload = (await response.json().catch(() => ({}))) as {
    status?: string;
    results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
  };

  if (!response.ok || payload.status !== "OK" || !payload.results?.[0]?.geometry?.location) {
    return null;
  }

  const location = payload.results[0].geometry.location;
  const latitude = location.lat;
  const longitude = location.lng;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

async function distanceBetweenAddresses(collectionAddress: string, deliveryAddress: string): Promise<DistanceResult | null> {
  if (!googleApiKey) return null;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(collectionAddress)}&destinations=${encodeURIComponent(deliveryAddress)}&units=metric&key=${encodeURIComponent(googleApiKey)}`
  );

  const payload = (await response.json().catch(() => ({}))) as {
    status?: string;
    rows?: Array<{
      elements?: Array<{
        status?: string;
        distance?: { value?: number };
        duration?: { value?: number };
      }>;
    }>;
  };

  const element = payload.rows?.[0]?.elements?.[0];
  if (!response.ok || payload.status !== "OK" || element?.status !== "OK") {
    return null;
  }

  const distanceMeters = Number(element.distance?.value ?? 0);
  const durationSeconds = Number(element.duration?.value ?? 0);

  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
    return null;
  }

  return {
    distanceKm: Number((distanceMeters / 1000).toFixed(2)),
    journeyMinutes: Math.max(1, Math.round(durationSeconds / 60)),
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    collectionAddress?: string;
    deliveryAddress?: string;
  };

  const collectionAddress = body.collectionAddress?.trim() ?? "";
  const deliveryAddress = body.deliveryAddress?.trim() ?? "";

  if (!collectionAddress || !deliveryAddress) {
    return NextResponse.json({ valid: false, message: "Collection and delivery addresses are required." }, { status: 400 });
  }

  if (!googleApiKey) {
    return NextResponse.json({
      valid: false,
      message: "Google Maps foundation is enabled but GOOGLE_MAPS_API_KEY is not configured.",
    });
  }

  const [collectionGeo, deliveryGeo, distance] = await Promise.all([
    geocode(collectionAddress),
    geocode(deliveryAddress),
    distanceBetweenAddresses(collectionAddress, deliveryAddress),
  ]);

  if (!collectionGeo || !deliveryGeo || !distance) {
    return NextResponse.json({ valid: false, message: "Address validation or distance lookup failed." }, { status: 422 });
  }

  return NextResponse.json({
    valid: true,
    collection: {
      latitude: collectionGeo.latitude.toFixed(6),
      longitude: collectionGeo.longitude.toFixed(6),
    },
    delivery: {
      latitude: deliveryGeo.latitude.toFixed(6),
      longitude: deliveryGeo.longitude.toFixed(6),
    },
    distanceKm: distance.distanceKm.toFixed(2),
    journeyMinutes: String(distance.journeyMinutes),
    message: "Address validation complete.",
  });
}
