import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Property } from "@/lib/types";
import prop1 from "@/assets/prop1.jpg";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/properties")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const properties = useAppStore((s) => s.properties.filter((p) => p.ownerId === user?.id));
  const buildings = useAppStore((s) => s.buildings.filter((b) => b.ownerId === user?.id));
  const add = useAppStore((s) => s.addProperty);
  const upd = useAppStore((s) => s.updateProperty);
  const del = useAppStore((s) => s.deleteProperty);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const empty: Omit<Property, "id"> = {
    ownerId: user?.id ?? "",
    title: "",
    description: "",
    type: "apartment",
    city: "",
    address: "",
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    images: [prop1],
    buildingId: undefined,
  };
  const [form, setForm] = useState<Omit<Property, "id">>(empty);

  const startNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const startEdit = (p: Property) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    void _id;
    setForm(rest);
    setOpen(true);
  };
  const save = () => {
    if (!form.title || !form.city || !form.price) {
      toast.error("Completa título, ciudad y precio");
      return;
    }
    if (editing) {
      upd(editing.id, form);
      toast.success("Propiedad actualizada");
    } else {
      add(form);
      toast.success("Propiedad creada");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Mis propiedades</h1>
          <p className="mt-1 text-sm text-muted-foreground">{properties.length} en cartera.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startNew} className="bg-gradient-warm">
              <Plus className="mr-2 h-4 w-4" /> Nueva propiedad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar propiedad" : "Nueva propiedad"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Descripción</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: Property["type"]) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="studio">Estudio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Edificio (opcional)</Label>
                <Select
                  value={form.buildingId ?? "none"}
                  onValueChange={(v) => setForm({ ...form, buildingId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin edificio</SelectItem>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Precio €/mes</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Área m²</Label>
                <Input
                  type="number"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Habitaciones</Label>
                <Input
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Baños</Label>
                <Input
                  type="number"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save} className="bg-gradient-warm">
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <img src={p.images[0]} alt={p.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 font-display font-semibold">{p.title}</h3>
                <span className="font-display text-sm font-bold">€{p.price}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.city} · {p.bedrooms}h · {p.area}m²
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="flex-1">
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    del(p.id);
                    toast.success("Eliminada");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
