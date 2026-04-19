import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2 } from "lucide-react";
import type { Unit } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/units")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const buildings = useAppStore((s) => s.buildings);
  const properties = useAppStore((s) => s.properties);
  const units = useAppStore((s) => s.units);

  const ownerBuildings = buildings.filter((b) => b.ownerId === user?.id);
  const ownerProperties = properties.filter((p) => p.ownerId === user?.id);
  const ownerUnits = units.filter((u) => ownerBuildings.some((b) => b.id === u.buildingId));
  const add = useAppStore((s) => s.addUnit);
  const del = useAppStore((s) => s.deleteUnit);
  const upd = useAppStore((s) => s.updateUnit);

  const [open, setOpen] = useState(false);
  const empty: Omit<Unit, "id"> = {
    buildingId: ownerBuildings[0]?.id ?? "",
    propertyId: ownerProperties[0]?.id ?? "",
    number: "",
    bedrooms: 1,
    bathrooms: 1,
    area: 50,
    rent: 800,
    status: "available",
  };
  const [form, setForm] = useState(empty);

  const save = () => {
    if (!form.buildingId || !form.number) return toast.error("Edificio y número requeridos");
    add(form);
    toast.success("Unidad creada");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Unidades</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ownerUnits.length} unidades</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-warm"
              onClick={() => {
                setForm(empty);
                setOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Nueva unidad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva unidad</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Edificio</Label>
                <Select value={form.buildingId} onValueChange={(v) => setForm({ ...form, buildingId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerBuildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Propiedad</Label>
                <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerProperties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: Unit["status"]) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="rented">Alquilada</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
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
              <div>
                <Label>Área m²</Label>
                <Input
                  type="number"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Renta €</Label>
                <Input
                  type="number"
                  value={form.rent}
                  onChange={(e) => setForm({ ...form, rent: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save} className="bg-gradient-warm">
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Edificio</th>
              <th className="px-4 py-3">Habs</th>
              <th className="px-4 py-3">Renta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ownerUnits.map((u) => {
              const b = ownerBuildings.find((x) => x.id === u.buildingId);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{u.number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b?.name}</td>
                  <td className="px-4 py-3">
                    {u.bedrooms}h · {u.bathrooms}b · {u.area}m²
                  </td>
                  <td className="px-4 py-3 font-medium">€{u.rent}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.status}
                      onValueChange={(v: Unit["status"]) => upd(u.id, { status: v })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="rented">Alquilada</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        del(u.id);
                        toast.success("Eliminada");
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="border-success/30 text-success">
          Disponible
        </Badge>
        <Badge variant="outline">Alquilada</Badge>
        <Badge variant="outline" className="border-warning/30 text-warning-foreground">
          Mantenimiento
        </Badge>
      </div>
    </div>
  );
}
