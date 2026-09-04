const ACCESS_TOKEN_KEY = "autoassist.auth.access-token";
const LAST_EMAIL_KEY = "autoassist.auth.last-email";

export const authSession = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setToken(token: string): void {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

export const rememberedAccount = {
  getEmail(): string {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(LAST_EMAIL_KEY) ?? "";
  },
  setEmail(email: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase());
  },
};
