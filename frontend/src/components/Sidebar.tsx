import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Bot, BrainCircuit, Camera, Dumbbell, LineChart, LogOut, Moon, Scale, Target, UserRound, Utensils, ChefHat, BookOpen, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, profile, hasUnsavedChanges, setHasUnsavedChanges } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuSections = React.useMemo(() => {
    const sections = [
      {
        title: 'Intelligence',
        items: [
          { id: 'dashboard', label: 'Command Center', icon: BarChart3, path: '/dashboard' },
          { id: 'intelligence', label: 'AI Analyst Console', icon: BrainCircuit, path: '/intelligence' },
          { id: 'recommendations', label: 'Smart Insights', icon: LineChart, path: '/recommendations' },
        ]
      },
      {
        title: 'Tracking',
        items: [
          { id: 'upload', label: 'Food Scanner Lab', icon: Camera, path: '/upload' },
          { id: 'eat-this-much', label: 'Eat This Much AI', icon: ChefHat, path: '/eat-this-much' },
          { id: 'nutrition', label: 'Meal Tracker', icon: Target, path: '/nutrition' },
          { id: 'muscle-wiki', label: 'Muscle Wiki Lab', icon: BookOpen, path: '/muscle-wiki' },
          { id: 'workouts', label: 'Gym Planner', icon: Dumbbell, path: '/gym' },
          { id: 'lifestyle', label: 'Lifestyle Log', icon: Moon, path: '/lifestyle' },
        ]
      },
      {
        title: 'Progress',
        items: [
          { id: 'progress', label: 'Progress Lab', icon: Scale, path: '/progress' },
          { id: 'profile', label: 'Athlete Profile & Goals', icon: UserRound, path: '/profile' },
        ]
      }
    ];

    if (user?.role === 'admin') {
      sections.push({
        title: 'Administration',
        items: [
          { id: 'admin', label: 'Control Console', icon: ShieldAlert, path: '/admin' }
        ]
      });
    }

    return sections;
  }, [user]);

  const menuItems = React.useMemo(() => menuSections.flatMap((section) => section.items), [menuSections]);

  const handleItemClick = (item: any) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave? Your changes will be lost.');
      if (!confirmLeave) return;
      setHasUnsavedChanges(false);
    }
    setActiveItem(item.id);
    navigate(item.path);
    if (window.innerWidth < 1024) {
      onClose(); // Close sidebar on mobile after navigation
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Update active item based on current location
  React.useEffect(() => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const fullPath = currentPath + currentSearch;
    const currentItem = menuItems.find(item => item.path === fullPath) || menuItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [location.pathname, location.search, menuItems]);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-850 transform transition-transform duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)] z-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-full`}
      >
        {/* Header - Mobile Only */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              🏥
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Health Hub
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
          <div className="space-y-6">
            {menuSections.map((section) => (
              <div key={section.title}>
                <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {section.title}
                </p>
                <ul className="space-y-1.5">
                  {section.items.map((item) => {
                    const isActive = activeItem === item.id;
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleItemClick(item)}
                          className={`relative w-full group flex items-center px-4 py-3 rounded-2xl transition-all duration-200 ${isActive
                              ? 'bg-[#ccff00]/10 border border-[#ccff00]/25 text-[#ccff00] font-bold shadow-sm'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium border border-transparent'
                            }`}
                        >
                          <span className={`mr-4 transition-transform ${isActive ? 'scale-110 text-[#ccff00]' : 'group-hover:scale-110'}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="text-left">{item.label}</span>
                          {isActive && (
                            <motion.div layoutId="sidebar-active" className="absolute left-0 w-1.5 h-8 bg-[#ccff00] rounded-r-full" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 m-4 mt-auto rounded-3xl bg-slate-950/60 border border-slate-850 backdrop-blur-md hidden lg:block">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md overflow-hidden">
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
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{profile?.name || user?.username || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-350 transition hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
