import type { User } from "../types";
import type { AuthResponseDto, UserDto } from "./dto/auth";
import { apiRequest, ENDPOINTS } from "./endpoints";
import { authSession, rememberedAccount } from "./session-storage";

const mapUser = (user: UserDto): User => ({ id: user.id, name: user.full_name, email: user.email });

/** POST /api/v1/auth/login */
export async function signIn(email: string, password: string): Promise<User> {
  const response = await apiRequest<AuthResponseDto>(ENDPOINTS.signIn, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  authSession.setToken(response.access_token);
  rememberedAccount.setEmail(response.user.email);
  return mapUser(response.user);
}

/** POST /api/v1/auth/register */
export async function signUp(name: string, email: string, password: string): Promise<User> {
  const response = await apiRequest<AuthResponseDto>(ENDPOINTS.signUp, {
    method: "POST",
    body: JSON.stringify({ full_name: name, email, password }),
  });
  authSession.setToken(response.access_token);
  rememberedAccount.setEmail(response.user.email);
  return mapUser(response.user);
}

export async function getCurrentUser(): Promise<User> {
  return mapUser(await apiRequest<UserDto>(ENDPOINTS.currentUser));
}

export function signOut(): void {
  authSession.clear();
}

export function hasAuthToken(): boolean {
  return Boolean(authSession.getToken());
}
