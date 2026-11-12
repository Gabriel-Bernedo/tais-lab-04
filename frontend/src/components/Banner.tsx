import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Banner: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 px-4 py-2.5 text-xs sm:text-sm font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Prototipo Académico Zero Trust (UNSA 2026):</strong> Donaciones estrictamente simuladas. No se solicitan datos de tarjeta ni se realiza ningún cobro real.
        </span>
      </div>
    </div>
  );
};

