import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Calendar, Clock, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationPicker } from "@/components/site/LocationPicker";

export function BookingWidget() {
  const navigate = useNavigate();
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [transferType, setTransferType] = useState<"one_way" | "round_trip" | "hourly">("one_way");
  const [extraWait, setExtraWait] = useState(0);

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (pickupDate) params.set("date", pickupDate);
    if (pickupTime) params.set("time", pickupTime);
    if (pickup) params.set("pickup", pickup);
    if (dropoff) params.set("dropoff", dropoff);
    params.set("type", transferType);
    if (extraWait) params.set("wait", String(extraWait));
    navigate(`/booking?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl border border-border bg-card/85 backdrop-blur-xl p-5 md:p-8 shadow-[var(--shadow-elegant)] text-left">
      <div className="grid gap-6">
        {/* FORM */}
        <div className="space-y-4">
          <h3 className="font-display text-2xl text-silver-bright">Reserve your ride</h3>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-silver">Pickup date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
                <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-silver">Pickup time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
                <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <LocationPicker
              label="Pickup location"
              value={pickup}
              onChange={(v) => setPickup(v)}
              placeholder="Address, hotel or airport"
            />
            <LocationPicker
              label="Drop-off location"
              value={dropoff}
              onChange={(v) => setDropoff(v)}
              placeholder="Destination"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-silver">Transfer type</Label>
              <Select value={transferType} onValueChange={(v) => setTransferType(v as typeof transferType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_way">One way</SelectItem>
                  <SelectItem value="round_trip">Round trip</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-silver">Extra waiting (h)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
                <Input type="number" min={0} max={24} step={0.5} value={extraWait} onChange={(e) => setExtraWait(Number(e.target.value))} className="pl-9" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleContinue} size="lg" className="flex-1 bg-primary hover:bg-primary/90 tracking-wider">
              Search <ArrowRight className="ml-2 size-4" />
            </Button>
            <a href="tel:+17744345351" className="sm:w-auto">
              <Button size="lg" variant="outline" className="w-full tracking-wider">
                <Phone className="size-4 mr-2" /> Call us
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
