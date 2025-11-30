export type UserRole = 'buyer' | 'seller';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  company_name?: string;
  logo_url?: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price_usd: number;
  category: string;
  image_url: string;
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_details: CartItem[];
  total_amount_usd: number;
  payment_ref_last4: string;
  payment_proof_url?: string;
  delivery_needed: boolean;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  buyer_profile?: Profile; // Joined
}

export interface AuthState {
  session: any | null;
  profile: Profile | null;
  loading: boolean;
}