import fleetHero from "@/assets/fleet-hero.jpg";
import sedan from "@/assets/vehicle-sedan.jpg";
import suv from "@/assets/vehicle-suv.jpg";
import limo from "@/assets/vehicle-limo.jpg";
import van from "@/assets/vehicle-van.jpg";

export { fleetHero };

export function vehicleImage(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("suv")) return suv;
  if (c.includes("limo")) return limo;
  if (c.includes("van")) return van;
  return sedan;
}
