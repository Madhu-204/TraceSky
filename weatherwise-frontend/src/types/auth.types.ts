export interface User {
  id: string;
  name: string;
  email: string;
  location_default?: string;
  auth_provider?: string;
  theme_accent?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}