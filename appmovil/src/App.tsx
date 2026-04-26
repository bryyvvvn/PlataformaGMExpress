import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1b2c56] p-6 overflow-hidden">
          
          <div className="relative -mt-20 mb-2 flex justify-center items-center">
            <img 
              src="/GM Express Logo.png" 
              alt="GM Express Logo" 
              className="h-75 w-auto object-contain" 
            />
          </div>

          <div className="w-full max-w-sm -mt-14 relative z-10">
            <SignIn routing="hash" />
          </div>

          <footer className="mt-8 text-[10px] text-white/40 uppercase tracking-widest">
            Portal de Enlaces GM Express v1.0
          </footer>
        </div>
      </SignedOut>

      <SignedIn>

        
        <header className="flex justify-between items-center p-4 bg-[#1b2c56] text-white shadow-md">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-white tracking-tighter">GM EXPRESS</h1>
          </div>
          <UserButton 
            afterSignOutUrl="/" 
          />
        </header>
        
        <main className="p-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Pedidos Asignados</h2>
            <p className="text-sm text-gray-500 mt-1">Conectando con base de datos Neon...</p>
            
            <div className="mt-6 space-y-4">
              {/* Aquí van los datos de la DB */}
              <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
            </div>
          </div>
        </main>
      </SignedIn>
    </div>
  );
};

export default App;