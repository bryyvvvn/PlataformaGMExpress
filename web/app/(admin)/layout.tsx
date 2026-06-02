import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import db from '@/lib/db'; 
import { Sidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth();

  // Si no está logueado, lo mandamos al login
  if (!userId) {
    redirect('/auth/login');
  }

  // 🔥 EL CAMBIO ESTÁ AQUÍ: Buscamos por 'id' en lugar de 'clerkId'
  const usuarioDB = await db.usuario.findUnique({
    where: { id: userId }, 
    select: { rol: true }
  });

  // 🚨 Si NO es administrador, lo expulsamos del panel
  if (usuarioDB?.rol !== 'ADMIN') {
    redirect('/acceso-denegado'); 
  }

  // Si es ADMIN, lo dejamos ver el contenido
  return (
    <>
      <Sidebar />
      <main className="ml-64">{children}</main>
    </>
  );
}