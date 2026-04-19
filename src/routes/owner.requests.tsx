import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Home, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/requests")({
  component: Page,
});

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const requests = useAppStore((s) => s.requests);
  const bookings = useAppStore((s) => s.bookings);
  const units = useAppStore((s) => s.units);
  const amenities = useAppStore((s) => s.amenities);
  const users = useAppStore((s) => s.users);
  const setReq = useAppStore((s) => s.setRequestStatus);
  const setBook = useAppStore((s) => s.setBookingStatus);

  const ownerRequests = requests.filter((r) => r.ownerId === user?.id);
  const ownerBookings = bookings.filter((b) => b.ownerId === user?.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Solicitudes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aprueba o rechaza solicitudes de alquiler y reservas de amenidades.
        </p>
      </div>

      <section>
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-bold">
          <Home className="h-5 w-5 text-primary" /> Alquileres ({ownerRequests.length})
        </h2>
        {ownerRequests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Sin solicitudes.
          </p>
        ) : (
          <div className="space-y-3">
            {ownerRequests.map((r) => {
              const u = units.find((x) => x.id === r.unitId);
              const tenant = users.find((x) => x.id === r.tenantId);
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    {u && (
                      <img
                        src={u.images[0]}
                        alt=""
                        className="h-16 w-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{u?.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {tenant?.name} · {r.createdAt}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm">{r.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => {
                            setReq(r.id, "approved");
                            toast.success("Aprobada");
                          }}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReq(r.id, "rejected");
                            toast("Rechazada");
                          }}
                        >
                          <X className="mr-1 h-3.5 w-3.5" /> Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="h-5 w-5 text-primary" /> Reservas de amenidades ({ownerBookings.length})
        </h2>
        {ownerBookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Sin reservas.
          </p>
        ) : (
          <div className="space-y-3">
            {ownerBookings.map((b) => {
              const a = amenities.find((x) => x.id === b.amenityId);
              const t = users.find((x) => x.id === b.tenantId);
              return (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {a?.icon} {a?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t?.name} · {b.date} {b.time}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => {
                            setBook(b.id, "approved");
                            toast.success("Aprobada");
                          }}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setBook(b.id, "rejected");
                            toast("Rechazada");
                          }}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { label: "Pendiente", cls: "border-warning/30 text-warning-foreground bg-warning/10" },
    approved: { label: "Aprobada", cls: "border-success/30 text-success bg-success/10" },
    rejected: { label: "Rechazada", cls: "border-destructive/30 text-destructive bg-destructive/10" },
  } as const;
  const m = map[status];
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}
