import { supabase } from "@/integrations/supabase/client";
import { listZoneRates, resolvePrice } from "@/lib/pricing";

export type TransferType = "one_way" | "round_trip" | "hourly";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type BookingInput = {
  pickup_at: string;
  pickup_location: string;
  dropoff_location: string;
  transfer_type: TransferType;
  passengers: number;
  luggage: number;
  extra_wait_hours: number;
  estimated_km: number;
  vehicle_id: string;
  pickup_region_id?: string | null;
  dropoff_region_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
};

export async function createBooking(data: BookingInput) {
  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select("id,name,base_rate,per_km_rate,hourly_rate")
    .eq("id", data.vehicle_id)
    .eq("active", true)
    .maybeSingle();
  if (vErr || !vehicle) throw new Error(vErr?.message ?? "Vehicle not found");

  const rates = await listZoneRates().catch(() => []);
  const quote = resolvePrice({
    vehicle,
    pickupRegionId: data.pickup_region_id ?? null,
    dropoffRegionId: data.dropoff_region_id ?? null,
    transferType: data.transfer_type,
    miles: data.estimated_km,
    extraWaitHours: data.extra_wait_hours,
    rates,
  });
  const price = quote.total;

  const { data: userData } = await supabase.auth.getUser();
  const user_id = userData.user?.id ?? null;

  const { error } = await supabase
    .from("bookings")
    .insert({
      user_id,
      vehicle_id: data.vehicle_id,
      pickup_at: data.pickup_at,
      pickup_location: data.pickup_location,
      dropoff_location: data.dropoff_location,
      pickup_region_id: data.pickup_region_id ?? null,
      dropoff_region_id: data.dropoff_region_id ?? null,
      transfer_type: data.transfer_type,
      passengers: data.passengers,
      luggage: data.luggage,
      extra_wait_hours: data.extra_wait_hours,
      estimated_km: data.estimated_km,
      estimated_price: price,
      price_source: quote.source,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      notes: data.notes ?? "",
    });
  if (error) throw new Error(error.message);

  // Fire-and-forget: notify admin via Resend. Never block booking confirmation on email failures.
  supabase.functions
    .invoke("send-booking-notification", {
      body: {
        ...data,
        estimated_price: price,
        price_source: quote.source,
        vehicle_name: vehicle.name,
      },
    })
    .catch((e) => console.error("send-booking-notification failed", e));

  return { estimated_price: price };
}

export async function listMyBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,pickup_at,pickup_location,dropoff_location,transfer_type,status,estimated_price,vehicle_id,created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAllBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateBookingStatus(input: { id: string; status: BookingStatus }) {
  const { error } = await supabase
    .from("bookings")
    .update({ status: input.status })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteBooking(id: string) {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
