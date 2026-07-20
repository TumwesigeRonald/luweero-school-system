import { redirect } from "next/navigation";

// Kept for backwards compatibility. Everyone now uses /login.
export default function StudentLoginRedirect() {
  redirect("/login");
}
