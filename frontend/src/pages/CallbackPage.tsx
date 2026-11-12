import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager } from '../auth/authService';

export const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!userManager) {
          throw new Error('Configuración de Cognito no inicializada.');
        }

        // Procesa el intercambio de código PKCE usando el mismo gestor que inició el login
        await userManager.signinCallback();
        navigate('/', { replace: true });
      } catch (err: unknown) {
        console.error('Error procesando callback OIDC:', err);
        const detail = err instanceof Error ? err.message : String(err);
        setError(detail);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-center">
        <h2 className="font-bold text-lg">Error de Inicio de Sesión</h2>
        <p className="text-sm mt-2 text-rose-700">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="py-24 text-center">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-sm text-slate-500 font-medium">Validando credenciales Zero Trust con Cognito...</p>
    </div>
  );
};
