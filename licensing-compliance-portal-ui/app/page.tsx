import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { roleHomePath } from "@/lib/auth-shared";

export default async function Home() {
  const session = await getServerSession();
  redirect(session ? roleHomePath(session.role) : "/login");
}
