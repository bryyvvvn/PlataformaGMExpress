// src/components/MenuSkeleton.tsx
import React from 'react';

export const MenuSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 max-w-md mx-auto mt-2 grow w-full">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-full">
        <div className="h-5 bg-gray-200 rounded-full w-1/3 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-[2rem] p-4 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};