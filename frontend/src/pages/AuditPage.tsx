import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  RefreshCw, 
  Filter, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Lock,
  Layers,
  Database
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../auth/authContext';

export const AuditPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const isAuditor = user?.roles.includes('AUDITOR');

  const { data: auditEvents = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['audit-events', selectedType],
    queryFn: () => apiService.getAuditEvents(user?.accessToken || '', selectedType),
    enabled: !!isAuditor,
    refetchInterval: 15000, // refresco automático cada 15s
  });

  if (!isAuditor) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Acceso Denegado (HTTP 403)</h2>
        <p className="text-sm text-slate-600 mt-2">
          Esta vista está restringida exclusivamente a usuarios con el rol <code>AUDITOR</code> con autenticación multifactor (MFA TOTP) activa conforme al requisito HU-10 y NIST SP 800-207.
        </p>
      </div>
    );
  }

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return iso;
    }
  };

  const getBadgeStyle = (eventType: string) => {
    switch (eventType) {
      case 'PROJECT_CREATED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PROJECT_PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DONATION_INTENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DONATION_CONFIRMED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'DONATION_REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Bitácora de Auditoría y Trazabilidad
              </h1>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
                HU-10
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Supervisión técnica de eventos inmutables en DynamoDB (NIST SP 800-207 - Principio de Menor Privilegio).
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700 shadow-2xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas de Métricas de Auditoría */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Eventos Registrados</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{auditEvents.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Registros persistidos en AuditEventsTable</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Segregación de Roles</span>
            <Lock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-slate-800">MFA TOTP Verificado</div>
          <p className="text-[11px] text-emerald-600 mt-1">Acceso de solo lectura / Sin permisos de modificación</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Trazabilidad NIST</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-bold text-slate-800">Correlación RequestId</div>
          <p className="text-[11px] text-slate-400 mt-1">Vinculado a CloudWatch Logs & API Gateway</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-6 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-2">
          <Filter className="w-4 h-4 text-slate-400" />
          Filtrar por evento:
        </div>
        {[
          { key: 'ALL', label: 'Todos' },
          { key: 'PROJECT_CREATED', label: 'Proyectos Creados' },
          { key: 'PROJECT_PUBLISHED', label: 'Proyectos Publicados' },
          { key: 'DONATION_INTENT', label: 'Intenciones Donación' },
          { key: 'DONATION_CONFIRMED', label: 'Confirmaciones' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setSelectedType(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedType === f.key
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contenido / Tabla */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Cargando eventos de auditoría desde DynamoDB...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center text-rose-800">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
          <h3 className="font-bold text-sm">Error al cargar bitácora</h3>
          <p className="text-xs text-rose-700 mt-1">{(error as Error).message}</p>
        </div>
      ) : auditEvents.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No hay eventos para el filtro seleccionado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Los eventos se registran automáticamente cuando los usuarios con rol GESTOR crean o publican proyectos, o cuando los DONANTES registran intenciones.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Tipo de Evento</th>
                  <th className="py-3.5 px-4">Acción</th>
                  <th className="py-3.5 px-4">Recurso Afectado</th>
                  <th className="py-3.5 px-4">Actor (Sub Seudonimizado)</th>
                  <th className="py-3.5 px-4">Request ID</th>
                  <th className="py-3.5 px-4 text-center">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {auditEvents.map((evt) => (
                  <tr key={evt.eventSk} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatTimestamp(evt.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${getBadgeStyle(evt.eventType)}`}>
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-800 font-semibold">
                      {evt.action}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                      {evt.resourceRef || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 text-[10px]" title={evt.actorRef}>
                      {evt.actorRef ? `${evt.actorRef.substring(0, 12)}...` : 'Sistema'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-400 text-[10px]" title={evt.requestId}>
                      {evt.requestId ? `${evt.requestId.substring(0, 10)}...` : '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {evt.outcome || 'SUCCESS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
