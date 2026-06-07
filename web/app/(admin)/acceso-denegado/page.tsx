import { UserButton } from "@clerk/nextjs";

export default function AccesoDenegado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <h1 className="mb-3 text-xl font-semibold text-[#1B2C56]">Acceso Restringido</h1>
      <p className="mb-6 max-w-md text-sm text-slate-600">
        Esta plataforma es de uso exclusivo para Administradores. Por favor, utiliza la aplicación móvil de GM Express para gestionar tus pedidos.
      </p>
      
      {/* 🔥 Simplemente dejamos el botón sin la propiedad */}
      <UserButton /> 
      
    </div>
  );
}