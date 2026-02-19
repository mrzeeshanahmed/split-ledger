export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenData {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  tokenId: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    emailVerified: boolean;
  };
}

export interface PasswordResetToken {
  userId: string;
  tenantId: string;
  expiresAt: Date;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  last_login_at: Date | null;
  email_verified: boolean;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
