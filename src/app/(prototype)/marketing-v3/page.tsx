import { redirect } from "next/navigation";

// The V3 landing page prototype is now the home page
export default function MarketingV3Page() {
  redirect("/");
}
