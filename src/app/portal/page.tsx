import { getUserContext } from "@/lib/auth/get-user-context";

export default async function PortalPage() {
  const user = await getUserContext();
  console.log("Logged in user:", user);

  return <h1>Portal</h1>;
}