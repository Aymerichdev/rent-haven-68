import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/amenities")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const buildings = useAppStore((s) => s.buildings.filter((b) => b.ownerId === user?.id));
  const amenities = useAppStore((s) =>
    s.amenities.filter((a) => buildings.some((b) => b.id === a.buildingId)),
  );
  const add = useAppStore((s) => s.addAmenity);
  const del = useAppStore((s) => s.deleteAmenity);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    icon: "🏊",
    buildingId: buildings[0]?.id ?? "",
    bookable: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Amenidades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Servicios disponibles en tus edificios
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-warm">
              <Plus className="mr-2 h-4 w-4" /> Nueva amenidad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva amenidad</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Icono (emoji)</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div>
                <Label>Edificio</Label>
                <Select value={form.buildingId} onValueChange={(v) => setForm({ ...form, buildingId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-gradient-warm"
                onClick={() => {
                  if (!form.name || !form.buildingId) return toast.error("Completa los campos");
                  add(form);
                  toast.success("Amenidad agregada");
                  setOpen(false);
                }}
              >
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {amenities.map((a) => {
          const b = buildings.find((x) => x.id === a.buildingId);
          return (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
                  {a.icon}
                </span>
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{b?.name}</div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  del(a.id);
                  toast.success("Eliminada");
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
