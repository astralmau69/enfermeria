import { User } from './user.model';

export interface AuthResponse {
    token: string;
    refresh_token?: string;
    user: User;
}
