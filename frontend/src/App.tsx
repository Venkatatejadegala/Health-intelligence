import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const EnhancedNutritionTrackerPage = React.lazy(() => import('./pages/EnhancedNutritionTrackerPage'));
const UploadPage = React.lazy(() => import('./pages/UploadPage'));
const RecommendationsPage = React.lazy(() => import('./pages/RecommendationsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const GymPlannerPage = React.lazy(() => import('./pages/GymPlannerPage'));
const IntelligenceOverviewPage = React.lazy(() => import('./pages/IntelligenceOverviewPage'));
const LifestyleLogPage = React.lazy(() => import('./pages/LifestyleLogPage'));
const ProgressLabPage = React.lazy(() => import('./pages/ProgressLabPage'));
const MuscleWikiPage = React.lazy(() => import('./pages/MuscleWikiPage'));
const EatThisMuchPage = React.lazy(() => import('./pages/EatThisMuchPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));

// Welcome Page Component (redirects to login)
const WelcomePage: React.FC = () => {
  React.useEffect(() => {
    // Automatically redirect to login
    window.location.href = '/login';
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
        margin: '1rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '24px'
        }}>
          🏥
        </div>
        <h1 style={{ 
          color: '#1f2937', 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          Health Dashboard
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '1rem',
          marginBottom: '1rem'
        }}>
          Redirecting to login...
        </p>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
      </div>
    </div>
  );
};


const AppContent: React.FC = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    const finalClass = 'theme-light';
    document.documentElement.className = finalClass;
    document.body.className = finalClass;
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <React.Suspense fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage initialTab="login" />} />
          <Route path="/signup" element={<LoginPage initialTab="signup" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          
          {/* Protected Routes using DashboardLayout */}
          <Route element={user ? <DashboardLayout /> : <LoginPage />}> 
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/nutrition" element={<EnhancedNutritionTrackerPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/intelligence" element={<IntelligenceOverviewPage />} />
            <Route path="/gym" element={<GymPlannerPage />} />
            <Route path="/lifestyle" element={<LifestyleLogPage />} />
            <Route path="/progress" element={<ProgressLabPage />} />
            <Route path="/muscle-wiki" element={<MuscleWikiPage />} />
            <Route path="/eat-this-much" element={<EatThisMuchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {user?.role === 'admin' && (
              <Route path="/admin" element={<AdminDashboardPage />} />
            )}
            <Route path="*" element={<DashboardPage />} />
          </Route>

          {/* Fallback for unauthenticated users */}
          {!user && <Route path="*" element={<LoginPage />} />}
        </Routes>
      </React.Suspense>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
