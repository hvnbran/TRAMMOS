import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
const GOOGLE_DIRECT = "https://places.googleapis.com";
const GOOGLE_GEOCODE = "https://maps.googleapis.com";

/** Llave propia del cliente (funciona en dominios propios). Si no existe, usamos el conector de Lovable. */
function ownKey() {
  return process.env.GOOGLE_API_KEY || null;
}

const AutocompleteInput = z.object({
  input: z.string().min(1).max(200),
  lat: z.number().optional(),
  lon: z.number().optional(),
  sessionToken: z.string().optional(),
});

const DetailsInput = z.object({
  placeId: z.string().min(1).max(300),
  sessionToken: z.string().optional(),
});

const ReverseInput = z.object({
  lat: z.number(),
  lon: z.number(),
});

export interface PlaceSuggestion {
  id: string;
  primary: string;
  secondary: string;
}

export interface PlaceDetails {
  label: string;
  lat: number;
  lon: number;
}

function headers() {
  const own = ownKey();
  if (own) {
    return {
      "X-Goog-Api-Key": own,
      "Content-Type": "application/json",
    } as Record<string, string>;
  }
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !lovableKey) throw new Error("Google Maps no disponible");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": apiKey,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

/** URL de Places (v1) según si usamos la llave propia o el conector. */
function placesUrl(path: string) {
  return ownKey() ? `${GOOGLE_DIRECT}/v1/${path}` : `${GATEWAY}/places/v1/${path}`;
}

/** URL de Geocoding según si usamos la llave propia o el conector. */
function geocodeUrl(qs: string) {
  return ownKey()
    ? `${GOOGLE_GEOCODE}/maps/api/geocode/json?${qs}`
    : `${GATEWAY}/maps/api/geocode/json?${qs}`;
}



export const placesAutocomplete = createServerFn({ method: "POST" })
  .inputValidator((data) => AutocompleteInput.parse(data))
  .handler(async ({ data }): Promise<PlaceSuggestion[]> => {
    const body: Record<string, unknown> = {
      input: data.input,
      includedRegionCodes: ["co"],
      languageCode: "es",
      regionCode: "co",
    };
    if (typeof data.lat === "number" && typeof data.lon === "number") {
      body.locationBias = {
        circle: {
          center: { latitude: data.lat, longitude: data.lon },
          radius: 30000,
        },
      };
    }
    if (data.sessionToken) body.sessionToken = data.sessionToken;
    const res = await fetch(placesUrl("places:autocomplete"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Places autocomplete ${res.status}: ${text}`);
    }
    const json = (await res.json()) as { suggestions?: any[] };
    const out: PlaceSuggestion[] = [];
    for (const s of json.suggestions ?? []) {
      const p = s.placePrediction;
      if (!p?.placeId) continue;
      out.push({
        id: p.placeId,
        primary: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
        secondary: p.structuredFormat?.secondaryText?.text ?? "",
      });
    }
    return out;
  });

export const placeDetails = createServerFn({ method: "POST" })
  .inputValidator((data) => DetailsInput.parse(data))
  .handler(async ({ data }): Promise<PlaceDetails> => {
    const url = placesUrl(
      `places/${encodeURIComponent(data.placeId)}${
        data.sessionToken ? `?sessionToken=${encodeURIComponent(data.sessionToken)}` : ""
      }`,
    );
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...headers(),
        "X-Goog-FieldMask": "id,location,formattedAddress,displayName",
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Place details ${res.status}: ${text}`);
    }
    const json = (await res.json()) as {
      location?: { latitude: number; longitude: number };
      formattedAddress?: string;
      displayName?: { text?: string };
    };
    if (!json.location) throw new Error("Place details: sin ubicación");
    return {
      label: json.formattedAddress || json.displayName?.text || "Ubicación",
      lat: json.location.latitude,
      lon: json.location.longitude,
    };
  });

export const placesReverseGeocode = createServerFn({ method: "POST" })
  .inputValidator((data) => ReverseInput.parse(data))
  .handler(async ({ data }): Promise<{ label: string } | null> => {
    const url = `${GATEWAY}/maps/api/geocode/json?latlng=${data.lat},${data.lon}&language=es&region=co`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: Array<{ formatted_address?: string }> };
    const addr = json.results?.[0]?.formatted_address;
    return addr ? { label: addr } : null;
  });
