import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import apiClient, { getErrorMessage } from '../services/apiClient';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, token, updateProfileState, setHasUnsavedChanges } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingAdvisor, setIsGeneratingAdvisor] = useState(false);
  const [advisorResponse, setAdvisorResponse] = useState<string>('');

  // Use state instead of props so they can be modified
  const [profileData, setProfileData] = useState({
    firstName: user?.username?.split(' ')[0] || 'John',
    lastName: user?.username?.split(' ')[1] || 'Doe',
    email: user?.email || 'demo@health.com',
    username: user?.username || 'johndoe',
    age: 28,
    gender: 'male',
    height: 175, // cm
    weight: 70, // kg
    activityLevel: 'moderately_active',
    goal: 'recomposition',
    goals: ['weight loss', 'muscle gain', 'better sleep'],
    bio: 'Health enthusiast focused on sustainable lifestyle changes and personal growth.',
    joinDate: '2024-01-15',
    profileImage: null as string | null
  });

  const [originalProfileData, setOriginalProfileData] = useState<typeof profileData | null>(null);

  const [healthStats, setHealthStats] = useState({
    totalWorkouts: 0,
    totalSteps: 0,
    totalCaloriesBurned: 0,
    streakDays: 0,
    achievements: 3,
    goalsCompleted: 3
  });

  const isDirty = useMemo(() => {
    if (!originalProfileData) return false;
    return (
      profileData.firstName !== originalProfileData.firstName ||
      profileData.lastName !== originalProfileData.lastName ||
      profileData.age !== originalProfileData.age ||
      profileData.gender !== originalProfileData.gender ||
      profileData.height !== originalProfileData.height ||
      profileData.weight !== originalProfileData.weight ||
      profileData.activityLevel !== originalProfileData.activityLevel ||
      profileData.goal !== originalProfileData.goal ||
      profileData.profileImage !== originalProfileData.profileImage
    );
  }, [profileData, originalProfileData]);

  useEffect(() => {
    setHasUnsavedChanges(isEditing && isDirty);
  }, [isEditing, isDirty, setHasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing, isDirty]);

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/profile');
        const payload = response.data;
        if (payload && payload.success && payload.data?.userProfile) {
          const up = payload.data.userProfile;
          const name = up.name || user?.username || '';
          const [first, ...lastParts] = name.split(' ');
          const last = lastParts.join(' ');
          
          const loadedData = {
            firstName: first || 'John',
            lastName: last || 'Doe',
            email: user?.email || 'demo@health.com',
            username: user?.username || 'johndoe',
            age: up.age || 28,
            gender: up.sex || 'male',
            height: up.height || 175,
            weight: up.weight || 70,
            activityLevel: up.activityLevel || 'moderately_active',
            goal: up.goal || 'recomposition',
            goals: ['weight loss', 'muscle gain', 'better sleep'],
            bio: 'Health enthusiast focused on sustainable lifestyle changes and personal growth.',
            joinDate: up.createdAt ? new Date(up.createdAt).toISOString().split('T')[0] : '2024-01-15',
            profileImage: up.profileImage || null
          };

          setProfileData(loadedData);
          setOriginalProfileData(loadedData);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  useEffect(() => {
    if (!token) return;
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get('/api/analytics/consistency');
        const payload = response.data;
        if (payload.success && payload.data) {
          const { averages } = payload.data;
          const streak = averages.streak || 0;
          const totalWorkouts = averages.totalWorkouts || 0;
          
          setHealthStats(prev => ({
            ...prev,
            streakDays: streak,
            totalWorkouts: totalWorkouts,
            totalCaloriesBurned: totalWorkouts * 450,
            totalSteps: (totalWorkouts * 10000) + (streak * 4000)
          }));
        }
      } catch (err) {
        console.error('Error fetching profile analytics:', err);
      }
    };
    fetchAnalytics();
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['profile', 'metrics', 'health', 'achievements'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleGenerateAdvisorPlan = async () => {
    setIsGeneratingAdvisor(true);
    setAdvisorResponse('');
    try {
      const response = await geminiService.generateStudentDietStrategy({
        age: profileData.age,
        gender: profileData.gender,
        height: profileData.height,
        weight: profileData.weight,
        activityLevel: profileData.activityLevel,
        goal: profileData.goal,
        calorieTarget,
        macros: macroSplit
      });
      setAdvisorResponse(response);
      toast.success('Student diet plan formulated successfully!');
    } catch (err: any) {
      toast.error('Failed to generate diet strategy. Check connection/key.');
      console.error(err);
    } finally {
      setIsGeneratingAdvisor(false);
    }
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-teal-300">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-4 mb-2">{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-4 mb-2">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-3 mb-1">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        return (
          <li key={i} className="list-disc ml-6 text-slate-700 dark:text-slate-300 my-1">
            {parseBoldText(content)}
          </li>
        );
      }
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li key={i} className="list-decimal ml-6 text-slate-700 dark:text-slate-300 my-1">
            {parseBoldText(numMatch[2])}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed my-1.5">{parseBoldText(line)}</p>;
    });
  };

  const tabs = [
    { id: 'profile', label: 'My Info', icon: '👤' },
    { id: 'metrics', label: 'Body Metrics', icon: '⚖️' },
    { id: 'health', label: 'Health Stats', icon: '📊' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' }
  ];

  const achievements = [
    { id: 1, title: 'First Week Complete', description: 'Completed your first week of tracking', icon: '🎉', date: '2024-01-22', earned: true },
    { id: 2, title: 'Hydration Master', description: 'Drank 8+ glasses of water for 7 days straight', icon: '💧', date: '2024-01-25', earned: true },
    { id: 3, title: 'Step Counter', description: 'Walked 10,000+ steps for 5 consecutive days', icon: '👟', date: '2024-01-28', earned: true },
    { id: 4, title: 'Nutrition Expert', description: 'Logged meals for 30 days', icon: '🍎', date: null, earned: false },
    { id: 5, title: 'Sleep Champion', description: 'Maintained 8+ hours sleep for 2 weeks', icon: '😴', date: null, earned: false },
    { id: 6, title: 'Goal Crusher', description: 'Completed 10 health goals', icon: '🎯', date: null, earned: false }
  ];

  // Dynamic Calculators
  const { bmi, bmr, tdee, calorieTarget, macroSplit } = useMemo(() => {
    // 1. BMI Calculation (kg / m^2)
    const heightInMeters = profileData.height / 100;
    const currentBmi = heightInMeters > 0 ? Number((profileData.weight / (heightInMeters * heightInMeters)).toFixed(1)) : 0;

    // 2. BMR Calculation (Mifflin-St Jeor Equation)
    let bmrValue = (10 * profileData.weight) + (6.25 * profileData.height) - (5 * profileData.age);
    bmrValue += profileData.gender === 'male' ? 5 : -161;

    // 3. TDEE Calculation (BMR * Activity Multiplier)
    const activityMultipliers: Record<string, number> = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'super_active': 1.9
    };
    const tdeeValue = Math.round(bmrValue * (activityMultipliers[profileData.activityLevel] || 1.2));

    // 4. Calorie Target Calculation based on goal
    let calTarget = tdeeValue;
    if (profileData.goal === 'cutting') {
      calTarget -= 500;
    } else if (profileData.goal === 'bulking') {
      calTarget += 500;
    }

    // 5. Macro Targets Calculation (Standard 30% Protein / 30% Fat / 40% Carbs)
    // 1g Protein = 4 cal, 1g Fat = 9 cal, 1g Carb = 4 cal
    const proteinCals = calTarget * 0.30;
    const fatCals = calTarget * 0.30;
    const carbCals = calTarget * 0.40;

    return {
      bmi: currentBmi,
      bmr: Math.round(bmrValue),
      tdee: tdeeValue,
      calorieTarget: calTarget,
      macroSplit: {
        protein: Math.round(proteinCals / 4),
        fat: Math.round(fatCals / 9),
        carbs: Math.round(carbCals / 4)
      }
    };
  }, [profileData.weight, profileData.height, profileData.age, profileData.gender, profileData.activityLevel, profileData.goal]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileData(prev => ({ ...prev, profileImage: reader.result as string }));
      toast.success('Profile picture preview updated. Save to apply.');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileData(prev => ({ ...prev, profileImage: null }));
    toast.success('Profile picture removed. Save to apply.');
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!token) {
      toast.error('You must be logged in to save changes.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        age: profileData.age,
        sex: profileData.gender,
        height: profileData.height,
        weight: profileData.weight,
        activityLevel: profileData.activityLevel,
        goal: profileData.goal,
        profileImage: profileData.profileImage
      };

      const response = await apiClient.post('/api/profile', body);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error('Failed to update profile');
      }

      // Check where userProfile is nested in API response
      const updatedProfile = response.data?.data?.userProfile || response.data?.userProfile || body;

      const nextProfile = {
        name: updatedProfile.name || body.name,
        age: Number(updatedProfile.age) || body.age,
        sex: updatedProfile.sex || body.sex,
        height: Number(updatedProfile.height) || body.height,
        weight: Number(updatedProfile.weight) || body.weight,
        activityLevel: updatedProfile.activityLevel || body.activityLevel,
        goal: updatedProfile.goal || body.goal,
        profileImage: updatedProfile.profileImage || body.profileImage
      };

      updateProfileState(nextProfile);
      setOriginalProfileData({ ...profileData });
      setIsEditing(false);
      toast.success('Profile updated successfully! Metrics recalculated.');
    } catch (err: any) {
      const errMsg = getErrorMessage(err, 'Error updating profile.');
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (originalProfileData) {
      setProfileData({ ...originalProfileData });
    }
    setIsEditing(false);
    toast.success('Changes discarded');
  };

  // Helper function to render a single glassmorphic stat card
  const StatCard = ({ icon, title, value, subtitle, gradientBorder }: any) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-850 shadow-xl rounded-2xl overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradientBorder}`} />
      <div className="flex items-center gap-4">
        <div className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${gradientBorder} bg-opacity-10 shadow-inner`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-1">{value}</h3>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 p-4 font-sans md:p-8 animate-pulse" id="profile-loading-skeleton">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-6">
            <div className="space-y-3">
              <div className="w-64 h-10 bg-slate-905 rounded-full" />
              <div className="w-48 h-4 bg-slate-905 rounded-full" />
            </div>
            <div className="w-24 h-24 rounded-full bg-slate-905" />
          </div>
          <div className="flex gap-3 mb-8">
            <div className="w-28 h-10 bg-slate-905 rounded-full" />
            <div className="w-28 h-10 bg-slate-905 rounded-full" />
            <div className="w-28 h-10 bg-slate-905 rounded-full" />
          </div>
          <div className="h-64 rounded-3xl border border-slate-850 bg-slate-900/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-4 font-sans md:p-8">
      <div className="relative z-10 max-w-6xl mx-auto space-y-8">

        {/* Top Header / Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-6"
        >
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-[#00f0ff]">{profileData.firstName}</span>! 👋
            </h1>
            <p className="mt-2 text-lg text-slate-400 font-medium">Your personalized health and wellness dashboard.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <motion.div whileHover={{ scale: 1.05 }} className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#ccff00] to-[#00f0ff] p-1 shadow-2xl overflow-hidden">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-3xl font-bold text-white tracking-tighter shadow-inner overflow-hidden">
                  {profileData.profileImage ? (
                    <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`
                  )}
                </div>
              </motion.div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black text-white uppercase text-center px-1">Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
            {isEditing && profileData.profileImage && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 transition"
              >
                Remove Photo
              </button>
            )}
          </div>
        </motion.div>

        {/* Tab Navigation (Glassmorphic Pills) */}
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-full font-black transition-all duration-300 flex items-center gap-2 shadow-sm
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#ccff00] to-[#00f0ff] text-slate-950 shadow-md scale-105'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 border border-slate-850 backdrop-blur-md'}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Tab Content Area */}
        <AnimatePresence mode="wait">

          {/* PROFILE / INFO TAB */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-850 p-6 md:p-8 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-2 font-sans">
                  <svg className="w-6 h-6 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Personal Details
                </h2>
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="px-6 py-2 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-705 text-slate-200 border border-slate-750 transition-all shadow-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="px-6 py-2 rounded-xl font-bold text-sm bg-[#ccff00] text-slate-950 hover:bg-[#b5e000] transition-all shadow-md flex items-center gap-2"
                      >
                        {loading && <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>}
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      disabled={loading}
                      className="px-6 py-2 rounded-xl font-bold text-sm bg-slate-900 text-slate-100 border border-slate-800 hover:bg-slate-850 transition-all shadow-md"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Reusable Input Field Component inside loop for brevity */}
                {[
                  { label: "First Name", field: "firstName", type: "text" },
                  { label: "Last Name", field: "lastName", type: "text" },
                  { label: "Email Address", field: "email", type: "email", readOnly: true },
                  { label: "Age", field: "age", type: "number" },
                  { label: "Height (cm)", field: "height", type: "number" },
                  { label: "Weight (kg)", field: "weight", type: "number" },
                ].map((item) => (
                  <div key={item.field} className="relative">
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">{item.label}</label>
                    <input
                      type={item.type}
                      disabled={item.readOnly ? true : !isEditing}
                      value={profileData[item.field as keyof typeof profileData] as string | number}
                      onChange={(e) => handleInputChange(item.field, item.type === 'number' ? Number(e.target.value) : e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${item.readOnly ? 'border-slate-800 bg-slate-950/40 text-slate-500 cursor-not-allowed' : isEditing ? 'border-[#ccff00] bg-slate-900 focus:ring-2 focus:ring-[#ccff00]' : 'border-slate-800 bg-slate-950/20 text-slate-300 cursor-not-allowed'} transition-all outline-none`}
                    />
                  </div>
                ))}

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Activity Level</label>
                  <select
                    disabled={!isEditing}
                    value={profileData.activityLevel}
                    onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-[#ccff00] bg-slate-900 focus:ring-2 focus:ring-[#ccff00]' : 'border-slate-800 bg-slate-950/20 text-slate-300 cursor-not-allowed'} transition-all outline-none appearance-none`}
                  >
                    <option value="sedentary">Sedentary (Little/No Exercise)</option>
                    <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                    <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                    <option value="very_active">Very Active (6-7 days/week)</option>
                    <option value="super_active">Super Active (Physical Job/Training)</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Gender</label>
                  <select
                    disabled={!isEditing}
                    value={profileData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-[#ccff00] bg-slate-900 focus:ring-2 focus:ring-[#ccff00]' : 'border-slate-800 bg-slate-950/20 text-slate-300 cursor-not-allowed'} transition-all outline-none appearance-none`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Fitness Goal</label>
                  <select
                    disabled={!isEditing}
                    value={profileData.goal}
                    onChange={(e) => handleInputChange('goal', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-[#ccff00] bg-slate-900 focus:ring-2 focus:ring-[#ccff00]' : 'border-slate-800 bg-slate-950/20 text-slate-300 cursor-not-allowed'} transition-all outline-none appearance-none`}
                  >
                    <option value="recomposition">Recomposition (Maintain Weight)</option>
                    <option value="cutting">Cutting (Lose Weight)</option>
                    <option value="bulking">Bulking (Gain Weight)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* METRICS & CALCULATORS TAB */}
          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-[#ccff00]/10 via-slate-900/40 to-[#00f0ff]/10 rounded-3xl p-8 border border-slate-850 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl" />
                <h2 className="text-3xl font-extrabold mb-2 font-sans">Your Body Metrics</h2>
                <p className="text-slate-300 max-w-xl">
                  These calculators use the Mifflin-St Jeor formula to determine your exact daily caloric needs based on the height, weight, and activity level provided in your profile.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  icon="⚖️" title="Current BMI" value={bmi}
                  subtitle={bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal Weight' : bmi < 30 ? 'Overweight' : 'Obese'}
                  gradientBorder="from-pink-500 to-rose-400"
                />
                <StatCard
                  icon="🔥" title="Basal Metabolic Rate" value={`${bmr} cal`}
                  subtitle="Calories burned at absolute rest."
                  gradientBorder="from-orange-500 to-amber-400"
                />
                <StatCard
                  icon="⚡" title="Total Daily Energy Exp." value={`${tdee} cal`}
                  subtitle="Maintenance calories based on activity."
                  gradientBorder="from-blue-500 to-cyan-400"
                />
              </div>

              {/* Macro Targets Section */}
              <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-850 p-6 md:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-2xl font-black text-white font-sans">Daily Target Macronutrients</h3>
                  <div className="bg-[#ccff00]/10 border border-[#ccff00]/25 text-[#ccff00] px-5 py-2 rounded-2xl font-black text-lg shadow-md">
                    Calorie Target: {calorieTarget} kcal
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
                    <p className="text-[#00f0ff] font-bold text-xs uppercase tracking-wider mb-1">Protein (30%)</p>
                    <p className="text-3xl font-extrabold text-white">{macroSplit.protein}g</p>
                    <p className="text-xs text-slate-400 mt-2">Essential for muscle repair</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
                    <p className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">Fats (30%)</p>
                    <p className="text-3xl font-extrabold text-white">{macroSplit.fat}g</p>
                    <p className="text-xs text-slate-400 mt-2">Hormonal balance & energy</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
                    <p className="text-[#ccff00] font-bold text-xs uppercase tracking-wider mb-1">Carbs (40%)</p>
                    <p className="text-3xl font-extrabold text-white">{macroSplit.carbs}g</p>
                    <p className="text-xs text-slate-400 mt-2">Primary energy source</p>
                  </div>
                </div>
              </div>

              {/* AI Student Diet Advisor Card */}
              <div className="bg-slate-100 dark:bg-gradient-to-br dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-indigo-500/10 text-slate-900 dark:text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#00f0ff] opacity-5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#ccff00] opacity-5 rounded-full blur-3xl" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black flex items-center gap-2 text-indigo-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#ccff00] dark:to-[#00f0ff] font-sans">
                      <span>🤖</span> AI Student Diet Advisor
                    </h3>
                    <p className="text-slate-650 dark:text-slate-400 text-sm mt-1 max-w-xl font-medium">
                      Generate a personalized, budget-friendly meal prep strategy and grocery list tailored specifically to your body metrics and fitness goals.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAdvisorPlan}
                    disabled={isGeneratingAdvisor}
                    className="px-6 py-3 bg-gradient-to-r from-[#ccff00] to-[#00f0ff] hover:opacity-90 text-slate-950 font-black rounded-2xl transition-all shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isGeneratingAdvisor ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                        Formulating Plan...
                      </>
                    ) : (
                      'Generate Budget Student Plan'
                    )}
                  </button>
                </div>

                {advisorResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 bg-slate-950/60 border border-slate-850 rounded-2xl max-h-[500px] overflow-y-auto custom-scrollbar relative z-10"
                  >
                    <div className="font-sans text-sm leading-relaxed text-left space-y-4">
                      {renderMarkdown(advisorResponse)}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* GENERAL HEALTH STATS TAB */}
          {activeTab === 'health' && (
            <motion.div
              key="health"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard icon="🏋️‍♂️" title="Workouts" value={healthStats.totalWorkouts} subtitle="Total sessions logged" gradientBorder="from-indigo-500 to-purple-500" />
              <StatCard icon="👟" title="Total Steps" value={healthStats.totalSteps.toLocaleString()} subtitle="Miles of adventure" gradientBorder="from-teal-500 to-emerald-400" />
              <StatCard icon="❤️‍🔥" title="Calories" value={healthStats.totalCaloriesBurned.toLocaleString()} subtitle="Kcal burned actively" gradientBorder="from-rose-500 to-pink-500" />
              <StatCard icon="🔥" title="Daily Streak" value={`${healthStats.streakDays} Days`} subtitle="Keeping the momentum" gradientBorder="from-amber-500 to-orange-400" />
            </motion.div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-850 p-6 md:p-8 shadow-xl"
            >
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2 font-sans">
                <span className="text-yellow-500">🏆</span> Badges & Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((acc) => (
                  <motion.div
                    whileHover={{ scale: acc.earned ? 1.05 : 1 }}
                    key={acc.id}
                    className={`relative p-6 rounded-2xl overflow-hidden shadow-lg border ${acc.earned ? 'bg-slate-950/80 border-emerald-500/20 text-white' : 'bg-slate-950/20 border-slate-850 grayscale opacity-50 text-slate-400'}`}
                  >
                    {acc.earned && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 blur-2xl opacity-10 rounded-full" />}
                    <div className="flex gap-4 items-start">
                      <div className="text-4xl">{acc.icon}</div>
                      <div>
                        <h4 className="font-extrabold text-white text-base">{acc.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-snug">{acc.description}</p>
                        {acc.earned && <p className="text-xs font-black text-[#ccff00] mt-3 uppercase tracking-wider">Earned {new Date(acc.date!).toLocaleDateString()}</p>}
                        {!acc.earned && <p className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-wider">Locked</p>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;
