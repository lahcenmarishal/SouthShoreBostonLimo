import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAllBookings, updateBookingStatus, deleteBooking, type BookingStatus } from "@/lib/bookings";
import { listAllVehiclesAdmin, createVehicle, updateVehicle, deleteVehicle, uploadVehicleImage, type AdminVehicle, type VehicleInput } from "@/lib/vehicles";
import { VehicleImage } from "@/components/site/VehicleImage";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/lib/settings";
import { useSeo } from "@/lib/useSeo";
import { listAllRegionsAdmin, createRegion, updateRegion, deleteRegion, slugify, type Region } from "@/lib/regions";
import { listAllZoneRatesAdmin, createZoneRate, updateZoneRate, deleteZoneRate, type ZoneRate, type ZoneRateInput } from "@/lib/pricing";

const emptyVehicle: VehicleInput = {
  name: "",
  category: "Sedan",
  description: "",
  capacity_passengers: 4,
  capacity_luggage: 2,
  base_rate: 0,
  per_km_rate: 0,
  hourly_rate: 0,
  sort_order: 0,
  active: true,
  image_url: null,
};

export default function Admin() {
  useSeo({ title: "Admin — Ride Chic", description: "Manage all reservations.", noindex: true });
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["all-bookings"], queryFn: listAllBookings });
  const { data: vehicles = [] } = useQuery({ queryKey: ["admin-vehicles"], queryFn: listAllVehiclesAdmin });
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const mutation = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      toast.success("Reservation deleted");
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Admin</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-silver-bright">Dashboard</h1>

          <Tabs defaultValue="bookings" className="mt-10">
            <TabsList>
              <TabsTrigger value="bookings">Reservations</TabsTrigger>
              <TabsTrigger value="fleet">Fleet</TabsTrigger>
              <TabsTrigger value="regions">Regions</TabsTrigger>
              <TabsTrigger value="rates">Rates</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-6">
          {error ? (
            <Card className="mt-10 p-8 bg-card/60 text-destructive">
              {(error as Error).message}
            </Card>
          ) : isLoading ? (
            <p className="mt-10 text-muted-foreground">Loading…</p>
          ) : (
            <div className="mt-10 space-y-3">
              {data.map((b) => (
                <Card key={b.id} className="p-5 bg-card/60 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-silver-bright font-medium">{b.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        <a href={`mailto:${b.customer_email}`} className="hover:text-primary">{b.customer_email}</a>
                        {b.customer_phone && <> · <a href={`tel:${b.customer_phone}`} className="hover:text-primary">{b.customer_phone}</a></>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Ref: {b.id.slice(0, 8)} · Created {format(new Date(b.created_at), "PP p")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-2xl text-silver-bright">
                        ${Number(b.estimated_price).toFixed(0)}
                      </span>
                      {b.price_source === "zone" && <Badge variant="secondary">Fixed rate</Badge>}
                      <Badge variant="outline">{b.status}</Badge>
                      <Select value={b.status} onValueChange={(v) => mutation.mutate({ id: b.id, status: v as BookingStatus })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" aria-label="Delete reservation"><Trash2 className="size-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this reservation?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMut.mutate(b.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Pickup</p>
                      <p className="text-silver-bright">{format(new Date(b.pickup_at), "PPP p")}</p>
                      <p className="text-muted-foreground">{b.pickup_location}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Dropoff</p>
                      <p className="text-silver-bright">{b.dropoff_location}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Service</p>
                      <p className="text-silver-bright capitalize">{b.transfer_type.replace("_", " ")}</p>
                      <p className="text-muted-foreground">{(b.vehicle_id && vehicleMap.get(b.vehicle_id)?.name) || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Details</p>
                      <p className="text-muted-foreground">{b.passengers} pax · {b.luggage} bags</p>
                      <p className="text-muted-foreground">{Number(b.estimated_km)} mi · +{b.extra_wait_hours}h wait</p>
                    </div>
                  </div>

                  {b.notes && (
                    <div className="text-sm">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Notes</p>
                      <p className="text-silver">{b.notes}</p>
                    </div>
                  )}
                </Card>
              ))}
              {data.length === 0 && <p className="text-muted-foreground">No reservations yet.</p>}
            </div>
          )}
            </TabsContent>

            <TabsContent value="fleet" className="mt-6">
              <FleetManager />
            </TabsContent>

            <TabsContent value="regions" className="mt-6">
              <RegionsManager />
            </TabsContent>

            <TabsContent value="rates" className="mt-6">
              <RatesManager />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SettingsManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FleetManager() {
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-vehicles"], queryFn: listAllVehiclesAdmin });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVehicle | null>(null);
  const [form, setForm] = useState<VehicleInput>(emptyVehicle);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-vehicles"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const createMut = useMutation({
    mutationFn: () => createVehicle(form),
    onSuccess: () => { toast.success("Vehicle added"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: () => updateVehicle(editing!.id, form),
    onSuccess: () => { toast.success("Vehicle updated"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => { toast.success("Vehicle deleted"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm(emptyVehicle); setOpen(true); };
  const openEdit = (v: AdminVehicle) => {
    setEditing(v);
    setForm({
      name: v.name,
      category: v.category,
      description: v.description ?? "",
      capacity_passengers: v.capacity_passengers,
      capacity_luggage: v.capacity_luggage,
      base_rate: Number(v.base_rate),
      per_km_rate: Number(v.per_km_rate),
      hourly_rate: Number(v.hourly_rate),
      sort_order: v.sort_order,
      active: v.active,
      image_url: v.image_url,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMut.mutate(); else createMut.mutate();
  };

  const [uploading, setUploading] = useState(false);
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadVehicleImage(file);
      setForm((f) => ({ ...f, image_url: path }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-silver-bright">Fleet</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary hover:bg-primary/90"><Plus className="size-4 mr-2" /> Add vehicle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Edit vehicle" : "Add vehicle"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Limo">Limo</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Vehicle image</Label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    <VehicleImage imagePath={form.image_url ?? null} category={form.category} alt="Preview" className="size-full object-cover" />
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm px-3 py-2 rounded-md border border-border hover:bg-muted">
                    <Upload className="size-4" />
                    {uploading ? "Uploading…" : form.image_url ? "Replace image" : "Upload image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
                  </label>
                  {form.image_url && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, image_url: null })}>Remove</Button>
                  )}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Passengers</Label>
                  <Input type="number" min={1} value={form.capacity_passengers} onChange={(e) => setForm({ ...form, capacity_passengers: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Luggage</Label>
                  <Input type="number" min={0} value={form.capacity_luggage} onChange={(e) => setForm({ ...form, capacity_luggage: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Per mile ($)</Label>
                  <Input type="number" step="0.01" value={form.per_km_rate} onChange={(e) => setForm({ ...form, per_km_rate: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Per hour ($)</Label>
                  <Input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90">
                  {editing ? "Save changes" : "Add vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <Card className="mt-6 p-8 bg-card/60 text-destructive">{(error as Error).message}</Card>
      ) : isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {data.map((v) => (
            <Card key={v.id} className="p-5 bg-card/60 grid md:grid-cols-[1fr_auto_auto_auto] items-center gap-4">
              <div>
                <p className="text-silver-bright font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.category} · {v.capacity_passengers} pax · {v.capacity_luggage} bags</p>
                {v.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{v.description}</p>}
              </div>
              <div className="text-sm text-silver text-right">
                <div>${Number(v.per_km_rate).toFixed(2)} / mile</div>
                <div>${Number(v.hourly_rate || 90).toFixed(0)} / hour</div>
              </div>
              <Badge variant={v.active ? "default" : "outline"}>{v.active ? "Active" : "Hidden"}</Badge>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => openEdit(v)} aria-label="Edit"><Pencil className="size-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {v.name}?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone. Existing bookings keep their reference.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMut.mutate(v.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
          {data.length === 0 && <p className="text-muted-foreground">No vehicles yet.</p>}
        </div>
      )}
    </div>
  );
}

const emptySettings: SiteSettings = {
  contact_phone: "",
  contact_email: "",
  service_area: "",
  hours: "",
  address: "",
  facebook_url: "",
  twitter_url: "",
  linkedin_url: "",
  instagram_url: "",
};

function SettingsManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["site-settings"], queryFn: getSiteSettings });
  const [form, setForm] = useState<SiteSettings>(emptySettings);

  useEffect(() => {
    if (data) setForm({ ...emptySettings, ...data });
  }, [data]);

  const mut = useMutation({
    mutationFn: () => updateSiteSettings(form),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate();
  };

  const field = (k: keyof SiteSettings, label: string, type = "text") => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={(form[k] ?? "") as string} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </div>
  );

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <h2 className="font-display text-2xl text-silver-bright">Contact &amp; site info</h2>
      <p className="text-sm text-muted-foreground">These values appear on the Contact page and in the footer across the site.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {field("contact_phone", "Phone")}
        {field("contact_email", "Email", "email")}
        {field("service_area", "Service area")}
        {field("hours", "Hours")}
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Textarea value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <h3 className="font-display text-lg text-silver-bright pt-4">Social links</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {field("facebook_url", "Facebook URL", "url")}
        {field("twitter_url", "X / Twitter URL", "url")}
        {field("linkedin_url", "LinkedIn URL", "url")}
        {field("instagram_url", "Instagram URL", "url")}
      </div>
      <Button type="submit" disabled={mut.isPending} className="bg-primary hover:bg-primary/90">
        {mut.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function RegionsManager() {
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-regions"], queryFn: listAllRegionsAdmin });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState({ name: "", keywords: "", active: true, sort_order: 0 });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-regions"] });
    qc.invalidateQueries({ queryKey: ["regions"] });
  };

  const payload = () => ({
    name: form.name,
    slug: slugify(form.name),
    keywords: form.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean),
    active: form.active,
    sort_order: form.sort_order,
  });

  const createMut = useMutation({
    mutationFn: () => createRegion(payload()),
    onSuccess: () => { toast.success("Region added"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: () => updateRegion(editing!.id, payload()),
    onSuccess: () => { toast.success("Region updated"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (r: Region) => updateRegion(r.id, { active: !r.active }),
    onSuccess: () => { toast.success("Region updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteRegion(id),
    onSuccess: () => { toast.success("Region deleted"); invalidate(); qc.invalidateQueries({ queryKey: ["admin-zone-rates"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm({ name: "", keywords: "", active: true, sort_order: data.length + 1 }); setOpen(true); };
  const openEdit = (r: Region) => {
    setEditing(r);
    setForm({ name: r.name, keywords: (r.keywords ?? []).join(", "), active: r.active, sort_order: r.sort_order });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-silver-bright">Regions</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary hover:bg-primary/90"><Plus className="size-4 mr-2" /> Add region</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit region" : "Add region"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); editing ? updateMut.mutate() : createMut.mutate(); }} className="grid gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Airport, Downtown, Region A…" />
              </div>
              <div className="space-y-2">
                <Label>Address keywords (comma separated)</Label>
                <Textarea value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="logan, bos, terminal" />
                <p className="text-xs text-muted-foreground">Used to recognise this region automatically from the address a customer types.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90">
                  {editing ? "Save changes" : "Add region"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <Card className="mt-6 p-8 bg-card/60 text-destructive">{(error as Error).message}</Card>
      ) : isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {data.map((r) => (
            <Card key={r.id} className="p-5 bg-card/60 grid md:grid-cols-[1fr_auto_auto] items-center gap-4">
              <div className="min-w-0">
                <p className="text-silver-bright font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {(r.keywords ?? []).length ? (r.keywords ?? []).join(", ") : "No keywords"}
                </p>
              </div>
              <button onClick={() => toggleMut.mutate(r)} aria-label="Toggle active">
                <Badge variant={r.active ? "default" : "outline"}>{r.active ? "Active" : "Inactive"}</Badge>
              </button>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit"><Pencil className="size-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {r.name}?</AlertDialogTitle>
                      <AlertDialogDescription>Rates using this region will be removed too.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMut.mutate(r.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
          {data.length === 0 && <p className="text-muted-foreground">No regions yet.</p>}
        </div>
      )}
    </div>
  );
}

const ANY = "any";

function RatesManager() {
  const qc = useQueryClient();
  const { data: rates = [], isLoading, error } = useQuery({ queryKey: ["admin-zone-rates"], queryFn: listAllZoneRatesAdmin });
  const { data: vehicles = [] } = useQuery({ queryKey: ["admin-vehicles"], queryFn: listAllVehiclesAdmin });
  const { data: regions = [] } = useQuery({ queryKey: ["admin-regions"], queryFn: listAllRegionsAdmin });
  const [filterVehicle, setFilterVehicle] = useState<string>(ANY);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ZoneRate | null>(null);
  const [form, setForm] = useState({
    vehicle_id: "",
    pickup_region_id: ANY,
    dropoff_region_id: ANY,
    price: 0,
    round_trip_price: "",
    bidirectional: false,
    active: true,
  });

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.name ?? "—";
  const regionName = (id: string | null) => (id ? regions.find((r) => r.id === id)?.name ?? "—" : "Any");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-zone-rates"] });
    qc.invalidateQueries({ queryKey: ["zone-rates"] });
  };

  const payload = (): ZoneRateInput => ({
    vehicle_id: form.vehicle_id,
    pickup_region_id: form.pickup_region_id === ANY ? null : form.pickup_region_id,
    dropoff_region_id: form.dropoff_region_id === ANY ? null : form.dropoff_region_id,
    price: Number(form.price) || 0,
    round_trip_price: form.round_trip_price === "" ? null : Number(form.round_trip_price),
    bidirectional: form.bidirectional,
    active: form.active,
  });

  const createMut = useMutation({
    mutationFn: () => createZoneRate(payload()),
    onSuccess: () => { toast.success("Rate added"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: () => updateZoneRate(editing!.id, payload()),
    onSuccess: () => { toast.success("Rate updated"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (r: ZoneRate) => updateZoneRate(r.id, { active: !r.active }),
    onSuccess: () => { toast.success("Rate updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteZoneRate(id),
    onSuccess: () => { toast.success("Rate deleted"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ vehicle_id: vehicles[0]?.id ?? "", pickup_region_id: ANY, dropoff_region_id: ANY, price: 0, round_trip_price: "", bidirectional: false, active: true });
    setOpen(true);
  };
  const openEdit = (r: ZoneRate) => {
    setEditing(r);
    setForm({
      vehicle_id: r.vehicle_id,
      pickup_region_id: r.pickup_region_id ?? ANY,
      dropoff_region_id: r.dropoff_region_id ?? ANY,
      price: Number(r.price),
      round_trip_price: r.round_trip_price == null ? "" : String(Number(r.round_trip_price)),
      bidirectional: r.bidirectional,
      active: r.active,
    });
    setOpen(true);
  };

  const visible = filterVehicle === ANY ? rates : rates.filter((r) => r.vehicle_id === filterVehicle);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-silver-bright">Route rates</h2>
          <p className="text-sm text-muted-foreground">Fixed prices override the per-mile calculation. Extra wait hours are always added.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterVehicle} onValueChange={setFilterVehicle}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All vehicles</SelectItem>
              {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} disabled={vehicles.length === 0} className="bg-primary hover:bg-primary/90"><Plus className="size-4 mr-2" /> Add rate</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit rate" : "Add rate"}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); editing ? updateMut.mutate() : createMut.mutate(); }} className="grid gap-4">
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pickup region</Label>
                    <Select value={form.pickup_region_id} onValueChange={(v) => setForm({ ...form, pickup_region_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY}>Any</SelectItem>
                        {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Destination region</Label>
                    <Select value={form.dropoff_region_id} onValueChange={(v) => setForm({ ...form, dropoff_region_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY}>Any</SelectItem>
                        {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>One way price ($)</Label>
                    <Input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Return price ($, optional)</Label>
                    <Input type="number" step="0.01" value={form.round_trip_price} onChange={(e) => setForm({ ...form, round_trip_price: e.target.value })} placeholder="Default: one way × 2" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.bidirectional} onCheckedChange={(c) => setForm({ ...form, bidirectional: c })} />
                    <Label>Works in both directions</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
                    <Label>Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={!form.vehicle_id || createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90">
                    {editing ? "Save changes" : "Add rate"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error ? (
        <Card className="mt-6 p-8 bg-card/60 text-destructive">{(error as Error).message}</Card>
      ) : isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.map((r) => (
            <Card key={r.id} className="p-5 bg-card/60 grid md:grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4">
              <div>
                <p className="text-silver-bright font-medium">{vehicleName(r.vehicle_id)}</p>
                <p className="text-xs text-muted-foreground">
                  {regionName(r.pickup_region_id)} {r.bidirectional ? "↔" : "→"} {regionName(r.dropoff_region_id)}
                </p>
              </div>
              <div className="text-sm text-silver">
                <div>${Number(r.price).toFixed(2)} one way</div>
                <div className="text-muted-foreground">
                  {r.round_trip_price != null ? `$${Number(r.round_trip_price).toFixed(2)} return` : `$${(Number(r.price) * 2).toFixed(2)} return (auto)`}
                </div>
              </div>
              <button onClick={() => toggleMut.mutate(r)} aria-label="Toggle active">
                <Badge variant={r.active ? "default" : "outline"}>{r.active ? "Active" : "Inactive"}</Badge>
              </button>
              <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit"><Pencil className="size-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this rate?</AlertDialogTitle>
                    <AlertDialogDescription>The per-mile calculation will be used again for this route.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMut.mutate(r.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          ))}
          {visible.length === 0 && <p className="text-muted-foreground">No fixed rates yet — per-mile pricing applies.</p>}
        </div>
      )}
    </div>
  );
}
