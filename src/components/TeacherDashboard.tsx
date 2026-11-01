import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FolderOpen,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  Globe,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { StudentSubmission } from '../types';
import {
  DriveFile,
  listUserDriveFiles,
  createAssignmentSpreadsheet,
  syncSubmissionsToSheet,
} from '../services/googleSheets';
import { getCleanDomain } from '../utils/thumbnail';

interface TeacherDashboardProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  accessToken: string | null;
  submissions: StudentSubmission[];
  onDeleteSubmission: (id: string) => void;
  onViewSlide: (sub: StudentSubmission) => void;
  onShowNotice: (msg: string) => void;
  activeSheetId: string | null;
  activeSheetTitle: string;
  onUpdateActiveSheet: (id: string, title: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  onSignIn,
  onSignOut,
  accessToken,
  submissions,
  onDeleteSubmission,
  onViewSlide,
  onShowNotice,
  activeSheetId,
  activeSheetTitle,
  onUpdateActiveSheet,
}) => {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [searchTable, setSearchTable] = useState('');

  useEffect(() => {
    if (user && accessToken) {
      loadDriveFiles();
    }
  }, [user, accessToken]);

  const loadDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoadingDrive(true);
    try {
      const files = await listUserDriveFiles(accessToken, 'all');
      setDriveFiles(files);
    } catch (e) {
      console.warn('Gagal memuatkan fail Google Drive', e);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleCreateSheet = async () => {
    if (!accessToken) return;
    setIsCreatingSheet(true);
    try {
      const created = await createAssignmentSpreadsheet(
        accessToken,
        'Projek Website Saya - Senarai Pelajar'
      );
      onUpdateActiveSheet(created.id, 'Projek Website Saya - Senarai Pelajar');
      if (submissions.length > 0) {
        await syncSubmissionsToSheet(accessToken, created.id, submissions);
      }
      onShowNotice('Google Sheets baru berjaya dicipta dan data pelajar telah disegerakkan!');
      await loadDriveFiles();
    } catch (e) {
      console.error(e);
      onShowNotice('Gagal mencipta fail Google Sheets.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncAll = async () => {
    if (!accessToken || !activeSheetId) {
      onShowNotice('Sila pilih atau cipta Google Sheets terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    try {
      await syncSubmissionsToSheet(accessToken, activeSheetId, submissions);
      onShowNotice(`${submissions.length} rekod hantaran pelajar berjaya disegerakkan ke Google Sheets!`);
    } catch (e) {
      console.error(e);
      onShowNotice('Gagal menyegerak data ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Paparan log masuk jika belum mengesahkan identiti
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-xs text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Log Masuk Guru / Pentadbir
          </h2>
          <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
            Sila log masuk dengan akaun Google anda untuk menyemak hasil tugasan pelajar di Google Sheets dan fail slaid di Google Drive.
          </p>

          <button
            onClick={onSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-xs cursor-pointer hover:border-zinc-400"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Log Masuk dengan Google</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchTable.toLowerCase()) ||
      s.noMatrik.toLowerCase().includes(searchTable.toLowerCase()) ||
      s.tajukWeb.toLowerCase().includes(searchTable.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Pengepala Utama */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
            Panel Guru / Pentadbir
          </span>
          <h2 className="text-xl font-bold text-zinc-900">
            Semakan Tugasan &amp; Sambungan Google
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Log masuk sebagai <span className="font-semibold text-zinc-700">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSignOut}
            className="text-xs font-medium text-zinc-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Log Keluar
          </button>
        </div>
      </div>

      {/* Bahagian Integrasi: Google Sheets & Google Drive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blok 1: Google Sheets */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Google Sheets Tugasan</h3>
                  <p className="text-xs text-zinc-500">Semak senarai &amp; data hantaran pelajar</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 my-3 text-xs">
              {activeSheetId ? (
                <div>
                  <div className="font-semibold text-zinc-800 mb-1">{activeSheetTitle}</div>
                  <div className="text-[11px] font-mono text-zinc-500 truncate">
                    ID: {activeSheetId}
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500">
                  Belum ada Google Sheets dicipta untuk tugasan ini.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            {activeSheetId ? (
              <>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${activeSheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
                >
                  <span>Buka Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyegerak...' : 'Segerak Data Sekarang'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleCreateSheet}
                disabled={isCreatingSheet}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingSheet ? 'Mencipta...' : 'Cipta Google Sheets Baru'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Blok 2: Google Drive */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Google Drive</h3>
                  <p className="text-xs text-zinc-500">Semak fail slaid pembentangan &amp; PDF</p>
                </div>
              </div>

              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <span>Buka Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Senarai fail yang ditemui dalam Google Drive */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 my-3 text-xs max-h-36 overflow-y-auto space-y-1.5">
              {isLoadingDrive ? (
                <div className="text-center py-4 text-zinc-400">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" />
                  <span>Memeriksa Google Drive...</span>
                </div>
              ) : driveFiles.length > 0 ? (
                driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate text-zinc-700 font-medium">{file.name}</span>
                    </div>
                    {file.webViewLink ? (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline shrink-0 text-[11px]"
                      >
                        Buka
                      </a>
                    ) : (
                      <a
                        href={`https://drive.google.com/file/d/${file.id}/view`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline shrink-0 text-[11px]"
                      >
                        Buka
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-zinc-400 text-center py-3">
                  Tiada fail ditemui atau gunakan butang &quot;Buka Google Drive&quot; di atas.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Fail slaid PDF pelajar juga boleh dibuka terus daripada jadual di bawah.</span>
          </div>
        </div>
      </div>

      {/* Jadual Senarai Hantaran */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-zinc-900">
              Senarai Hantaran Pelajar ({submissions.length})
            </h3>
            <p className="text-xs text-zinc-500">
              Semua tugasan yang telah dihantar oleh pelajar melalui borang web.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="Cari nama atau matrik..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        {filteredSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Pelajar</th>
                  <th className="py-3 px-4">Nombor Matrik</th>
                  <th className="py-3 px-4">Tajuk Laman Web</th>
                  <th className="py-3 px-4">Pautan Web</th>
                  <th className="py-3 px-4">Slaid (PDF)</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900">{sub.nama}</td>
                    <td className="py-3 px-4 font-mono text-zinc-600">{sub.noMatrik}</td>
                    <td className="py-3 px-4 text-zinc-700 max-w-xs truncate">{sub.tajukWeb}</td>
                    <td className="py-3 px-4">
                      <a
                        href={sub.linkLamanWeb}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium truncate max-w-[140px]"
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span>{getCleanDomain(sub.linkLamanWeb)}</span>
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onViewSlide(sub)}
                        className="inline-flex items-center gap-1 text-rose-600 hover:underline font-medium cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {sub.slideFileName || 'Lihat Slaid'}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Adakah anda pasti mahu memadam hantaran ${sub.nama}?`)) {
                            onDeleteSubmission(sub.id);
                          }
                        }}
                        className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Padam hantaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500">
            Tiada rekod hantaran pelajar setakat ini.
          </div>
        )}
      </div>
    </div>
  );
};
