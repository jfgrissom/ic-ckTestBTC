import { AuthClient } from '@dfinity/auth-client';

export interface AuthState {
  authClient: AuthClient | null;
  isAuthenticated: boolean;
  principal: string;
  loading: boolean;
}

export interface AuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export interface LoginScreenProps {
  onLogin: () => Promise<void>;
  loading: boolean;
  authClient: AuthClient | null;
}

export interface UserHeaderProps {
  principal: string;
  onLogout: () => Promise<void>;
}