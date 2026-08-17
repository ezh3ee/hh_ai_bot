export type LoginMode = 'restored' | 'manual';

export interface LoginResult {
  success: boolean;
  mode: LoginMode;
  message?: string;
}
