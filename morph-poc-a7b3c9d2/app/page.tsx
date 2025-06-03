import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the first available resource page
  redirect("/server/hubspot/connection");
}
