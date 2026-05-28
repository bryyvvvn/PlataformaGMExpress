import React from 'react';

interface LoadingViewProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingView: React.FC<LoadingViewProps> = ({ message = 'Cargando...', fullScreen = true }) => (
  <div className={`${fullScreen ? 'min-h-screen flex items-center justify-center bg-white' : 'flex items-center justify-center'} px-6 py-10`}>
    <div className="flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-100 border-t-[#70a344] rounded-full animate-spin mb-4" />
      {message ? (
        <p className="text-[#70a344] font-black text-[11px] uppercase tracking-widest text-center">
          {message}
        </p>
      ) : null}
    </div>
  </div>
);

export default LoadingView;
