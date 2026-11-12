import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, Search, ArrowRight, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';
import type { Project } from '../types';

export const CatalogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.getProjects(),
  });

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPEN = (cents: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Iniciativa Solidaria Ficticia — Arequipa 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Causas Sociales Verificables y Transparentes
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Explora los proyectos comunitarios de la Fundación AQP-SOLIDARIA y apoya iniciativas en educación, nutrición y salud comunitaria.
        </p>

        {/* Buscador */}
        <div className="mt-8 max-w-md mx-auto relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o causa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-hidden"
          />
        </div>
      </div>

      {/* Estados de carga y error */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs animate-pulse">
              <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-100 rounded-md w-full mb-2"></div>
              <div className="h-4 bg-slate-100 rounded-md w-2/3 mb-6"></div>
              <div className="h-2 bg-slate-200 rounded-full w-full mb-4"></div>
              <div className="h-9 bg-slate-200 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl text-center max-w-lg mx-auto">
          <p className="font-semibold">No se pudo cargar el catálogo de proyectos.</p>
          <p className="text-sm mt-1 text-rose-600">Por favor, intenta nuevamente más tarde.</p>
        </div>
      )}

      {/* CA-01.3: Estado vacío comprensible */}
      {!isLoading && !isError && filteredProjects.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-md mx-auto">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No hay proyectos disponibles</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            {searchTerm ? 'No encontramos resultados para tu búsqueda.' : 'Actualmente no hay proyectos sociales abiertos al público.'}
          </p>
        </div>
      )}

      {/* Grid de proyectos */}
      {!isLoading && !isError && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: Project) => {
            const percentage = Math.min(
              Math.round((project.confirmedAmountCents / project.goalAmountCents) * 100),
              100
            );

            return (
              <div
                key={project.projectId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      PUBLICADO
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1 hover:text-emerald-700 transition">
                    <Link to={`/projects/${project.projectId}`}>{project.title}</Link>
                  </h3>
                  <p className="text-slate-600 text-sm mt-2 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Progreso */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <div className="flex justify-between items-baseline mb-2">
                      <div>
                        <span className="text-xs font-semibold uppercase text-slate-400 block tracking-wider">Recaudado</span>
                        <span className="text-base font-bold text-slate-900">{formatPEN(project.confirmedAmountCents)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold uppercase text-slate-400 block tracking-wider">Meta</span>
                        <span className="text-xs font-semibold text-slate-700">{formatPEN(project.goalAmountCents)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 font-medium mt-1.5">
                      <span>{percentage}% completado</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100">
                  <Link
                    to={`/projects/${project.projectId}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition py-1"
                  >
                    <span>Ver detalle y donar</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
