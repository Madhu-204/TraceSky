export type UserRole = 'Farmer' | 'Traveler' | 'Officer' | 'General';
export type SubscriptionTier = 'Free Account' | 'Premium Intelligence' | 'Enterprise Node';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: SubscriptionTier;
  locationDefault?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}