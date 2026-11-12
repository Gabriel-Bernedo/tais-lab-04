import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, CheckCircle, FolderPlus, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../auth/authContext';

export const GestorPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalSoles, setGoalSoles] = useState(5000);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const isGestor = user?.roles.includes('GESTOR');

  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ['all-projects-gestor'],
    queryFn: () => apiService.getAllProjectsGestor(user?.accessToken),
    enabled: !!isGestor,
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No autorizado');
      return apiService.createProject(
        {
          title,
          description,
          goalAmountCents: Math.round(goalSoles * 100),
        },
        user.accessToken
      );
    },
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: ['all-projects-gestor'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setTitle('');
      setDescription('');
      setGoalSoles(5000);
      setStatusMsg({ text: `Proyecto "${newProj.title}" creado en estado BORRADOR.` });
    },
    onError: (err: Error) => {
      setStatusMsg({ text: err.message, isError: true });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error('No autorizado');
      return apiService.publishProject(projectId, user.accessToken);
    },
    onSuccess: (updatedProj) => {
      queryClient.invalidateQueries({ queryKey: ['all-projects-gestor'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setStatusMsg({ text: `Proyecto "${updatedProj.title}" PUBLICADO exitosamente.` });
    },
    onError: (err: Error) => {
      setStatusMsg({ text: err.message, isError: true });
    },
  });

  if (!isGestor) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Acceso Denegado (HTTP 403)</h2>
        <p className="text-sm text-slate-600 mt-2">
          Esta sección está restringida exclusivamente a usuarios con el rol <code>GESTOR</code> con MFA verificado.
        </p>
      </div>
    );
  }

  const formatPEN = (cents: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
          <FolderPlus className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Panel de Gestión de Campañas</h1>
          <p className="text-sm text-slate-600">Creación, edición y publicación de proyectos comunitarios (HU-08).</p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm mb-6 flex items-center justify-between ${
            statusMsg.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs font-bold underline ml-4">
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario para crear proyecto (BORRADOR) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm sticky top-24">
            <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              Nuevo Proyecto
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProjectMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Causa</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Ollas Comunes Cono Norte"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Objetivo</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detalla el impacto social del proyecto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meta Financiera (PEN)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    S/
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={goalSoles}
                    onChange={(e) => setGoalSoles(Number(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Todo proyecto nuevo se inicia como <strong>BORRADOR</strong> y solo acepta donaciones al ser publicado.
              </div>

              <button
                type="submit"
                disabled={createProjectMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-xs"
              >
                {createProjectMutation.isPending ? 'Guardando...' : 'Crear en Borrador'}
              </button>
            </form>
          </div>
        </div>

        {/* Listado de proyectos administrados */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Proyectos Registrados</h3>
              <span className="text-xs text-slate-500">{allProjects.length} proyectos</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-slate-400">Cargando proyectos...</div>
            ) : allProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No hay proyectos registrados.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allProjects.map((p) => (
                  <div key={p.projectId} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            p.status === 'PUBLICADO'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: {p.projectId}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">{p.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                      <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                        <span>Meta: <strong>{formatPEN(p.goalAmountCents)}</strong></span>
                        <span>Confirmado: <strong>{formatPEN(p.confirmedAmountCents)}</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {p.status === 'BORRADOR' ? (
                        <button
                          onClick={() => publishMutation.mutate(p.projectId)}
                          disabled={publishMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Publicar</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          En línea
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
