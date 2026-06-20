'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Database } from '@/lib/database.types';

type Registration = Database['public']['Tables']['registrations']['Row'];

interface Stats {
  total: number;
  pending: number;
  verified: number;
  batch_1: number;
  batch_2: number;
  batch_3: number;
}

interface RegistrationsResponse {
  pending: Registration[];
  stats: Stats;
}

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    verified: 0,
    batch_1: 0,
    batch_2: 0,
    batch_3: 0,
  });
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    const res = await fetch('/api/admin/registrations');
    if (res.status === 401) {
      setIsAuthenticated(false);
      return;
    }
    const data = (await res.json()) as RegistrationsResponse;
    if (data.pending) {
      setRegistrations(data.pending);
      setStats(data.stats);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchRegistrations();
  }, [isAuthenticated]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setLoginError('Incorrect password. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setIsAuthenticated(false);
    setRegistrations([]);
  };

  const verifyStudent = async (student: Registration) => {
    setVerifyingId(student.id);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: student.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Verification failed.');
      await fetchRegistrations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error.';
      alert('ስህተት ተከስቷል: ' + message);
    } finally {
      setVerifyingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,223,137,0.08)_0%,_transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm bg-[#0c0c0f] p-8 rounded-2xl border border-[#00DF89]/20 shadow-[0_0_40px_rgba(0,223,137,0.08)] relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-16 h-16 rounded-xl border border-[#00DF89]/30 overflow-hidden relative shadow-[0_0_20px_rgba(0,223,137,0.15)] mb-4"
            >
              <Image src="/logo.jpg" alt="AISHA TECH" fill className="object-cover" />
            </motion.div>
            <h2 className="text-xl font-black text-[#00DF89] font-mono tracking-wider">AISHA TECH</h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">Admin Dashboard Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 bg-black text-white rounded-xl border border-white/10 focus:outline-none focus:border-[#00DF89] transition text-sm font-mono"
              placeholder="Enter Admin Password"
              required
            />
            <AnimatePresence>
              {loginError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-xs text-center"
                >
                  {loginError}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#00DF89] hover:bg-[#00c478] text-black font-black py-3.5 rounded-xl transition text-sm shadow-[0_4px_20px_rgba(0,223,137,0.2)] disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Secure Login →'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Registered', value: `${stats.total}/150`, color: 'text-[#00DF89]', icon: '👥' },
    { label: 'Pending Review', value: stats.pending, color: 'text-yellow-400', icon: '⏳' },
    { label: 'Verified', value: stats.verified, color: 'text-[#00DF89]', icon: '✅' },
    {
      label: 'Alerts',
      value: stats.pending > 0 ? `${stats.pending} Need Action` : 'All Clear',
      color: 'text-purple-400',
      icon: '🔔',
    },
  ];

  const batches = [
    { name: 'Batch 1 (Morning)', count: stats.batch_1, time: '4:30 AM - 5:30 AM' },
    { name: 'Batch 2 (Afternoon)', count: stats.batch_2, time: '10:30 PM - 11:30 PM' },
    { name: 'Batch 3 (Evening)', count: stats.batch_3, time: '2:30 PM - 3:30 PM' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#0a0a0c] p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl border border-[#00DF89]/30 overflow-hidden relative">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <div>
            <p className="font-black text-[#00DF89] font-mono text-sm tracking-wider">AISHA TECH</p>
            <p className="text-[10px] text-gray-500 font-mono">A10TC Admin</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00DF89] text-black font-bold text-sm">
            <span>📋</span> Pending Requests
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 text-sm">
            <span>✅</span> Verified Students
          </div>
        </nav>

        <div className="border-t border-white/5 pt-4">
          <p className="text-xs text-gray-500 font-mono mb-1">Administrator</p>
          <p className="text-sm font-bold text-white">Aisha Abubeker</p>
          <button onClick={handleLogout} className="mt-4 text-xs text-red-400 hover:text-red-300 transition">
            Logout →
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-mono tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time overview of A10TC registrations.</p>
          </div>
          <button
            onClick={fetchRegistrations}
            className="text-xs bg-[#0c0c0f] border border-white/10 text-gray-400 px-5 py-2.5 rounded-xl hover:text-[#00DF89] hover:border-[#00DF89]/30 transition font-mono"
          >
            ↻ Refresh
          </button>
        </motion.header>

        {/* Stats Cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {statCards.map((card) => (
            <motion.div
              key={card.label}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">{card.label}</p>
                <span className="text-lg">{card.icon}</span>
              </div>
              <p className={`text-2xl font-black font-mono ${card.color}`}>{card.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Batch Progress */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-gray-400 mb-4">
            Batch Seat Count
          </h2>
          <div className="space-y-4">
            {batches.map((batch) => (
              <div key={batch.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-300 font-medium">{batch.name}</span>
                  <span className="font-mono text-[#00DF89]">{batch.count}/50</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((batch.count / 50) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${batch.count >= 50 ? 'bg-red-500' : 'bg-[#00DF89]'}`}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1 font-mono">{batch.time}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pending List */}
        <h2 className="text-lg font-black font-mono mb-4">
          Pending Requests
          {stats.pending > 0 && (
            <span className="ml-2 text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-mono">
              {stats.pending}
            </span>
          )}
        </h2>

        {registrations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-[#0c0c0f]"
          >
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-400 text-sm">ምንም የሚጠብቅ ምዝገባ የለም።</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {registrations.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-6 hover:border-[#00DF89]/20 transition group"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{s.full_name}</h3>
                        <span className="text-[10px] bg-[#00DF89]/10 text-[#00DF89] px-2 py-0.5 rounded-full font-mono">
                          {s.batch_selection}
                        </span>
                        <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-mono">
                          Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400 font-mono">
                        <p>📧 {s.email}</p>
                        <p>📞 {s.phone_number}</p>
                        <p>✈️ {s.telegram_username}</p>
                        <p>🎓 {s.academic_level}</p>
                        <p className="sm:col-span-2">
                          💳 FT Ref: <span className="text-white font-bold select-all">{s.payment_reference}</span>
                        </p>
                      </div>

    {s.receipt_url && s.receipt_url !== 'Pending Verification' && (
  <a                                          
    href={s.receipt_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition border border-purple-400/20 px-3 py-1.5 rounded-lg"
  >                                       
    🧾 View Bank Receipt →
  </a>
)}
</div>
                    <div className="flex items-center gap-3 shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => verifyStudent(s)}
                        disabled={verifyingId === s.id}
                        className="bg-[#00DF89] hover:bg-[#00c478] text-black font-black px-6 py-3 rounded-xl text-sm transition shadow-[0_4px_20px_rgba(0,223,137,0.2)] disabled:opacity-50 whitespace-nowrap"
                      >
                        {verifyingId === s.id ? 'Verifying...' : '✓ Verify Student'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}