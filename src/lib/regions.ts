import { supabase } from "@/integrations/supabase/client";

export type Region = {
  id: string;
  name: string;
  slug: string;
  keywords: string[];
  active: boolean;
  sort_order: number;
};

export type RegionInput = {
  name: string;
  slug: string;
  keywords: string[];
  active: boolean;
  sort_order: number;
};

const COLS = "id,name,slug,keywords,active,sort_order";

export async function listRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from("regions")
    .select(COLS)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Region[];
}

export async function listAllRegionsAdmin(): Promise<Region[]> {
  const { data, error } = await supabase
    .from("regions")
    .select(COLS)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Region[];
}

export async function createRegion(input: RegionInput) {
  const { error } = await supabase.from("regions").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateRegion(id: string, input: Partial<RegionInput>) {
  const { error } = await supabase.from("regions").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRegion(id: string) {
  const { error } = await supabase.from("regions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Find the region whose name or keywords appear in a free-text address. */
export function detectRegion(address: string, regions: Region[]): Region | null {
  const text = address.toLowerCase();
  if (!text.trim()) return null;
  let best: { region: Region; length: number } | null = null;
  for (const r of regions) {
    const needles = [r.name, ...(r.keywords ?? [])]
      .map((n) => n?.toLowerCase().trim())
      .filter((n): n is string => !!n);
    for (const n of needles) {
      if (text.includes(n) && (!best || n.length > best.length)) {
        best = { region: r, length: n.length };
      }
    }
  }
  return best?.region ?? null;
}
