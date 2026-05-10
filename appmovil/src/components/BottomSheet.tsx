import React from 'react';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<Props> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full bg-white rounded-t-3xl p-4 shadow-xl max-h-[70vh] overflow-auto">
        {title && <div className="mb-2 text-center font-black">{title}</div>}
        {children}
        <div className="h-4" />
      </div>
    </div>
  );
};
