import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, ShieldAlert, Brain, Activity, RefreshCw } from 'lucide-react';
import apiClient, { getErrorMessage } from '../services/apiClient';
import toast from 'react-hot-toast';

interface UserItem {
  _id: string;
  username: string;
  email: string;
  role: string;
  isSuspended: boolean;
  isEmailVerified: boolean;
  createdAt?: string;
}

interface AiUsageSummary {
  totalTokens: number;
  requestCount: number;
  endpoints: Array<{ _id: string; totalTokens: number; count: number }>;
}

const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [aiUsage, setAiUsage] = useState<AiUsageSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await apiClient.get('/api/admin/users');
      if (response.data?.success) {
        setUsers(response.data.data.users || []);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to retrieve user accounts.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchAiUsage = async () => {
    setIsLoadingUsage(true);
    try {
      const response = await apiClient.get('/api/admin/ai-usage');
      if (response.data?.success) {
        setAiUsage(response.data.data || { totalTokens: 0, requestCount: 0, endpoints: [] });
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to retrieve system AI metrics.');
    } finally {
      setIsLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAiUsage();
  }, []);

  const handleToggleSuspend = async (userId: string, currentSuspension: boolean) => {
    setIsActionInProgress(userId);
    try {
      const response = await apiClient.post(`/api/admin/users/${userId}/suspend`);
      if (response.data?.success) {
        const updatedStatus = response.data.data?.isSuspended;
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isSuspended: updatedStatus } : u))
        );
        toast.success(
          updatedStatus
            ? 'Account has been successfully suspended.'
            : 'Account suspension has been lifted.'
        );
      }
    } catch (error: any) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Failed to update user suspension status.'));
    } finally {
      setIsActionInProgress(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto text-slate-100 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Control Console
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            System administration, user verification guards, and AI resource metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchUsers();
              fetchAiUsage();
              toast.success('Admin console refreshed.');
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* AI Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">AI Tokens Dispatched</p>
            <h3 className="text-2xl font-black mt-1">
              {isLoadingUsage ? '...' : (aiUsage?.totalTokens || 0).toLocaleString()}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total AI Requests</p>
            <h3 className="text-2xl font-black mt-1">
              {isLoadingUsage ? '...' : (aiUsage?.requestCount || 0).toLocaleString()}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center gap-4 col-span-1 md:col-span-1"
        >
          <div className="w-12 h-12 bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] rounded-xl flex items-center justify-center">
            🏥
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Users Registered</p>
            <h3 className="text-2xl font-black mt-1">
              {isLoadingUsers ? '...' : users.length.toLocaleString()}
            </h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Accounts Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-black text-white">Registered Members</h2>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username or email..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {isLoadingUsers ? (
              <div className="py-16 text-center text-slate-400 text-sm font-semibold flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                Retrieving accounts...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm font-semibold">
                No matching user accounts discovered.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/50">
                      <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Athlete</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                      <th className="py-3.5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredUsers.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-900/20 transition-all">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white text-sm">{item.username}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{item.email}</div>
                        </td>
                        <td className="py-4 px-6 text-xs">
                          <span
                            className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wide ${
                              item.role === 'admin'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            {item.isSuspended ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/25 rounded-md">
                                Suspended
                              </span>
                            ) : (
                              <span
                                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md ${
                                  item.isEmailVerified
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25'
                                }`}
                              >
                                {item.isEmailVerified ? 'Verified' : 'Unverified'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {item.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleSuspend(item._id, item.isSuspended)}
                              disabled={isActionInProgress !== null}
                              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 border flex items-center justify-center gap-1.5 ml-auto ${
                                item.isSuspended
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                              }`}
                            >
                              {isActionInProgress === item._id ? (
                                <div className="w-3.5 h-3.5 border-2 border-slate-100/30 border-t-slate-100 rounded-full animate-spin" />
                              ) : item.isSuspended ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Unsuspend
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Suspend
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* AI Usage Breakdown Card */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white">AI Endpoint Analytics</h2>
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              Distribution of token charges and load requests across Gemini integration points.
            </p>

            {isLoadingUsage ? (
              <div className="py-12 text-center text-slate-400 text-sm font-semibold flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                Aggregating logs...
              </div>
            ) : !aiUsage || aiUsage.endpoints.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm font-semibold">
                No active token logs documented.
              </div>
            ) : (
              <div className="space-y-4">
                {aiUsage.endpoints.map((item) => (
                  <div key={item._id} className="bg-slate-950/65 border border-slate-800/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white font-mono break-all">{item._id}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                        {item.count} Calls
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Tokens Dispatched:</span>
                      <span className="font-bold text-slate-200">{item.totalTokens.toLocaleString()}</span>
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

export default AdminDashboardPage;
