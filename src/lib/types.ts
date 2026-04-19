export type Role = "admin" | "owner" | "tenant" | "public";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, "public">;
  avatar?: string;
  createdAt: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  ownerId: string;
  amenityIds: string[];
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  buildingId: string;
  bookable: boolean;
}

export interface Meter {
  id: string;
  unitId: string;
  type: "water" | "electricity" | "gas";
  reading: number;
  date: string;
}

/**
 * Unit es la entidad alquilable y publicable (la "propiedad" operativa).
 * Pertenece a un Building (obligatorio) y hereda ownerId/city/address de él
 * salvo que se sobrescriba con `addressOverride`.
 */
export interface Unit {
  id: string;
  buildingId: string;
  ownerId: string;
  number: string; // único por building
  title: string;
  description: string;
  type: "apartment" | "house" | "studio";
  images: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  rent: number;
  status: "available" | "rented" | "maintenance";
  tenantId?: string;
  featured?: boolean;
  /** Si está presente, sobrescribe la dirección heredada del building. */
  addressOverride?: string;
}

export interface RentalRequest {
  id: string;
  unitId: string;
  tenantId: string;
  ownerId: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface AmenityBooking {
  id: string;
  amenityId: string;
  tenantId: string;
  ownerId: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
}

export interface Contract {
  id: string;
  unitId: string;
  tenantId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: "active" | "ended";
}

export interface Payment {
  id: string;
  contractId: string;
  tenantId: string;
  month: string; // YYYY-MM
  amount: number;
  utilities: number;
  status: "pending" | "paid" | "overdue" | "validating";
  paidAt?: string;
}
