import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/tenant/amenities")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const contracts = useAppStore((s) => s.contracts);
  const units = useAppStore((s) => s.units);
  const buildings = useAppStore((s) => s.buildings);
  const amenities = useAppStore((s) => s.amenities);
  const myBookings = useAppStore((s) => s.bookings);

  const tenantContracts = contracts.filter((c) => c.tenantId === user?.id);
  const tenantBookings = myBookings.filter((b) => b.tenantId === user?.id);
  const create = useAppStore((s) => s.createBooking);

  const myBuildingIds = tenantContracts
    .map((c) => units.find((u) => u.id === c.unitId)?.buildingId)
    .filter((id): id is string => Boolean(id));
  const available = amenities.filter((a) => myBuildingIds.includes(a.buildingId) && a.bookable);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("18:00");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Reservar amenidades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Disfruta de los servicios incluidos en tu edificio.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-2">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Hora</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground sm:col-span-3">
            No hay amenidades disponibles en tus edificios.
          </div>
        )}
        {available.map((a) => {
          const b = buildings.find((x) => x.id === a.buildingId);
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
                {a.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{a.name}</h3>
              <p className="text-xs text-muted-foreground">{b?.name}</p>
              <Button
                className="mt-4 w-full bg-gradient-warm"
                onClick={() => {
                  create({
                    amenityId: a.id,
                    tenantId: user!.id,
                    ownerId: b!.ownerId,
                    date,
                    time,
                  });
                  toast.success("Reserva enviada");
                }}
              >
                Reservar
              </Button>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold">Mis reservas</h2>
        {tenantBookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Aún no has reservado nada.
          </p>
        ) : (
          <div className="space-y-2">
            {tenantBookings.map((b) => {
              const a = amenities.find((x) => x.id === b.amenityId);
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{a?.icon}</span>
                    <div>
                      <div className="font-medium">{a?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.date} a las {b.time}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      b.status === "approved"
                        ? "border-success/30 text-success"
                        : b.status === "rejected"
                          ? "border-destructive/30 text-destructive"
                          : "border-warning/30 text-warning-foreground"
                    }
                  >
                    {b.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
