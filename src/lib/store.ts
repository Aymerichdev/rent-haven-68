/**
 * Store híbrida: Zustand expone arrays sincrónicos (compat con toda la UI)
 * pero los datos vienen de Supabase y se refrescan tras cada mutación.
 *
 * Autenticación, CRUD, storage y RLS reales. El single source of truth es
 * Postgres; Zustand es solo la cache hidratada para los selectores síncronos.
 */
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type {
  User,
  Building,
  Unit,
  Amenity,
  Meter,
  RentalRequest,
  AmenityBooking,
  Contract,
  Payment,
  Role,
  AmenitySchedule,
} from "./types";

export type DeleteResult = { ok: true } | { ok: false; reason: string };

// ============= mappers DB <-> domain =============

type DbProfile = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "owner" | "tenant";
  avatar: string | null;
  created_at: string;
};
const mapProfile = (p: DbProfile): User => ({
  id: p.id,
  name: p.name ?? "",
  email: p.email,
  role: p.role,
  avatar: p.avatar ?? undefined,
  password: "",
  createdAt: p.created_at?.slice(0, 10) ?? "",
});

type DbBuilding = {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  description: string | null;
  images: string[] | null;
};
const mapBuilding = (b: DbBuilding, amenityIds: string[]): Building => ({
  id: b.id,
  ownerId: b.owner_id,
  name: b.name,
  address: b.address,
  city: b.city,
  description: b.description ?? undefined,
  images: b.images ?? [],
  amenityIds,
});

type DbAmenity = {
  id: string;
  building_id: string;
  name: string;
  icon: string;
  bookable: boolean;
  description: string | null;
  photo_url: string | null;
  capacity: number | null;
  schedule: unknown;
};
const mapAmenity = (a: DbAmenity): Amenity => ({
  id: a.id,
  buildingId: a.building_id,
  name: a.name,
  icon: a.icon ?? "",
  bookable: !!a.bookable,
  description: a.description ?? undefined,
  photoUrl: a.photo_url ?? undefined,
  capacity: a.capacity ?? undefined,
  schedule: (a.schedule as AmenitySchedule | null) ?? undefined,
});

type DbUnit = {
  id: string;
  building_id: string | null;
  owner_id: string;
  number: string;
  title: string;
  description: string;
  type: "apartment" | "house" | "studio";
  images: string[] | null;
  bedrooms: number;
  bathrooms: number;
  area: number;
  rent: number;
  status: "available" | "rented" | "maintenance";
  tenant_id: string | null;
  featured: boolean;
  address_override: string | null;
  city_override: string | null;
};
const mapUnit = (u: DbUnit): Unit => ({
  id: u.id,
  buildingId: u.building_id ?? undefined,
  ownerId: u.owner_id,
  number: u.number,
  title: u.title,
  description: u.description,
  type: u.type,
  images: u.images ?? [],
  bedrooms: u.bedrooms,
  bathrooms: u.bathrooms,
  area: Number(u.area),
  rent: Number(u.rent),
  status: u.status,
  tenantId: u.tenant_id ?? undefined,
  featured: u.featured,
  addressOverride: u.address_override ?? undefined,
  cityOverride: u.city_override ?? undefined,
});

type DbMeter = { id: string; unit_id: string; type: Meter["type"]; reading: number; date: string };
const mapMeter = (m: DbMeter): Meter => ({
  id: m.id,
  unitId: m.unit_id,
  type: m.type,
  reading: Number(m.reading),
  date: m.date,
});

type DbRequest = {
  id: string;
  unit_id: string;
  tenant_id: string;
  owner_id: string;
  phone: string;
  message: string;
  status: RentalRequest["status"];
  owner_response: string | null;
  created_at: string;
  updated_at: string | null;
};
const mapRequest = (r: DbRequest): RentalRequest => ({
  id: r.id,
  unitId: r.unit_id,
  tenantId: r.tenant_id,
  ownerId: r.owner_id,
  phone: r.phone,
  message: r.message,
  status: r.status,
  ownerResponse: r.owner_response ?? undefined,
  createdAt: r.created_at?.slice(0, 10) ?? "",
  updatedAt: r.updated_at?.slice(0, 10) ?? undefined,
});

