import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/authContext';
import { Banner } from './components/Banner';
import { Navbar } from './components/Navbar';
import { CatalogPage } from './pages/CatalogPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { MyDonationsPage } from './pages/MyDonationsPage';
import { GestorPage } from './pages/GestorPage';
import { CallbackPage } from './pages/CallbackPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutos
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Banner />
            <Navbar />

            <main className="grow">
              <Routes>
                <Route path="/" element={<CatalogPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="/my-donations" element={<MyDonationsPage />} />
                <Route path="/manage/projects" element={<GestorPage />} />
                <Route path="/callback" element={<CallbackPage />} />
              </Routes>
            </main>

            {/* Footer con aviso de prototipo académico (CA-NF10.2) */}
            <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 space-y-2">
                <p className="font-semibold text-slate-700">
                  Fundación AQP-SOLIDARIA — Tópicos Avanzados en Ingeniería de Software (UNSA 2026)
                </p>
                <p className="max-w-xl mx-auto text-slate-400">
                  Prototipo académico serverless con modelo de seguridad Zero Trust (NIST SP 800-207). Todas las transacciones e identidades son estrictamente simuladas para fines didácticos.
                </p>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
