import { NextResponse } from "next/server";
import { z } from "zod";
import { formatCityLocation } from "@/lib/location";

const reverseGeocodeSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type ReverseGeocodeBody = {
  locality?: unknown;
  city?: unknown;
  principalSubdivision?: unknown;
  countryName?: unknown;
};

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

function stringField(value: unknown) {
  return typeof value === "string" ? value : null;
}

export async function POST(request: Request) {
  const parsed = reverseGeocodeSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "定位坐标无效。" },
      { status: 400, headers: jsonHeaders },
    );
  }

  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client",
  );
  url.searchParams.set("latitude", String(parsed.data.latitude));
  url.searchParams.set("longitude", String(parsed.data.longitude));
  url.searchParams.set("localityLanguage", "zh");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      throw new Error("Reverse geocode request failed.");
    }

    const body = (await response.json()) as ReverseGeocodeBody;
    const location = formatCityLocation({
      locality: stringField(body.locality),
      city: stringField(body.city),
      principalSubdivision: stringField(body.principalSubdivision),
      countryName: stringField(body.countryName),
    });

    if (!location) {
      return NextResponse.json(
        { error: "暂时无法识别所在城市。" },
        { status: 502, headers: jsonHeaders },
      );
    }

    return NextResponse.json({ location }, { headers: jsonHeaders });
  } catch {
    return NextResponse.json(
      { error: "城市定位服务暂时不可用。" },
      { status: 502, headers: jsonHeaders },
    );
  }
}
