import { UserButton } from "@clerk/nextjs";

export default function AccesoDenegado() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-3xl font-black text-[#1d2d50] mb-4">Acceso Restringido</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Esta plataforma es de uso exclusivo para Administradores. Por favor, utiliza la aplicación móvil de GM Express para gestionar tus pedidos.
      </p>
      
      {/* 🔥 Simplemente dejamos el botón sin la propiedad */}
      <UserButton /> 
      
    </div>
  );
}