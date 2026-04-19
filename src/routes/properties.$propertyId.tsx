import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { PublicNavbar, Footer } from "@/components/site/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bed, Bath, Square, MapPin, Building2, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/properties/$propertyId")({
  component: Page,
});

function Page() {
  const { propertyId } = Route.useParams();
  const property = useAppStore((s) => s.properties.find((p) => p.id === propertyId));
  const buildings = useAppStore((s) => s.buildings);
  const allAmenities = useAppStore((s) => s.amenities);
  const user = useAppStore((s) => s.currentUser);
  const createReq = useAppStore((s) => s.createRentalRequest);
  const nav = useNavigate();
  const [msg, setMsg] = useState("");

  const building = buildings.find((b) => b.id === property?.buildingId);
  const amenities = allAmenities.filter((a) => a.buildingId === building?.id);

  if (!property) {
    return (
      <div className="min-h-screen">
        <PublicNavbar />
        <div className="mx-auto max-w-3xl p-12 text-center">
          <h2 className="font-display text-2xl font-bold">Propiedad no encontrada</h2>
          <Button asChild className="mt-4">
            <Link to="/properties">Volver al listado</Link>
          </Button>
        </div>
      </div>
    );
  }

  const submit = () => {
    if (!user) {
      toast.error("Inicia sesión para solicitar el alquiler");
      nav({ to: "/login" });
      return;
    }
    if (user.role !== "tenant") {
      toast.error("Solo inquilinos pueden solicitar alquileres");
      return;
    }
    createReq({
      propertyId: property.id,
      tenantId: user.id,
      ownerId: property.ownerId,
      message: msg || "Estoy interesado/a en esta propiedad.",
    });
    setMsg("");
    toast.success("Solicitud enviada al propietario");
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{property.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {property.address} · {property.city}
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
          <img
            src={property.images[0]}
            alt={property.title}
            className="h-full w-full object-cover sm:col-span-2 sm:row-span-2"
          />
          {property.images.slice(1, 5).map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              loading="lazy"
              className="aspect-[4/3] h-full w-full object-cover"
            />
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-6 border-b border-border pb-6">
              <Stat icon={<Bed className="h-4 w-4" />} label="Habitaciones" value={property.bedrooms} />
              <Stat icon={<Bath className="h-4 w-4" />} label="Baños" value={property.bathrooms} />
              <Stat icon={<Square className="h-4 w-4" />} label="Área" value={`${property.area} m²`} />
              {building && (
                <Stat icon={<Building2 className="h-4 w-4" />} label="Edificio" value={building.name} />
              )}
            </div>

            <h2 className="mt-8 font-display text-xl font-bold">Sobre esta propiedad</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{property.description}</p>

            {amenities.length > 0 && (
              <>
                <h2 className="mt-10 font-display text-xl font-bold">Amenidades del edificio</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {amenities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <span className="text-xl">{a.icon}</span>
                      <span className="text-sm font-medium">{a.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold">
                  €{property.price.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Incluye gestión digital de pagos</p>

              <Textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Hola, me gustaría más información..."
                className="mt-5 min-h-24"
              />
              <Button onClick={submit} className="mt-3 w-full bg-gradient-warm">
                Solicitar alquiler
              </Button>
              {!user && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Inicia sesión
                  </Link>{" "}
                  para enviar tu solicitud
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold">{value}</div>
    </div>
  );
}
