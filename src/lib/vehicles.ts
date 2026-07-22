import { supabase } from "@/integrations/supabase/client";

export type Vehicle = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  capacity_passengers: number;
  capacity_luggage: number;
  base_rate: number;
  per_km_rate: number;
  hourly_rate: number;
  sort_order: number;
  image_url: string | null;
};

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id,name,category,description,capacity_passengers,capacity_luggage,base_rate,per_km_rate,hourly_rate,sort_order,image_url",
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Vehicle[];
}

export type AdminVehicle = Vehicle & { active: boolean };

export async function listAllVehiclesAdmin(): Promise<AdminVehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id,name,category,description,capacity_passengers,capacity_luggage,base_rate,per_km_rate,hourly_rate,sort_order,image_url,active",
    )
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminVehicle[];
}

export type VehicleInput = {
  name: string;
  category: string;
  description?: string | null;
  capacity_passengers: number;
  capacity_luggage: number;
  base_rate: number;
  per_km_rate: number;
  hourly_rate: number;
  sort_order: number;
  active: boolean;
  image_url?: string | null;
};

export async function createVehicle(input: VehicleInput) {
  const { error } = await supabase.from("vehicles").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>) {
  const { error } = await supabase.from("vehicles").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function uploadVehicleImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("vehicle-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getVehicleImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("vehicle-images").createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
