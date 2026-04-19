import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplet, Zap, Flame, CreditCard, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tenant/payments")({
  component: Page,
});

const monthName = (m: string) => {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString("es", { month: "long", year: "numeric" });
};

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const payments = useAppStore((s) => s.payments);
  const tenantPayments = payments.filter((p) => p.tenantId === user?.id);
  const pay = useAppStore((s) => s.payPayment);
  const validate = useAppStore((s) => s.validatePayment);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Pagos mensuales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial y validación de pagos con servicios incluidos.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-warm p-5 text-primary-foreground shadow-elegant">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-background/20 p-3 backdrop-blur">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm opacity-90">Servicios públicos integrados</div>
            <div className="font-display text-xl font-bold">Agua · Electricidad · Gas</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-2.5 py-1">
            <Droplet className="h-3 w-3" /> Agua
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-2.5 py-1">
            <Zap className="h-3 w-3" /> Luz
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-2.5 py-1">
            <Flame className="h-3 w-3" /> Gas
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {tenantPayments
          .slice()
          .sort((a, b) => b.month.localeCompare(a.month))
          .map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display font-semibold capitalize">{monthName(p.month)}</div>
                  <div className="text-xs text-muted-foreground">
                    Renta €{p.amount} + Servicios €{p.utilities}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-display text-lg font-bold">€{p.amount + p.utilities}</div>
                  <StatusBadge status={p.status} />
                </div>
                {p.status === "pending" && (
                  <Button
                    className="bg-gradient-warm"
                    onClick={() => {
                      pay(p.id);
                      toast.success("Pago enviado, esperando validación");
                      setTimeout(() => {
                        validate(p.id);
                        toast.success("Pago validado ✓");
                      }, 1500);
                    }}
                  >
                    Pagar
                  </Button>
                )}
                {p.status === "paid" && (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "paid" | "overdue" | "validating" }) {
  const m = {
    pending: { label: "Pendiente", cls: "border-warning/30 text-warning-foreground bg-warning/10" },
    paid: { label: "Pagado", cls: "border-success/30 text-success bg-success/10" },
    overdue: { label: "Atrasado", cls: "border-destructive/30 text-destructive bg-destructive/10" },
    validating: { label: "Validando…", cls: "border-primary/30 text-primary bg-primary/10" },
  } as const;
  return (
    <Badge variant="outline" className={`mt-1 ${m[status].cls}`}>
      {m[status].label}
    </Badge>
  );
}
