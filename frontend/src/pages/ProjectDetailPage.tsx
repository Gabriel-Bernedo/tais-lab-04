import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, Heart, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../auth/authContext';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const queryClient = useQueryClient();

  // Monto en soles para el input
  const [amountSoles, setAmountSoles] = useState<number>(20);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiService.getProjectById(projectId!),
    enabled: !!projectId,
  });

  const donationMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Debe iniciar sesión para registrar una intención');
      if (!projectId) throw new Error('Identificador de proyecto inválido');

      const amountCents = Math.round(amountSoles * 100);

      // CA-05.1: Mínimo S/ 1.00 (100 céntimos), Máximo S/ 1,000.00 (100,000 céntimos)
      if (amountCents < 100 || amountCents > 100000) {
        throw new Error('El importe debe encontrarse entre S/ 1.00 y S/ 1,000.00 PEN');
      }

      // Generar UUID seguro para Idempotency-Key
      const idempotencyKey = crypto.randomUUID();

      return apiService.createDonation(
        {
          projectId,
          amountCents,
          idempotencyKey,
        },
        user.accessToken
      );
    },
    onSuccess: (donation) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      setSuccessMsg(`¡Intención de donación registrada con éxito (ID: ${donation.donationId})!`);
      setErrorMsg(null);
      setTimeout(() => {
        navigate('/my-donations');
      }, 1800);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Error al procesar la donación');
    },
  });

  const formatPEN = (cents: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-500 text-sm">Cargando detalles de la causa...</p>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Proyecto no encontrado</h2>
        <p className="text-sm text-slate-500 mt-2">
          El proyecto solicitado no existe o no se encuentra publicado.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>
      </div>
    );
  }

  const percentage = Math.min(
    Math.round((project.confirmedAmountCents / project.goalAmountCents) * 100),
    100
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Botón Volver */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detalle principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {project.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {project.projectId}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {project.title}
            </h1>

            <div className="prose prose-slate mt-6 text-slate-700 text-base leading-relaxed">
              <p>{project.description}</p>
            </div>

            {/* Progreso */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-baseline mb-2">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Total Confirmado</span>
                  <p className="text-2xl font-black text-slate-900">{formatPEN(project.confirmedAmountCents)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase text-slate-400">Meta</span>
                  <p className="text-sm font-bold text-slate-700">{formatPEN(project.goalAmountCents)}</p>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">{percentage}% de la meta alcanzada</p>
            </div>
          </div>

          {/* Garantías de seguridad Zero Trust en la UI */}
          <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 flex items-start gap-3 text-emerald-900 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Garantía de Integridad e Idempotencia</p>
              <p className="text-xs text-emerald-800/90 mt-1">
                Cada solicitud protegida viaja con firma JWT autorizada por API Gateway y clave única de idempotencia atómica en DynamoDB.
              </p>
            </div>
          </div>
        </div>

        {/* Panel lateral: Intención de Donación */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-emerald-800">
              <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              <h2 className="font-bold text-lg text-slate-900">Apoyar este Proyecto</h2>
            </div>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!user ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-600">
                  Para registrar una intención de donación verificable, debes autenticarte.
                </p>
                <button
                  onClick={login}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-xs"
                >
                  Iniciar Sesión como Donante
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  donationMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Selecciona o ingresa un monto (PEN)
                  </label>
                  {/* Botones de montos sugeridos */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[10, 20, 50, 100, 200, 500].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setAmountSoles(val)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          amountSoles === val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        S/ {val}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                      S/
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      required
                      value={amountSoles}
                      onChange={(e) => setAmountSoles(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2.5 text-slate-900 font-bold rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Límite académico: S/ 1.00 a S/ 1,000.00 PEN</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700">Aviso de Simulación:</p>
                  <p>
                    No se pedirá número de tarjeta, CVV ni cuenta bancaria. La intención se registrará como <code>PENDIENTE_SIMULACION</code> para ser confirmada en el stage académico.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={donationMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2"
                >
                  {donationMutation.isPending ? (
                    <span>Registrando intención...</span>
                  ) : (
                    <span>Registrar Intención S/ {amountSoles}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

