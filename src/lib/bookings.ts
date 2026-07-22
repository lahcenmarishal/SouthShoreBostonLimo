import { supabase } from "@/integrations/supabase/client";

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
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
};

function computePrice(
  v: { base_rate: number; per_km_rate: number; hourly_rate: number },
  data: BookingInput,
) {
  const base = Number(v.base_rate);
  const perKm = Number(v.per_km_rate);
  const hourly = Number(v.hourly_rate);
  let price = 0;
  if (data.transfer_type === "hourly") {
    const hours = Math.max(2, data.extra_wait_hours || 2);
    price = base + hourly * hours;
  } else {
    const mult = data.transfer_type === "round_trip" ? 1.9 : 1;
    price = (base + perKm * data.estimated_km) * mult + hourly * data.extra_wait_hours;
  }
  return Math.round(price * 100) / 100;
}

export async function createBooking(data: BookingInput) {
  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select("id,base_rate,per_km_rate,hourly_rate")
    .eq("id", data.vehicle_id)
    .eq("active", true)
    .maybeSingle();
  if (vErr || !vehicle) throw new Error(vErr?.message ?? "Vehicle not found");

  const price = computePrice(vehicle, data);
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
      transfer_type: data.transfer_type,
      passengers: data.passengers,
      luggage: data.luggage,
      extra_wait_hours: data.extra_wait_hours,
      estimated_km: data.estimated_km,
      estimated_price: price,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      notes: data.notes ?? "",
    });
  if (error) throw new Error(error.message);

  // Fire-and-forget: notify admin via Resend. Never block booking confirmation on email failures.
  const { data: v } = await supabase
    .from("vehicles")
    .select("name")
    .eq("id", data.vehicle_id)
    .maybeSingle();
  supabase.functions
    .invoke("send-booking-notification", {
      body: { ...data, estimated_price: price, vehicle_name: v?.name },
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
