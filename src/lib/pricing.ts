import { supabase } from "@/integrations/supabase/client";
import type { TransferType } from "@/lib/bookings";

export type ZoneRate = {
  id: string;
  vehicle_id: string;
  pickup_region_id: string | null;
  dropoff_region_id: string | null;
  price: number;
  round_trip_price: number | null;
  bidirectional: boolean;
  active: boolean;
};

export type ZoneRateInput = {
  vehicle_id: string;
  pickup_region_id: string | null;
  dropoff_region_id: string | null;
  price: number;
  round_trip_price: number | null;
  bidirectional: boolean;
  active: boolean;
};

const COLS =
  "id,vehicle_id,pickup_region_id,dropoff_region_id,price,round_trip_price,bidirectional,active";

export async function listZoneRates(): Promise<ZoneRate[]> {
  const { data, error } = await supabase.from("zone_rates").select(COLS).eq("active", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as ZoneRate[];
}

export async function listAllZoneRatesAdmin(): Promise<ZoneRate[]> {
  const { data, error } = await supabase
    .from("zone_rates")
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ZoneRate[];
}

export async function createZoneRate(input: ZoneRateInput) {
  const { error } = await supabase.from("zone_rates").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateZoneRate(id: string, input: Partial<ZoneRateInput>) {
  const { error } = await supabase.from("zone_rates").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteZoneRate(id: string) {
  const { error } = await supabase.from("zone_rates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type PriceVehicle = {
  id: string;
  base_rate: number;
  per_km_rate: number;
  hourly_rate: number;
};

export type PriceArgs = {
  vehicle: PriceVehicle;
  pickupRegionId: string | null;
  dropoffRegionId: string | null;
  transferType: TransferType;
  miles: number;
  extraWaitHours: number;
  rates: ZoneRate[];
};

export type PriceResult = {
  total: number;
  tripCost: number;
  waitCost: number;
  source: "zone" | "formula";
  matchedRateId: string | null;
  lines: string[];
};

/**
 * Find the most specific active zone rate for a vehicle + pickup/dropoff region pair.
 * Specificity: exact pickup+dropoff > one region + "any" > "any"/"any".
 */
export function findZoneRate(args: {
  vehicleId: string;
  pickupRegionId: string | null;
  dropoffRegionId: string | null;
  rates: ZoneRate[];
}): ZoneRate | null {
  const { vehicleId, pickupRegionId, dropoffRegionId, rates } = args;
  let best: { rate: ZoneRate; score: number } | null = null;

  for (const r of rates) {
    if (!r.active || r.vehicle_id !== vehicleId) continue;

    const directions: Array<[string | null, string | null]> = [[r.pickup_region_id, r.dropoff_region_id]];
    if (r.bidirectional) directions.push([r.dropoff_region_id, r.pickup_region_id]);

    for (const [from, to] of directions) {
      const fromOk = from === null || (!!pickupRegionId && from === pickupRegionId);
      const toOk = to === null || (!!dropoffRegionId && to === dropoffRegionId);
      if (!fromOk || !toOk) continue;
      const score = (from !== null ? 2 : 0) + (to !== null ? 2 : 0);
      if (!best || score > best.score) best = { rate: r, score };
    }
  }
  return best?.rate ?? null;
}

export function resolvePrice(args: PriceArgs): PriceResult {
  const { vehicle, transferType, miles, extraWaitHours, rates } = args;
  const hourly = Number(vehicle.hourly_rate) || 90;
  const waitCost = hourly * (Number(extraWaitHours) || 0);
  const isRound = transferType === "round_trip";

  const rate = findZoneRate({
    vehicleId: vehicle.id,
    pickupRegionId: args.pickupRegionId,
    dropoffRegionId: args.dropoffRegionId,
    rates,
  });

  const lines: string[] = [];

  if (rate) {
    const oneWay = Number(rate.price) || 0;
    const tripCost = isRound
      ? rate.round_trip_price != null
        ? Number(rate.round_trip_price)
        : oneWay * 2
      : oneWay;
    lines.push(
      isRound
        ? `Fixed return rate = $${tripCost.toFixed(2)}`
        : `Fixed rate = $${tripCost.toFixed(2)}`,
    );
    if (waitCost > 0)
      lines.push(`Extra wait: ${extraWaitHours} h × $${hourly.toFixed(0)}/h = $${waitCost.toFixed(2)}`);
    return {
      total: round2(tripCost + waitCost),
      tripCost: round2(tripCost),
      waitCost: round2(waitCost),
      source: "zone",
      matchedRateId: rate.id,
      lines,
    };
  }

  const base = Number(vehicle.base_rate) || 0;
  const perMi = Number(vehicle.per_km_rate) || 0;
  const mult = isRound ? 1.9 : 1;
  const tripCost = (base + perMi * (Number(miles) || 0)) * mult;
  lines.push(
    `${Number(miles) || 0} mi × $${perMi.toFixed(2)}/mi${isRound ? " × 1.9 (return)" : ""} = $${tripCost.toFixed(2)}`,
  );
  if (waitCost > 0)
    lines.push(`Extra wait: ${extraWaitHours} h × $${hourly.toFixed(0)}/h = $${waitCost.toFixed(2)}`);

  return {
    total: round2(tripCost + waitCost),
    tripCost: round2(tripCost),
    waitCost: round2(waitCost),
    source: "formula",
    matchedRateId: null,
    lines,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
