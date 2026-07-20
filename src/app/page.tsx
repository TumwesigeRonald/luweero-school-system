import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";
import { getCurrentStudent } from "@/lib/student-auth";

export default async function HomePage() {
  const teacher = await getCurrentTeacher();
  if (teacher) redirect("/dashboard");
  const student = await getCurrentStudent();
  if (student) redirect("/portal");
  redirect("/login");
}
