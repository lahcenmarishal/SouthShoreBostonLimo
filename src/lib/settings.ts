import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  contact_phone: string | null;
  contact_email: string | null;
  service_area: string | null;
  hours: string | null;
  address: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
};

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("contact_phone,contact_email,service_area,hours,address,facebook_url,twitter_url,linkedin_url,instagram_url")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SiteSettings | null);
}

export async function updateSiteSettings(input: SiteSettings) {
  const { error } = await supabase.from("site_settings").upsert({ id: true, ...input });
  if (error) throw new Error(error.message);
}