type DbBooking = {
  id: string;
  amenity_id: string;
  tenant_id: string;
  owner_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  owner_note: string | null;
  status: AmenityBooking["status"];
};
const mapBooking = (b: DbBooking): AmenityBooking => ({
  id: b.id,
  amenityId: b.amenity_id,
  tenantId: b.tenant_id,
  ownerId: b.owner_id,
  date: b.date,
  startTime: b.start_time?.slice(0, 5),
  endTime: b.end_time?.slice(0, 5),
  notes: b.notes ?? undefined,
  ownerNote: b.owner_note ?? undefined,
  status: b.status,
});

type DbContract = {
  id: string;
  unit_id: string;
  tenant_id: string | null;
  owner_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit: number;
  status: Contract["status"];
};
const mapContract = (c: DbContract): Contract => ({
  id: c.id,
  unitId: c.unit_id,
  tenantId: c.tenant_id ?? "",
  ownerId: c.owner_id,
  startDate: c.start_date,
  endDate: c.end_date,
  monthlyRent: Number(c.monthly_rent),
  deposit: Number(c.deposit),
  status: c.status,
});

type DbPayment = {
  id: string;
  contract_id: string;
  tenant_id: string;
  month: string;
  amount: number;
  utilities: number;
  status: Payment["status"];
  paid_at: string | null;
  receipt_url: string | null;
  receipt_name: string | null;
  receipt_type: string | null;
  receipt_uploaded_at: string | null;
  owner_note: string | null;
  reviewed_at: string | null;
};
const mapPayment = (p: DbPayment): Payment => ({
  id: p.id,
  contractId: p.contract_id,
  tenantId: p.tenant_id,
  month: p.month,
  amount: Number(p.amount),
  utilities: Number(p.utilities),
  status: p.status,
  paidAt: p.paid_at ?? undefined,
  receiptDataUrl: p.receipt_url ?? undefined,
  receiptName: p.receipt_name ?? undefined,
  receiptType: p.receipt_type ?? undefined,
  receiptUploadedAt: p.receipt_uploaded_at?.slice(0, 10) ?? undefined,
  ownerNote: p.owner_note ?? undefined,
  reviewedAt: p.reviewed_at?.slice(0, 10) ?? undefined,
});

// ============= state =============

interface AppState {
  currentUser: User | null;
  users: User[];
  buildings: Building[];
  units: Unit[];
  amenities: Amenity[];
  meters: Meter[];
  requests: RentalRequest[];
  bookings: AmenityBooking[];
  contracts: Contract[];
  payments: Payment[];
  hydrated: boolean;

