import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, ArrowRight, ArrowLeft, Users, Briefcase as Bag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listVehicles, type Vehicle } from "@/lib/vehicles";
import { VehicleImage } from "@/components/site/VehicleImage";
import { createBooking, type TransferType } from "@/lib/bookings";
import { cn } from "@/lib/utils";
import { useSeo } from "@/lib/useSeo";
import { LocationPicker } from "@/components/site/LocationPicker";
import { listRegions, detectRegion } from "@/lib/regions";
import { listZoneRates, resolvePrice } from "@/lib/pricing";

type Step = 1 | 2 | 3;

export default function Booking() {
  useSeo({
    title: "Request a quote — South Shore Limo Boston",
    description: "Request a chauffeur quote in 3 simple steps. Final price confirmed by our team.",
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  const rawType = searchParams.get("type") as TransferType | null;
  const initType: TransferType = rawType === "round_trip" ? "round_trip" : "one_way";

  const [date, setDate] = useState(searchParams.get("date") ?? "");
  const [time, setTime] = useState(searchParams.get("time") ?? "");
  const [pickup, setPickup] = useState(searchParams.get("pickup") ?? "");
  const [dropoff, setDropoff] = useState(searchParams.get("dropoff") ?? "");
  const [transferType, setTransferType] = useState<TransferType>(initType);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(1);
  const [extraWait, setExtraWait] = useState(Number(searchParams.get("wait") ?? 0));
  const [estimatedMiles, setEstimatedMiles] = useState(Number(searchParams.get("miles") ?? 0));

  const [vehicleId, setVehicleId] = useState<string>(searchParams.get("vehicle") ?? "");
  const [pickupRegionId, setPickupRegionId] = useState<string>("");
  const [dropoffRegionId, setDropoffRegionId] = useState<string>("");
  const [pickupRegionTouched, setPickupRegionTouched] = useState(false);
  const [dropoffRegionTouched, setDropoffRegionTouched] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: listVehicles });
  const { data: regions = [] } = useQuery({ queryKey: ["regions"], queryFn: listRegions });
  const { data: zoneRates = [] } = useQuery({ queryKey: ["zone-rates"], queryFn: listZoneRates });

  // Auto-detect the region from the typed address until the user overrides it.
  useEffect(() => {
    if (pickupRegionTouched || regions.length === 0) return;
    setPickupRegionId(detectRegion(pickup, regions)?.id ?? "");
  }, [pickup, regions, pickupRegionTouched]);
  useEffect(() => {
    if (dropoffRegionTouched || regions.length === 0) return;
    setDropoffRegionId(detectRegion(dropoff, regions)?.id ?? "");
  }, [dropoff, regions, dropoffRegionTouched]);
  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success("Quote request received! Follow its status here at any time.");
      navigate("/track");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canNext1 = date && time && pickup && dropoff;
  const [computingMiles, setComputingMiles] = useState(false);

  // Auto-calculate distance in miles when both pickup and drop-off are set.
  useEffect(() => {
    if (!pickup || !dropoff) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setComputingMiles(true);
      try {
        const { data, error } = await supabase.functions.invoke("compute-distance", {
          body: { pickup, dropoff },
        });
        if (error) throw error;
        if (!controller.signal.aborted && typeof data?.miles === "number") {
          setEstimatedMiles(data.miles);
        }
      } catch (e) {
        console.warn("Distance auto-calculation failed:", (e as Error).message);
      } finally {
        if (!controller.signal.aborted) setComputingMiles(false);
      }
    }, 700);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [pickup, dropoff, transferType]);
  const canNext2 = !!vehicleId;
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const handleSubmit = () => {
    if (!vehicleId) return;
    const pickup_at = new Date(`${date}T${time}:00`).toISOString();
    mutation.mutate({
      pickup_at,
      pickup_location: pickup,
      dropoff_location: dropoff,
      transfer_type: transferType,
      passengers,
      luggage,
      extra_wait_hours: extraWait,
      estimated_km: estimatedMiles,
      vehicle_id: vehicleId,
      pickup_region_id: pickupRegionId || null,
      dropoff_region_id: dropoffRegionId || null,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      notes,
    });
  };

  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <h1 className="font-display text-4xl md:text-5xl text-silver-bright text-center">
            Reserve your <span className="italic text-primary">ride</span>
          </h1>

          <div className="mt-10 flex items-center justify-center gap-4 md:gap-8">
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="flex items-center gap-3">
                <div className={cn("size-10 rounded-full grid place-items-center font-display text-lg border-2 transition-colors", step >= n ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                  {step > n ? <Check className="size-5" /> : n}
                </div>
                <span className={cn("hidden sm:inline text-sm", step >= n ? "text-silver-bright" : "text-muted-foreground")}>
                  {n === 1 ? "Trip" : n === 2 ? "Vehicle" : "Details"}
                </span>
              </div>
            ))}
          </div>

          <Card className="mt-10 p-6 md:p-8 bg-card/70">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <LocationPicker
                      label="Pickup location"
                      value={pickup}
                      onChange={(v) => setPickup(v)}
                      placeholder="Address, hotel or airport"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <LocationPicker
                      label="Drop-off location"
                      value={dropoff}
                      onChange={(v) => setDropoff(v)}
                      placeholder="Destination"
                    />
                  </div>
                  {regions.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <Label>Pickup region</Label>
                        <Select
                          value={pickupRegionId || "none"}
                          onValueChange={(v) => { setPickupRegionTouched(true); setPickupRegionId(v === "none" ? "" : v); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Drop-off region</Label>
                        <Select
                          value={dropoffRegionId || "none"}
                          onValueChange={(v) => { setDropoffRegionTouched(true); setDropoffRegionId(v === "none" ? "" : v); }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Transfer type</Label>
                    <Select value={transferType} onValueChange={(v) => setTransferType(v as TransferType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_way">One way</SelectItem>
                        <SelectItem value="round_trip">Return</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Extra wait hours</Label>
                    <Input type="number" min={0} max={24} step={0.5} value={extraWait} onChange={(e) => setExtraWait(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Passengers</Label>
                    <Input type="number" min={1} max={20} value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Luggage</Label>
                    <Input type="number" min={0} max={30} value={luggage} onChange={(e) => setLuggage(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Distance (miles)</Label>
                    <Input
                      type="text"
                      readOnly
                      value={computingMiles ? "Calculating…" : estimatedMiles ? `${estimatedMiles} mi` : "—"}
                      className="bg-muted/40"
                    />
                    <p className="text-xs text-muted-foreground">Distance is calculated automatically from pickup & drop-off. Final pricing confirmed by our team.</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setStep(2)} disabled={!canNext1} className="bg-primary hover:bg-primary/90">
                    Choose vehicle <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Pick a vehicle. Rates below are indicative — your final quote is confirmed by our team after we validate the itinerary.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {vehicles.map((v) => {
                    const selected = vehicleId === v.id;
                    return (
                      <button key={v.id} onClick={() => setVehicleId(v.id)} className={cn("text-left rounded-xl border overflow-hidden bg-card transition-all", selected ? "border-primary shadow-[var(--shadow-glow)]" : "border-border hover:border-primary/50")}>
                        <div className="aspect-[16/9] overflow-hidden">
                          <VehicleImage imagePath={v.image_url} category={v.category} alt={v.name} className="size-full object-cover" />
                        </div>
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs tracking-wider text-primary uppercase">{v.category}</p>
                              <h3 className="font-display text-xl text-silver-bright mt-1">{v.name}</h3>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-lg text-silver-bright">${Number(v.per_km_rate).toFixed(2)}<span className="text-xs text-muted-foreground font-sans"> /mi</span></p>
                              <p className="font-display text-lg text-silver-bright">${Number(v.hourly_rate || 90).toFixed(0)}<span className="text-xs text-muted-foreground font-sans"> /hr</span></p>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-silver">
                            <span className="flex items-center gap-1"><Users className="size-3.5 text-primary" />{v.capacity_passengers}</span>
                            <span className="flex items-center gap-1"><Bag className="size-3.5 text-primary" />{v.capacity_luggage}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 size-4" /> Back</Button>
                  <Button onClick={() => setStep(3)} disabled={!canNext2} className="bg-primary hover:bg-primary/90">
                    Continue <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Phone</Label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Notes (optional)</Label>
                    <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Flight number, special requests…" />
                  </div>
                </div>

                {selectedVehicle && (() => {
                  const quote = resolvePrice({
                    vehicle: selectedVehicle,
                    pickupRegionId: pickupRegionId || null,
                    dropoffRegionId: dropoffRegionId || null,
                    transferType,
                    miles: estimatedMiles,
                    extraWaitHours: extraWait,
                    rates: zoneRates,
                  });
                  const typeLabel = transferType === "round_trip" ? "Return" : "One way";
                  return (
                    <div className="rounded-lg border border-primary/30 bg-card p-5">
                      <p className="text-xs tracking-wider text-primary uppercase">Summary</p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-silver-bright font-display text-lg">{selectedVehicle.name}</p>
                          <p className="text-sm text-muted-foreground">{pickup} → {dropoff}</p>
                          <p className="text-sm text-muted-foreground">{date} at {time} · {passengers} pax · {luggage} bags · {typeLabel}</p>
                          <div className="mt-2 text-sm text-muted-foreground space-y-0.5">
                            {quote.lines.map((l) => <p key={l}>{l}</p>)}
                          </div>
                        </div>
                        <div className="text-right max-w-[16rem]">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {quote.source === "zone" ? "Fixed rate total" : "Estimated total"}
                          </p>
                          <p className="font-display text-3xl text-silver-bright">${quote.total.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {quote.source === "zone"
                              ? "Fixed price for this route, confirmed by our team."
                              : "Final price confirmed by our team by email or phone within minutes."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-2 size-4" /> Back</Button>
                  <Button onClick={handleSubmit} disabled={!name || !email || !phone || mutation.isPending} className="bg-primary hover:bg-primary/90">
                    {mutation.isPending ? "Sending…" : "Request quote"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
