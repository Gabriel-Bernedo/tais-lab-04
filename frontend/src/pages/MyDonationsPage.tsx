import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { History, CheckCircle, XCircle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../auth/authContext';
import type { Donation } from '../types';

export const MyDonationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => {
      if (!user) return Promise.resolve([]);
      return apiService.getMyDonations(user.accessToken);
    },
    enabled: !!user,
  });

  const simulationMutation = useMutation({
    mutationFn: async ({ donationId, action }: { donationId: string; action: 'CONFIRMAR' | 'RECHAZAR' }) => {
      if (!user) throw new Error('No autenticado');
      return apiService.simulateDonation(donationId, action, user.accessToken);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setFeedbackMsg({
        text: `Donación ${vars.action === 'CONFIRMAR' ? 'confirmada' : 'rechazada'} exitosamente en el simulador.`,
      });
    },
    onError: (err: Error) => {
      setFeedbackMsg({ text: err.message, isError: true });
    },
  });

  const formatPEN = (cents: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  const getStatusBadge = (status: Donation['status']) => {
    switch (status) {
      case 'CONFIRMADA_SIMULADA':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Confirmada
          </span>
        );
      case 'RECHAZADA_SIMULADA':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rechazada
          </span>
        );
      case 'PENDIENTE_SIMULACION':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pendiente de Simulación
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <History className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Historial Privado de Donaciones</h2>
        <p className="text-sm text-slate-600 mt-2">
          Debes iniciar sesión con tu cuenta de Donante para consultar tus aportes simulados.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Mis Aportes e Intenciones</h1>
          <p className="text-sm text-slate-600 mt-1">
            Historial de donaciones asociado exclusivamente a tu identificador (<code>{user.sub}</code>).
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition self-start sm:self-auto"
        >
          <span>Explorar más causas</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Rótulo obligatorio CA-06.4 */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl mb-6 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <p className="font-bold">Simulación académica: no se ha realizado ningún cobro</p>
          <p className="text-blue-800/80 mt-0.5">
            Este entorno permite evaluar la idempotencia y las transiciones de estado hacia DynamoDB sin pasarelas de pago reales.
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm mb-6 flex items-center justify-between ${
            feedbackMsg.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold underline ml-4">
            Cerrar
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">Cargando tus donaciones...</div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <History className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Aún no tienes donaciones registradas</h3>
          <p className="text-sm text-slate-500 mt-1">
            Elige un proyecto del catálogo para registrar tu primera intención simulada.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-emerald-700 transition"
          >
            Ver Proyectos
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {donations.map((don) => (
              <div key={don.donationId} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(don.status)}
                    <span className="text-xs text-slate-400 font-mono">ID: {don.donationId}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {don.projectTitle || `Proyecto ${don.projectId}`}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Registrado el {new Date(don.createdAt).toLocaleString('es-PE')}
                  </p>
                </div>

                <div className="flex flex-row md:flex-col items-baseline md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <span className="text-xl font-black text-slate-900">{formatPEN(don.amountCents)}</span>
                  
                  {/* Acciones de simulación (HU-06) solo si está PENDIENTE */}
                  {don.status === 'PENDIENTE_SIMULACION' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => simulationMutation.mutate({ donationId: don.donationId, action: 'CONFIRMAR' })}
                        disabled={simulationMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Simular Éxito
                      </button>
                      <button
                        onClick={() => simulationMutation.mutate({ donationId: don.donationId, action: 'RECHAZAR' })}
                        disabled={simulationMutation.isPending}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Simular Rechazo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
