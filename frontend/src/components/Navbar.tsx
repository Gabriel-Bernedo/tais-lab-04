import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HeartHandshake, LogIn, LogOut, User, FolderPlus, History, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/authContext';
import type { Role } from '../types';

export const Navbar: React.FC = () => {
  const { user, login, logout, isMockMode, setMockRole } = useAuth();
  const location = useLocation();

  const isGestor = user?.roles.includes('GESTOR');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Título */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-700 transition">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 block leading-tight">Fundación AQP</span>
              <span className="text-xs text-emerald-700 font-semibold tracking-wide uppercase">Solidaria</span>
            </div>
          </Link>

          {/* Enlaces de Navegación */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname === '/' 
                  ? 'bg-slate-100 text-slate-900 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Proyectos
            </Link>

            {user && (
              <Link
                to="/my-donations"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  location.pathname === '/my-donations'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <History className="w-4 h-4" />
                Mis Donaciones
              </Link>
            )}

            {isGestor && (
              <Link
                to="/manage/projects"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  location.pathname === '/manage/projects'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-emerald-700 hover:bg-emerald-50/70'
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                Panel Gestor
              </Link>
            )}
          </nav>

          {/* Autenticación & Selector de Roles para el Lab */}
          <div className="flex items-center gap-3">
            {isMockMode && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
                <span className="px-1.5 text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Rol:
                </span>
                {(['DONANTE', 'GESTOR', 'AUDITOR'] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setMockRole(r)}
                    className={`px-2 py-1 rounded text-xs transition ${
                      user?.roles.includes(r)
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
                {user && (
                  <button
                    onClick={() => setMockRole(null)}
                    className="px-1.5 py-1 text-slate-500 hover:text-red-600"
                    title="Cerrar sesión (Visitante)"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-right">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-semibold text-slate-900 truncate max-w-[130px]">{user.email}</p>
                    <span className="inline-block px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      {user.roles.join(', ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition text-xs font-semibold shadow-xs"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
