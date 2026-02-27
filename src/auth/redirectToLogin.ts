import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function redirectToLogin(): Promise<never> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";
  redirect(`/login?redirectTo=${encodeURIComponent(pathname)}`);
}
