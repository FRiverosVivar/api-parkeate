export interface PaykuCreateClientInput {
  email: string;
  name: string;
  rut: string;
  phone: string;
  address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
}
