import React, { useState, useEffect } from 'react';
import {
  UserCog, Shield, UserCheck, Plus, RefreshCw,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import api from '../../api';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('ROLE_ADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/admins');
      setAdmins(res.data.admins || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      setSubmitting(true);
      setMessage('');
      setIsError(false);

      const res = await api.post('/api/admin/admins/update-role', {
        email: newEmail.trim(),
        role: newRole
      });

      setMessage(res.data.message || 'Administrator privilege updated.');
      setNewEmail('');
      fetchAdmins();
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Failed to update admin permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#356BFF]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7]">Super Admin Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mt-1">Admin Management</h1>
          <p className="text-sm text-[#B8C5F2]">Assign administrative credentials, delegate operational roles & manage root authorities</p>
        </div>
        <button
          onClick={fetchAdmins}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 self-start sm:self-auto cursor-pointer transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#713BFF]' : ''}`} />
          Refresh Admins
        </button>
      </div>

      {/* Grant / Update Role Box */}
      <div className="p-6 rounded-2xl bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 space-y-4 shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#356BFF]" />
          Delegate Administrative Privileges
        </h3>
        <p className="text-xs text-[#B8C5F2]">
          Promote an existing user to <span className="text-[#356BFF] font-bold">ROLE_ADMIN</span> or <span className="text-[#A855F7] font-bold">ROLE_SUPER_ADMIN</span>, granting access to surveillance tools and compliance panels.
        </p>

        {message && (
          <div className={`p-3 rounded-xl text-xs font-bold ${
            isError ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdateRole} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#B8C5F2] mb-1">User Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. officer@vaultchain.bank"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#B8C5F2] mb-1">Assigned Privilege Level</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
            >
              <option value="ROLE_ADMIN">ROLE_ADMIN (Monitoring & KYC)</option>
              <option value="ROLE_SUPER_ADMIN">ROLE_SUPER_ADMIN (Root Governance)</option>
              <option value="ROLE_USER">Demote to ROLE_USER</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white text-xs font-bold hover:opacity-95 transition-all shadow-[0_0_20px_rgba(113,59,255,0.35)] cursor-pointer"
            >
              {submitting ? 'Applying Authorization...' : 'Update Authorization'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Administrators Table */}
      <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="p-4 border-b border-[#8B92FF]/20">
          <h3 className="text-sm font-bold text-[#F8FAFC]">Active System Administrators</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">UID</th>
                <th className="py-3 px-4">Admin Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Designation</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-right">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B92FF]/10 text-[#B8C5F2]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#B8C5F2]/60">Loading authorities...</td>
                </tr>
              ) : (
                admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-[#356BFF]/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#B8C5F2]/60">#{adm.id}</td>
                    <td className="py-3 px-4 font-bold text-[#F8FAFC]">{adm.name || 'Admin Officer'}</td>
                    <td className="py-3 px-4 font-mono text-[#356BFF]">{adm.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#713BFF]/15 text-[#A855F7] border border-[#713BFF]/30 text-[10px] font-bold">
                        {adm.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#B8C5F2]/70 font-mono text-[11px]">
                      {adm.lastLoginAt ? new Date(adm.lastLoginAt).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
