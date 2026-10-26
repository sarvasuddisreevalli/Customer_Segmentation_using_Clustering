const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}

async function authRequest<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/auth${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Something went wrong. Please try again.");
  }

  return (await response.json()) as T;
}

export async function createAccount(name: string, email: string, password: string) {
  return authRequest<AuthResponse>("/register", { name, email, password });
}

export async function signIn(email: string, password: string) {
  return authRequest<AuthResponse>("/login", { email, password });
}

export async function getCurrentUser(token: string) {
  return authRequest<AuthUser>("/me", undefined, token);
}

export function saveAuthSession(session: AuthResponse) {
  window.localStorage.setItem("segmentiq_token", session.access_token);
  window.localStorage.setItem("segmentiq_user", JSON.stringify(session.user));
}

export function clearAuthSession() {
  window.localStorage.removeItem("segmentiq_token");
  window.localStorage.removeItem("segmentiq_user");
}
