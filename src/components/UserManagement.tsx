import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { loadUsersList, saveUsersList } from '../lib/storage';
import { getStoredGasUrl, getUsersViaGas, addUserViaGas, updateUserViaGas, deleteUserViaGas } from '../lib/gasApi';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  UserPlus,
  Search,
  Edit,
  Trash2,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  User as UserIcon,
  Lock,
} from 'lucide-react';

interface UserManagementProps {
  currentUser: AppUser;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const UserManagementView: React.FC<UserManagementProps> = ({ currentUser, showToast }) => {
  const [users, setUsers] = useState<AppUser[]>(() => loadUsersList());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);

  // Form state for Add User
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('guru');

  // Form state for Edit User
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('guru');

  const gasUrl = getStoredGasUrl();

  // Load from GAS if available
  const handleFetchUsersFromGas = async () => {
    if (!gasUrl) return;
    setIsRefreshing(true);
    try {
      const res = await getUsersViaGas(gasUrl);
      if (res && res.status === 'success' && Array.isArray(res.users) && res.users.length > 0) {
        setUsers(res.users);
        saveUsersList(res.users);
        showToast('Daftar user berhasil diperbarui dari Google Sheets', 'success');
      }
    } catch (err: any) {
      console.warn('Gagal ambil data user dari GAS:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    saveUsersList(users);
  }, [users]);

  // Handle Add User
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword) {
      showToast('Mohon lengkapi semua kolom', 'error');
      return;
    }

    const emailClean = addEmail.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === emailClean)) {
      showToast('Email tersebut sudah terdaftar!', 'error');
      return;
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: addName.trim(),
      email: emailClean,
      role: addRole,
      password: addPassword,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Online sync
    if (gasUrl) {
      try {
        await addUserViaGas(gasUrl, {
          name: newUser.name,
          email: newUser.email,
          password: addPassword,
          role: newUser.role,
        });
      } catch (err) {
        console.warn('GAS addUser failed:', err);
      }
    }

    const updated = [newUser, ...users];
    setUsers(updated);
    saveUsersList(updated);
    showToast(`User ${newUser.name} (${newUser.role.toUpperCase()}) berhasil ditambahkan`, 'success');

    // Reset & Close
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddRole('guru');
    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
    setEditRole(user.role);
  };

  // Handle Edit User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim() || !editEmail.trim()) {
      showToast('Nama dan Email tidak boleh kosong', 'error');
      return;
    }

    const emailClean = editEmail.trim().toLowerCase();
    const updatedUsers = users.map((u) => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: editName.trim(),
          email: emailClean,
          role: editRole,
          password: editPassword ? editPassword : u.password,
        };
      }
      return u;
    });

    if (gasUrl) {
      try {
        await updateUserViaGas(gasUrl, {
          id: editingUser.id,
          name: editName.trim(),
          email: emailClean,
          password: editPassword || undefined,
          role: editRole,
        });
      } catch (err) {
        console.warn('GAS updateUser failed:', err);
      }
    }

    setUsers(updatedUsers);
    saveUsersList(updatedUsers);
    showToast(`Data user ${editName} berhasil diperbarui`, 'success');
    setEditingUser(null);
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    if (deletingUser.id === currentUser.id) {
      showToast('Anda tidak dapat menghapus akun Anda sendiri!', 'error');
      setDeletingUser(null);
      return;
    }

    if (gasUrl) {
      try {
        await deleteUserViaGas(gasUrl, deletingUser.id);
      } catch (err) {
        console.warn('GAS deleteUser failed:', err);
      }
    }

    const updated = users.filter((u) => u.id !== deletingUser.id);
    setUsers(updated);
    saveUsersList(updated);
    showToast(`User ${deletingUser.name} berhasil dihapus`, 'success');
    setDeletingUser(null);
  };

  // Filtered List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalAdmin = users.filter((u) => u.role === 'admin').length;
  const totalGuru = users.filter((u) => u.role === 'guru').length;

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/25 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Manajemen User & Hak Akses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Kelola seluruh akun Admin dan Guru, tambah pengguna baru, serta atur password.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {gasUrl && (
            <button
              onClick={handleFetchUsersFromGas}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-violet-600' : ''}`} />
              <span>Refresh Sheets</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah User Baru</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Terdaftar</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{users.length} <span className="text-xs font-normal text-slate-400">User</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role Guru</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalGuru} <span className="text-xs font-normal text-slate-400">Pengajar</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role Administrator</p>
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">{totalAdmin} <span className="text-xs font-normal text-slate-400">Admin</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama atau email user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-400">Filter Role:</span>
            <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterRole === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterRole('admin')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterRole === 'admin'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setFilterRole('guru')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterRole === 'guru'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Guru
              </button>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 text-center w-12">No</th>
                <th className="p-3.5">Nama Lengkap</th>
                <th className="p-3.5">Email / Username</th>
                <th className="p-3.5 text-center">Role Hak Akses</th>
                <th className="p-3.5">Tanggal Daftar</th>
                <th className="p-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data user yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          u.role === 'admin'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                          {u.id === currentUser.id && (
                            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">(Akun Anda)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 font-medium">{u.email}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full font-bold text-[11px] ${
                        u.role === 'admin'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {u.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                        <span className="capitalize">{u.role}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">{u.createdAt || '-'}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit User / Reset Password"
                          className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingUser(u)}
                          disabled={u.id === currentUser.id}
                          title={u.id === currentUser.id ? 'Tidak bisa menghapus akun sendiri' : 'Hapus User'}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah User Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-violet-600" />
                <span>Tambah User Baru</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama beserta gelar..."
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Email / Username Login
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@sekolah.sch.id..."
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Password Login
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Role Hak Akses
                </label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 font-bold"
                >
                  <option value="guru">Guru (Akses Administrasi Kelas & Mengajar)</option>
                  <option value="admin">Admin (Akses Penuh + Manajemen User)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-600/30"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit User / Reset Password */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Edit className="w-5 h-5 text-violet-600" />
                <span>Edit Data User & Reset Password</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Email User
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Reset Password Baru (Opsional)
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah password..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Role Hak Akses
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 font-bold"
                >
                  <option value="guru">Guru (Akses Administrasi Guru)</option>
                  <option value="admin">Admin (Akses Penuh System)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-600/30"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus User */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus User?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus user <strong className="text-slate-800 dark:text-slate-200">{deletingUser.name}</strong> ({deletingUser.email})?
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20"
              >
                Ya, Hapus User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
