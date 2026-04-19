import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Plus, Trash2, Pencil, DoorOpen } from "lucide-react";
import type { Building } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/buildings")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const buildings = useAppStore((s) => s.buildings);
  const units = useAppStore((s) => s.units);
  const add = useAppStore((s) => s.addBuilding);
  const upd = useAppStore((s) => s.updateBuilding);
  const del = useAppStore((s) => s.deleteBuilding);

  const ownerBuildings = useMemo(
    () => buildings.filter((b) => b.ownerId === user?.id),
    [buildings, user?.id],
  );

  const buildEmpty = (): Omit<Building, "id"> => ({
    name: "",
    address: "",
    city: "",
    ownerId: user?.id ?? "",
    amenityIds: [],
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState<Omit<Building, "id">>(buildEmpty);

  const save = () => {
    if (!form.name || !form.city) return toast.error("Completa nombre y ciudad");
    if (editing) {
      upd(editing.id, form);
      toast.success("Edificio actualizado");
    } else {
      add(form);
      toast.success("Edificio creado");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Edificios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ownerBuildings.length} en tu portafolio
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditing(null);
                setForm(buildEmpty());
              }}
              className="bg-gradient-warm"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo edificio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar edificio" : "Nuevo edificio"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
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

      <div className="grid gap-4 md:grid-cols-2">
        {ownerBuildings.map((b) => {
          const bUnits = units.filter((u) => u.buildingId === b.id);
          const available = bUnits.filter((u) => u.status === "available").length;
          const rented = bUnits.filter((u) => u.status === "rented").length;
          const maintenance = bUnits.filter((u) => u.status === "maintenance").length;
          return (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">{b.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {b.address} · {b.city}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(b);
                      setForm({
                        name: b.name,
                        address: b.address,
                        city: b.city,
                        ownerId: b.ownerId,
                        amenityIds: b.amenityIds,
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const r = del(b.id);
                      if (!r.ok) toast.error(r.reason);
                      else toast.success("Edificio eliminado");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <DoorOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{bUnits.length}</span>
                <span className="text-muted-foreground">unidades</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-success/30 text-success">
                  {available} disponibles
                </Badge>
                <Badge variant="outline">{rented} alquiladas</Badge>
                <Badge variant="outline" className="border-warning/30 text-warning-foreground">
                  {maintenance} mantenimiento
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
