/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { SubmissionCard } from './components/SubmissionCard';
import { SubmitModal } from './components/SubmitModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { SlideViewerModal } from './components/SlideViewerModal';
import { StudentSubmission } from './types';
import { INITIAL_SUBMISSIONS } from './data/seedData';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
} from './services/firebaseAuth';
import {
  appendRowsToSheet,
  submissionToRow,
} from './services/googleSheets';
import { User } from 'firebase/auth';
import { Search, Plus, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'projek_website_saya_submissions_v2';
const SHEET_STORAGE_KEY = 'projek_website_saya_sheet_v2';

export default function App() {
  // 1. Keadaan Senarai Hantaran (Bermula bersih & kosong)
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Gagal membaca daripada storan tempatan', e);
    }
    return INITIAL_SUBMISSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    } catch (e) {
      console.warn('Gagal menyimpan ke storan tempatan', e);
    }
  }, [submissions]);

  // 2. Mod Paparan ('listing' | 'admin')
  const [currentView, setCurrentView] = useState<'listing' | 'admin'>('listing');

  // 3. Carian
  const [searchQuery, setSearchQuery] = useState('');

  // 4. Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [viewingSlideSubmission, setViewingSlideSubmission] = useState<StudentSubmission | null>(
    null
  );

  // 5. Pengesahan Google & Google Sheets
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<{ id: string; title: string }>(() => {
    try {
      const saved = localStorage.getItem(SHEET_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: '',
      title: 'Projek Website Saya - Senarai Pelajar',
    };
  });

  useEffect(() => {
    if (activeSheet.id) {
      localStorage.setItem(SHEET_STORAGE_KEY, JSON.stringify(activeSheet));
    }
  }, [activeSheet]);

  // 6. Notis Pemberitahuan
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Pendengar Log Masuk
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showNotice(`Selamat datang, ${res.user.displayName || res.user.email}!`);
      }
    } catch (err: unknown) {
      console.error(err);
      showNotice('Gagal log masuk dengan Google.');
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
      showNotice('Log keluar berjaya.');
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Hantar Tugasan Pelajar
  const handleAddSubmission = async (
    data: Omit<StudentSubmission, 'id' | 'submittedAt'>
  ) => {
    const newSubmission: StudentSubmission = {
      ...data,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };

    setSubmissions((prev) => [newSubmission, ...prev]);
    showNotice(`Tugasan "${data.nama}" berjaya dihantar!`);

    // Segerak ke Google Sheets secara automatik jika akaun guru telah disambungkan
    if (accessToken && activeSheet.id) {
      try {
        await appendRowsToSheet(accessToken, activeSheet.id, [
          submissionToRow(newSubmission),
        ]);
      } catch (err) {
        console.warn('Gagal segerak automatik ke Google Sheets:', err);
      }
    }
  };

  const handleDeleteSubmission = (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    showNotice('Hantaran telah berjaya dipadam.');
  };

  // Tapisan Senarai mengikut carian
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.noMatrik.toLowerCase().includes(q) ||
        s.tajukWeb.toLowerCase().includes(q)
    );
  }, [submissions, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      {/* Notis Pemberitahuan */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigasi Utama */}
      <Navbar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onOpenSubmit={() => setIsSubmitModalOpen(true)}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Kawasan Kandungan Utama */}
      {currentView === 'admin' ? (
        <TeacherDashboard
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          accessToken={accessToken}
          submissions={submissions}
          onDeleteSubmission={handleDeleteSubmission}
          onViewSlide={(sub) => setViewingSlideSubmission(sub)}
          onShowNotice={showNotice}
          activeSheetId={activeSheet.id}
          activeSheetTitle={activeSheet.title}
          onUpdateActiveSheet={(id, title) => setActiveSheet({ id, title })}
        />
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {/* Bar Carian */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pelajar, no. matrik, atau tajuk web..."
                className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Grid Senarai Kad Hantaran */}
          {filteredSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  onOpenSlide={(s) => setViewingSlideSubmission(s)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center max-w-md mx-auto my-8 shadow-xs">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                {searchQuery ? 'Tiada Projek Dijumpai' : 'Belum Ada Hantaran Projek'}
              </h3>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                {searchQuery
                  ? 'Cuba buat carian dengan kata kunci yang lain.'
                  : 'Pelajar boleh klik butang "Hantar Tugasan" di atas untuk memasukkan pautan laman web Canva dan memuat naik fail slaid PDF.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Hantar Tugasan Sekarang
                </button>
              )}
            </div>
          )}
        </main>
      )}

      {/* Kaki Halaman */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-xs text-zinc-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-medium text-zinc-700">Projek Website Saya</p>
          <p className="text-zinc-400">Portal Hantaran Tugasan Pelajar</p>
        </div>
      </footer>

      {/* Modal Hantar Tugasan */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleAddSubmission}
      />

      {/* Modal Paparan Slaid PDF */}
      <SlideViewerModal
        submission={viewingSlideSubmission}
        onClose={() => setViewingSlideSubmission(null)}
      />
    </div>
  );
}
