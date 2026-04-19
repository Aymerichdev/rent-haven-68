import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  Property,
  Building,
  Unit,
  Amenity,
  Meter,
  RentalRequest,
  AmenityBooking,
  Contract,
  Payment,
  Role,
} from "./types";
import {
  seedUsers,
  seedProperties,
  seedBuildings,
  seedUnits,
  seedAmenities,
  seedMeters,
  seedRequests,
  seedBookings,
  seedContracts,
  seedPayments,
} from "./mock-data";

const uid = () => Math.random().toString(36).slice(2, 10);

interface AppState {
  currentUser: User | null;
  users: User[];
  properties: Property[];
  buildings: Building[];
  units: Unit[];
  amenities: Amenity[];
  meters: Meter[];
  requests: RentalRequest[];
  bookings: AmenityBooking[];
  contracts: Contract[];
  payments: Payment[];

  // auth
  login: (email: string, password: string) => User | null;
  register: (data: Omit<User, "id" | "createdAt">) => User;
  logout: () => void;
  changePassword: (oldPwd: string, newPwd: string) => boolean;
  resetPassword: (email: string) => boolean;

  // users (admin)
  addUser: (u: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // properties
  addProperty: (p: Omit<Property, "id">) => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // buildings
  addBuilding: (b: Omit<Building, "id">) => void;
  updateBuilding: (id: string, patch: Partial<Building>) => void;
  deleteBuilding: (id: string) => void;

  // units
  addUnit: (u: Omit<Unit, "id">) => void;
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
  createRentalRequest: (r: Omit<RentalRequest, "id" | "createdAt" | "status">) => void;
  setRequestStatus: (id: string, status: RentalRequest["status"]) => void;
  createBooking: (b: Omit<AmenityBooking, "id" | "status">) => void;
  setBookingStatus: (id: string, status: AmenityBooking["status"]) => void;

  // payments
  payPayment: (id: string) => void;
  validatePayment: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: seedUsers,
      properties: seedProperties,
      buildings: seedBuildings,
      units: seedUnits,
      amenities: seedAmenities,
      meters: seedMeters,
      requests: seedRequests,
      bookings: seedBookings,
      contracts: seedContracts,
      payments: seedPayments,

      login: (email, password) => {
        const u = get().users.find(
          (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password,
        );
        if (u) set({ currentUser: u });
        return u ?? null;
      },
      register: (data) => {
        const u: User = { ...data, id: uid(), createdAt: new Date().toISOString().slice(0, 10) };
        set((s) => ({ users: [...s.users, u], currentUser: u }));
        return u;
      },
      logout: () => set({ currentUser: null }),
      changePassword: (oldPwd, newPwd) => {
        const cu = get().currentUser;
        if (!cu || cu.password !== oldPwd) return false;
        const updated = { ...cu, password: newPwd };
        set((s) => ({
          currentUser: updated,
          users: s.users.map((u) => (u.id === cu.id ? updated : u)),
        }));
        return true;
      },
      resetPassword: (email) => {
        return !!get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      },

      addUser: (u) =>
        set((s) => ({
          users: [
            ...s.users,
            { ...u, id: uid(), createdAt: new Date().toISOString().slice(0, 10) },
          ],
        })),
      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      addProperty: (p) => set((s) => ({ properties: [...s.properties, { ...p, id: uid() }] })),
      updateProperty: (id, patch) =>
        set((s) => ({
          properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProperty: (id) =>
        set((s) => ({ properties: s.properties.filter((p) => p.id !== id) })),

      addBuilding: (b) => set((s) => ({ buildings: [...s.buildings, { ...b, id: uid() }] })),
      updateBuilding: (id, patch) =>
        set((s) => ({
          buildings: s.buildings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      deleteBuilding: (id) => set((s) => ({ buildings: s.buildings.filter((b) => b.id !== id) })),

      addUnit: (u) => set((s) => ({ units: [...s.units, { ...u, id: uid() }] })),
      updateUnit: (id, patch) =>
        set((s) => ({ units: s.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      deleteUnit: (id) => set((s) => ({ units: s.units.filter((u) => u.id !== id) })),

      addAmenity: (a) => set((s) => ({ amenities: [...s.amenities, { ...a, id: uid() }] })),
      updateAmenity: (id, patch) =>
        set((s) => ({
          amenities: s.amenities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      deleteAmenity: (id) => set((s) => ({ amenities: s.amenities.filter((a) => a.id !== id) })),

      addMeter: (m) => set((s) => ({ meters: [...s.meters, { ...m, id: uid() }] })),
      deleteMeter: (id) => set((s) => ({ meters: s.meters.filter((m) => m.id !== id) })),

      createRentalRequest: (r) =>
        set((s) => ({
          requests: [
            ...s.requests,
            {
              ...r,
              id: uid(),
              status: "pending",
              createdAt: new Date().toISOString().slice(0, 10),
            },
          ],
        })),
      setRequestStatus: (id, status) =>
        set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) })),

      createBooking: (b) =>
        set((s) => ({ bookings: [...s.bookings, { ...b, id: uid(), status: "pending" }] })),
      setBookingStatus: (id, status) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) })),

      payPayment: (id) =>
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id ? { ...p, status: "validating" as const } : p,
          ),
        })),
      validatePayment: (id) =>
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id
              ? { ...p, status: "paid" as const, paidAt: new Date().toISOString().slice(0, 10) }
              : p,
          ),
        })),
    }),
    {
      name: "estate-app",
      partialize: (s) => ({ currentUser: s.currentUser }),
    },
  ),
);

export const getRole = (u: User | null): Role => u?.role ?? "public";
