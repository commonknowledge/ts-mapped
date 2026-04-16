import { JWT_LIFETIME_SECONDS } from "@/constants";

export async function logout() {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch {
    // Server unavailable so JWT cookie may not be removed - set client side LoggedOut cookie
    document.cookie = `LoggedOut=1; path=/; SameSite=lax; max-age=${JWT_LIFETIME_SECONDS}`;
  }
  window.location.href = "/";
}
