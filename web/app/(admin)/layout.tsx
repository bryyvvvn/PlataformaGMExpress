import { auth } from "@clerk/nextjs/server";
import { Rol } from "@prisma/client";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import db from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/login");
  }

  const usuarioDB = await db.usuario.findUnique({
    where: { id: userId },
    select: { rol: true },
  });

  if (usuarioDB?.rol !== Rol.ADMIN) {
    redirect("/auth/login?error=no-admin");
  }

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-slate-50">{children}</main>
    </>
  );
}