  // auth
  login: (email: string, password: string) => Promise<User | null>;
  register: (data: { name: string; email: string; password: string; role: "owner" | "tenant" }) => Promise<User | null>;
  logout: () => Promise<void>;
  changePassword: (oldPwd: string, newPwd: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;

  // hydration
  hydrate: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // users
  addUser: (u: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // buildings
  addBuilding: (b: Omit<Building, "id">) => string;
  updateBuilding: (id: string, patch: Partial<Building>) => void;
  deleteBuilding: (id: string) => DeleteResult;

  // units
  addUnit: (u: Omit<Unit, "id">) => DeleteResult;
  updateUnit: (id: string, patch: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;

  // amenities
  addAmenity: (a: Omit<Amenity, "id">) => void;
  updateAmenity: (id: string, patch: Partial<Amenity>) => void;
  deleteAmenity: (id: string) => void;

  // meters
  addMeter: (m: Omit<Meter, "id">) => void;
  deleteMeter: (id: string) => void;

  // requests / bookings
  createRentalRequest: (
    r: Omit<RentalRequest, "id" | "createdAt" | "status" | "ownerResponse" | "updatedAt">,
  ) => void;
  setRequestStatus: (id: string, status: RentalRequest["status"], ownerResponse?: string) => void;
  createBooking: (b: Omit<AmenityBooking, "id" | "status">) => void;
  setBookingStatus: (id: string, status: AmenityBooking["status"], ownerNote?: string) => void;

  // payments
  submitPaymentReceipt: (id: string, file: File) => Promise<void>;
  approvePayment: (id: string, ownerNote?: string) => void;
  rejectPayment: (id: string, ownerNote: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;
const buildingPatchToDb = (patch: Partial<Building>): AnyRow => {
  const out: AnyRow = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.address !== undefined) out.address = patch.address;
  if (patch.city !== undefined) out.city = patch.city;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.images !== undefined) out.images = patch.images;
  if (patch.ownerId !== undefined) out.owner_id = patch.ownerId;
  return out;
};
const unitPatchToDb = (patch: Partial<Unit>): AnyRow => {
  const out: AnyRow = {};
  const map: Record<string, string> = {
    buildingId: "building_id",
    ownerId: "owner_id",
    tenantId: "tenant_id",
    addressOverride: "address_override",
    cityOverride: "city_override",
  };
  const direct = ["number", "title", "description", "type", "images", "bedrooms", "bathrooms", "area", "rent", "status", "featured"];
  for (const [k, v] of Object.entries(patch)) {
    if (direct.includes(k)) out[k] = v;
    else if (map[k]) out[map[k]] = v ?? null;
  }
  return out;
};
const amenityPatchToDb = (patch: Partial<Amenity>): AnyRow => {
  const out: AnyRow = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.icon !== undefined) out.icon = patch.icon;
  if (patch.bookable !== undefined) out.bookable = patch.bookable;
  if (patch.description !== undefined) out.description = patch.description ?? null;
  if (patch.photoUrl !== undefined) out.photo_url = patch.photoUrl ?? null;
  if (patch.capacity !== undefined) out.capacity = patch.capacity ?? null;
  if (patch.schedule !== undefined) out.schedule = patch.schedule ?? null;
  if (patch.buildingId !== undefined) out.building_id = patch.buildingId;
  return out;
};

export const useAppStore = create<AppState>()((set, get) => {
  // ---- private helpers ----
  const loadProfileFor = async (userId: string): Promise<User | null> => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return data ? mapProfile(data as DbProfile) : null;
  };

  const refreshUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    if (data) set({ users: (data as DbProfile[]).map(mapProfile) });
  };
  const refreshBuildings = async () => {
    const [{ data: bs }, { data: ams }] = await Promise.all([
      supabase.from("buildings").select("*").order("name"),
      supabase.from("amenities").select("*"),
    ]);
    const amenities = (ams ?? []) as DbAmenity[];
    const buildings = ((bs ?? []) as DbBuilding[]).map((b) =>
      mapBuilding(
        b,
        amenities.filter((a) => a.building_id === b.id).map((a) => a.id),
      ),
    );
    set({ buildings, amenities: amenities.map(mapAmenity) });
  };
  const refreshUnits = async () => {
    const { data } = await supabase.from("units").select("*").order("title");
    if (data) set({ units: (data as DbUnit[]).map(mapUnit) });
  };
  const refreshMeters = async () => {
    const { data } = await supabase.from("meters").select("*").order("date", { ascending: false });
    if (data) set({ meters: (data as DbMeter[]).map(mapMeter) });
  };
  const refreshRequests = async () => {
    const { data } = await supabase.from("rental_requests").select("*").order("created_at", { ascending: false });
    if (data) set({ requests: (data as DbRequest[]).map(mapRequest) });
  };
  const refreshBookings = async () => {
    const { data } = await supabase.from("amenity_bookings").select("*").order("date", { ascending: false });
    if (data) set({ bookings: (data as DbBooking[]).map(mapBooking) });
  };
  const refreshContracts = async () => {
    const { data } = await supabase.from("contracts").select("*").order("start_date", { ascending: false });
    if (data) set({ contracts: (data as DbContract[]).map(mapContract) });
  };
  const refreshPayments = async () => {
    const { data } = await supabase.from("payments").select("*").order("month", { ascending: false });
    if (data) set({ payments: (data as DbPayment[]).map(mapPayment) });
  };

  const refreshAll = async () => {
    await Promise.all([
      refreshUsers(),
      refreshBuildings(),
      refreshUnits(),
      refreshMeters(),
      refreshRequests(),
      refreshBookings(),
      refreshContracts(),
      refreshPayments(),
    ]);
    set({ hydrated: true });
  };

  return {
    currentUser: null,
    users: [],
    buildings: [],
    units: [],
    amenities: [],
    meters: [],
    requests: [],
    bookings: [],
    contracts: [],
    payments: [],
    hydrated: false,

    // ---------- auth ----------
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return null;
      const profile = await loadProfileFor(data.user.id);
      if (profile) set({ currentUser: profile });
      void refreshAll();
      return profile;
    },
    register: async (data) => {
      const { data: res, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          data: { name: data.name, role: data.role },
        },
      });
      if (error || !res.user) return null;
      // Make sure profile has the right role/name (trigger defaults to tenant)
      await supabase.from("profiles").upsert({
        id: res.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
      });
      const profile = await loadProfileFor(res.user.id);
      if (profile) set({ currentUser: profile });
      void refreshAll();
      return profile;
    },
    logout: async () => {
      await supabase.auth.signOut();
      set({
        currentUser: null,
        users: [],
        buildings: [],
        units: [],
        amenities: [],
        meters: [],
        requests: [],
        bookings: [],
        contracts: [],
        payments: [],
        hydrated: false,
      });
    },
    changePassword: async (_oldPwd, newPwd) => {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      return !error;
    },
    resetPassword: async (email) => {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/change-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      return !error;
    },

    hydrate: async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (userId) {
        const profile = await loadProfileFor(userId);
        if (profile) set({ currentUser: profile });
      }
      await refreshAll();
    },
    refreshAll,

    // ---------- users (admin) ----------
    addUser: () => {
      // Crear usuarios requiere service-role; desde el panel admin se gestiona por signup público.
      // No-op aquí; las altas reales pasan por register().
    },
    updateUser: (id, patch) => {
      const row: AnyRow = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.role !== undefined && (patch.role as string) !== "public") row.role = patch.role;
      if (patch.avatar !== undefined) row.avatar = patch.avatar ?? null;
      void supabase.from("profiles").update(row).eq("id", id).then(() => refreshUsers());
    },
    deleteUser: (id) => {
      void supabase.from("profiles").delete().eq("id", id).then(() => refreshUsers());
    },

    // ---------- buildings ----------
    addBuilding: (b) => {
      const tempId = `tmp_${Math.random().toString(36).slice(2)}`;
      set((s) => ({ buildings: [...s.buildings, { ...b, id: tempId }] }));
      void supabase
        .from("buildings")
        .insert({
          owner_id: b.ownerId,
          name: b.name,
          address: b.address,
          city: b.city,
          description: b.description ?? null,
          images: b.images ?? [],
        })
        .select()
        .single()
        .then(async ({ data }) => {
          if (data && b.amenityIds?.length) {
            // No usado en la práctica; las amenidades se crean por separado en owner.amenities.
          }
          await refreshBuildings();
        });
      return tempId;
    },
    updateBuilding: (id, patch) => {
      set((s) => ({ buildings: s.buildings.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
      const row = buildingPatchToDb(patch);
      if (Object.keys(row).length) {
        void supabase.from("buildings").update(row).eq("id", id).then(() => refreshBuildings());
      }
    },
    deleteBuilding: (id) => {
      const unitsInBuilding = get().units.filter((u) => u.buildingId === id);
      if (unitsInBuilding.length > 0) {
        return { ok: false, reason: `Tiene ${unitsInBuilding.length} unidad(es). Bórralas o muévelas primero.` };
      }
      set((s) => ({
        buildings: s.buildings.filter((b) => b.id !== id),
        amenities: s.amenities.filter((a) => a.buildingId !== id),
      }));
      void supabase.from("buildings").delete().eq("id", id).then(() => refreshBuildings());
      return { ok: true };
    },

    // ---------- units ----------
    addUnit: (u) => {
      if (u.buildingId) {
        const building = get().buildings.find((b) => b.id === u.buildingId);
        if (!building) return { ok: false, reason: "Edificio inválido" };
        if (building.ownerId !== u.ownerId)
          return { ok: false, reason: "El owner debe coincidir con el del edificio" };
        const dup = get().units.some(
          (x) => x.buildingId === u.buildingId && x.number.trim() === u.number.trim(),
        );
        if (dup) return { ok: false, reason: "Ya existe una unidad con ese número en el edificio" };
      } else {
        if (!u.addressOverride?.trim() || !u.cityOverride?.trim())
          return { ok: false, reason: "Las unidades sin edificio requieren dirección y ciudad" };
      }
      void supabase
        .from("units")
        .insert({
          building_id: u.buildingId ?? null,
          owner_id: u.ownerId,
          number: u.number,
          title: u.title,
          description: u.description,
          type: u.type,
          images: u.images ?? [],
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          area: u.area,
          rent: u.rent,
          status: u.status,
          tenant_id: u.tenantId ?? null,
          featured: u.featured ?? false,
          address_override: u.addressOverride ?? null,
          city_override: u.cityOverride ?? null,
        })
        .then(() => refreshUnits());
      return { ok: true };
    },
    updateUnit: (id, patch) => {
      set((s) => ({ units: s.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
      const row = unitPatchToDb(patch);
      if (Object.keys(row).length) {
        void supabase.from("units").update(row).eq("id", id).then(() => refreshUnits());
      }
    },
    deleteUnit: (id) => {
      set((s) => ({ units: s.units.filter((u) => u.id !== id) }));
      void supabase.from("units").delete().eq("id", id).then(() => refreshUnits());
    },

    // ---------- amenities ----------
    addAmenity: (a) => {
      void supabase
        .from("amenities")
        .insert({
          building_id: a.buildingId,
          name: a.name,
          icon: a.icon ?? "",
          bookable: !!a.bookable,
          description: a.description ?? null,
          photo_url: a.photoUrl ?? null,
          capacity: a.capacity ?? null,
          schedule: (a.schedule ?? null) as unknown as never,
        })
        .then(() => refreshBuildings());
    },
    updateAmenity: (id, patch) => {
      set((s) => ({ amenities: s.amenities.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
      const row = amenityPatchToDb(patch);
      if (Object.keys(row).length) {
        void supabase.from("amenities").update(row).eq("id", id).then(() => refreshBuildings());
      }
    },
    deleteAmenity: (id) => {
      set((s) => ({ amenities: s.amenities.filter((a) => a.id !== id) }));
      void supabase.from("amenities").delete().eq("id", id).then(() => refreshBuildings());
    },

    // ---------- meters ----------
    addMeter: (m) => {
      void supabase
        .from("meters")
        .insert({ unit_id: m.unitId, type: m.type, reading: m.reading, date: m.date })
        .then(() => refreshMeters());
    },
    deleteMeter: (id) => {
      set((s) => ({ meters: s.meters.filter((m) => m.id !== id) }));
      void supabase.from("meters").delete().eq("id", id).then(() => refreshMeters());
    },

    // ---------- requests ----------
    createRentalRequest: (r) => {
      void supabase
        .from("rental_requests")
        .insert({
          unit_id: r.unitId,
          tenant_id: r.tenantId,
          owner_id: r.ownerId,
          phone: r.phone,
          message: r.message,
          status: "pending",
        })
        .then(() => refreshRequests());
    },
    setRequestStatus: (id, status, ownerResponse) => {
      set((s) => ({
        requests: s.requests.map((r) =>
          r.id === id
            ? { ...r, status, ownerResponse: ownerResponse ?? r.ownerResponse, updatedAt: new Date().toISOString().slice(0, 10) }
            : r,
        ),
      }));
      void supabase
        .from("rental_requests")
        .update({
          status,
          owner_response: ownerResponse ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .then(() => refreshRequests());
    },

    // ---------- bookings ----------
    createBooking: (b) => {
      void supabase
        .from("amenity_bookings")
        .insert({
          amenity_id: b.amenityId,
          tenant_id: b.tenantId,
          owner_id: b.ownerId,
          date: b.date,
          start_time: b.startTime,
          end_time: b.endTime,
          notes: b.notes ?? null,
          status: "pending",
        })
        .then(() => refreshBookings());
    },
    setBookingStatus: (id, status, ownerNote) => {
      set((s) => ({
        bookings: s.bookings.map((b) =>
          b.id === id ? { ...b, status, ownerNote: ownerNote?.trim() ? ownerNote.trim() : b.ownerNote } : b,
        ),
      }));
      void supabase
        .from("amenity_bookings")
        .update({ status, owner_note: ownerNote?.trim() ? ownerNote.trim() : null })
        .eq("id", id)
        .then(() => refreshBookings());
    },

    // ---------- payments ----------
    submitPaymentReceipt: async (id, file) => {
      const user = get().currentUser;
      if (!user) return;
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("receipts")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) {
        throw upErr;
      }
      const { data: pub } = supabase.storage.from("receipts").getPublicUrl(path);
      await supabase
        .from("payments")
        .update({
          status: "validating",
          receipt_url: pub.publicUrl,
          receipt_name: file.name,
          receipt_type: file.type,
          receipt_uploaded_at: new Date().toISOString(),
          owner_note: null,
          reviewed_at: null,
        })
        .eq("id", id);
      await refreshPayments();
    },
    approvePayment: (id, ownerNote) => {
      set((s) => ({
        payments: s.payments.map((p) =>
          p.id === id
            ? {
                ...p,
                status: "paid",
                paidAt: new Date().toISOString().slice(0, 10),
                reviewedAt: new Date().toISOString().slice(0, 10),
                ownerNote: ownerNote?.trim() ? ownerNote.trim() : p.ownerNote,
              }
            : p,
        ),
      }));
      void supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString().slice(0, 10),
          reviewed_at: new Date().toISOString(),
          owner_note: ownerNote?.trim() ? ownerNote.trim() : null,
        })
        .eq("id", id)
        .then(() => refreshPayments());
    },
    rejectPayment: (id, ownerNote) => {
      set((s) => ({
        payments: s.payments.map((p) =>
          p.id === id
            ? { ...p, status: "rejected", reviewedAt: new Date().toISOString().slice(0, 10), ownerNote: ownerNote.trim() }
            : p,
        ),
      }));
      void supabase
        .from("payments")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          owner_note: ownerNote.trim(),
        })
        .eq("id", id)
        .then(() => refreshPayments());
    },
  };
});

export const getRole = (u: User | null): Role => u?.role ?? "public";

export const getUnitAddress = (unit: Unit, building: Building | undefined): string =>
  unit.addressOverride ?? building?.address ?? "";

export const getUnitCity = (unit: Unit, building: Building | undefined): string =>
  unit.cityOverride ?? building?.city ?? "";

// ============= one-time bootstrap =============
// Hidrata al cargar la app y se vuelve a sincronizar ante cambios de sesión.
if (typeof window !== "undefined") {
  // initial load
  void useAppStore.getState().hydrate();

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      // logout -> limpiar
      const s = useAppStore.getState();
      if (s.currentUser) {
        useAppStore.setState({
          currentUser: null,
          users: [],
          buildings: [],
          units: [],
          amenities: [],
          meters: [],
          requests: [],
          bookings: [],
          contracts: [],
          payments: [],
          hydrated: false,
        });
        // re-cargar datos públicos
        void useAppStore.getState().refreshAll();
      }
    } else {
      // login / refresh -> recargar
      void useAppStore.getState().hydrate();
    }
  });
}
