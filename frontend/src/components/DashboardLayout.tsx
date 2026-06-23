import * as React from 'react';
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, Check, RefreshCw } from 'lucide-react';
import apiClient, { getErrorMessage } from '../services/apiClient';
import toast from 'react-hot-toast';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isResending, setIsResending] = useState(false);
  const { user, logout, profile, hasUnsavedChanges, setHasUnsavedChanges } = useAuth();
  const navigate = useNavigate();

  const handleDropdownNavigate = (path: string) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave? Your changes will be lost.');
      if (!confirmLeave) return;
      setHasUnsavedChanges(false);
    }
    navigate(path);
    setProfileDropdownOpen(false);
  };

  const handleSignOutClick = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave? Your changes will be lost.');
      if (!confirmLeave) return;
      setHasUnsavedChanges(false);
    }
    logout();
    navigate('/login');
    setProfileDropdownOpen(false);
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/api/notifications');
      if (response.data?.success) {
        setNotifications(response.data.data?.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await apiClient.post('/api/auth/resend-verification');
      toast.success(response.data?.data?.message || 'Verification email sent!');
    } catch (error: any) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Failed to resend verification email.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to update notification status.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update notifications.');
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification cleared.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete notification.');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-screen overflow-hidden font-sans bg-slate-950 text-slate-100 flex flex-col">
      {/* Email Verification Banner */}
      {user && !user.isEmailVerified && (
        <div className="bg-yellow-500/10 border-b border-yellow-550/30 text-yellow-300 px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold z-50">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Your email address is unverified. Database modifications and workout updates are locked.</span>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="px-3.5 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-xl font-bold uppercase transition disabled:opacity-50 text-xs border border-yellow-500/20"
          >
            {isResending ? 'Dispatching...' : 'Resend Mail'}
          </button>
        </div>
      )}

      {/* Mobile/Top Header */}
      <header className="relative z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-900 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-900 transition-colors focus:outline-none"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center text-white shadow-md">
              🏥
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-450">
              Health Intelligence
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition"
            >
              <Bell className="w-5.5 h-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-45" onClick={() => setNotificationsOpen(false)} />

                  {/* Dropdown Menu */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-[-40px] sm:right-0 mt-2 w-80 rounded-2xl bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-slate-800 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                      <p className="text-sm font-bold text-white">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 hover:text-emerald-300 transition"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-450 font-medium">
                          No notifications to show.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => handleMarkAsRead(item._id)}
                            className={`px-4 py-3 hover:bg-slate-850/50 transition cursor-pointer flex gap-3 items-start relative ${
                              !item.read ? 'bg-slate-900/40' : ''
                            }`}
                          >
                            {!item.read && (
                              <span className="absolute left-1.5 top-4.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold text-slate-100 truncate ${!item.read ? 'text-white' : ''}`}>
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">
                                {item.message}
                              </p>
                              <p className="text-[9px] text-slate-550 mt-1.5">
                                {new Date(item.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotification(item._id, e)}
                              className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 overflow-hidden"
            >
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (() => {
                  if (profile?.name) {
                    const parts = profile.name.trim().split(/\s+/);
                    if (parts.length >= 2) {
                      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
                    }
                    return parts[0].charAt(0).toUpperCase();
                  }
                  return user?.username?.charAt(0).toUpperCase() || 'U';
                })()
              )}
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />

                  {/* Dropdown Menu */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-slate-800 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-sm font-semibold text-white truncate">
                        {profile?.name || user?.username || 'User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => handleDropdownNavigate('/profile')}
                        className="w-full text-left px-3 py-2 text-sm text-slate-350 hover:bg-slate-800 rounded-xl transition flex items-center gap-2"
                      >
                        <span className="text-lg">👤</span> My Profile
                      </button>
                      <button
                        onClick={() => handleDropdownNavigate('/settings')}
                        className="w-full text-left px-3 py-2 text-sm text-slate-350 hover:bg-slate-800 rounded-xl transition flex items-center gap-2"
                      >
                        <span className="text-lg">⚙️</span> Settings
                      </button>
                    </div>

                    <div className="p-2 bg-slate-950 border-t border-slate-800">
                      <button
                        onClick={handleSignOutClick}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-950/20 rounded-xl transition flex items-center gap-2"
                      >
                        <span className="text-lg">🚪</span> Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Integrated visually with Dashboard layout */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 relative h-full overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
