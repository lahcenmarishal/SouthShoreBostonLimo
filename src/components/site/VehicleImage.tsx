import { useQuery } from "@tanstack/react-query";
import { getVehicleImageUrl } from "@/lib/vehicles";
import { vehicleImage as fallbackByCategory } from "@/lib/vehicleImages";

type Props = {
  imagePath: string | null;
  category: string;
  alt: string;
  className?: string;
};

export function VehicleImage({ imagePath, category, alt, className }: Props) {
  const { data: signed } = useQuery({
    queryKey: ["vehicle-image", imagePath],
    queryFn: () => getVehicleImageUrl(imagePath),
    enabled: !!imagePath,
    staleTime: 1000 * 60 * 30,
  });
  const src = signed ?? fallbackByCategory(category);
  return <img src={src} alt={alt} loading="lazy" className={className} />;
}