import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth } from '../lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import apiClient, { getErrorMessage } from '../services/apiClient';
import './AuthPage.css';

interface LoginPageProps {
  initialTab?: 'login' | 'signup';
}

const LoginPage: React.FC<LoginPageProps> = ({ initialTab = 'login' }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Active form state (toggled is true for Signup)
  const [isToggled, setIsToggled] = useState(initialTab === 'signup');

  // Multi-step signup stepper state (1: Account, 2: Metrics, 3: Goals)
  const [signupStep, setSignupStep] = useState(1);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Carousel slide index
  const [activeSlide, setActiveSlide] = useState(0);

  // Login Form States & Touched State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signinEmailTouched, setSigninEmailTouched] = useState(false);
  const [signinPasswordTouched, setSigninPasswordTouched] = useState(false);

  // Signup Form States & Touched States
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: 'moderately_active',
    goal: 'recomposition'
  });
  const [signupUsernameTouched, setSignupUsernameTouched] = useState(false);
  const [signupEmailTouched, setSignupEmailTouched] = useState(false);
  const [signupPasswordTouched, setSignupPasswordTouched] = useState(false);
  const [signupConfirmPasswordTouched, setSignupConfirmPasswordTouched] = useState(false);
  const [signupAgeTouched, setSignupAgeTouched] = useState(false);
  const [signupHeightTouched, setSignupHeightTouched] = useState(false);
  const [signupWeightTouched, setSignupWeightTouched] = useState(false);
  const [signupGenderTouched, setSignupGenderTouched] = useState(false);

  // UI Status States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Carousel slide definitions
  const slides = [
    {
      icon: "🏋️‍♂️",
      title: "Real-time Gym Progress Tracking",
      desc: "Log reps, loads, and sets dynamically with instant volume analysis."
    },
    {
      icon: "🥗",
      title: "Track 100+ Macro Nutrients",
      desc: "Get deep, grain-level nutritional insight with AI-powered meal recognition."
    },
    {
      icon: "🤖",
      title: "Personal- Driven AI Coach",
      desc: "Biohacking, empathy, or tough-love coaching tailored to your athletic goals."
    },
  ];

  // Rotate carousel every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Time-of-day athlete greetings
  const [greeting, setGreeting] = useState({ title: 'Welcome Back, Athlete', sub: 'Let’s fuel your session.' });
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ title: 'Good Morning, Athlete', sub: 'Ready for your morning session?' });
    } else if (hour < 17) {
      setGreeting({ title: 'Fuel Your Day, Athlete', sub: 'Let’s keep the momentum high.' });
    } else {
      setGreeting({ title: 'Fuel Your Evening Session', sub: 'Time to push your limits tonight.' });
    }
  }, [isToggled]);

  // Real-time Login Validations
  const isEmailValid = /^[^@]+@[^@]+\.[^@]+$/.test(email.trim());
  const showEmailError = signinEmailTouched && email.trim().length > 0 && !isEmailValid;
  const isPasswordValid = password.length >= 6;
  const showPasswordError = signinPasswordTouched && password.length > 0 && !isPasswordValid;
  const isFormValid = isEmailValid && isPasswordValid;

  // Real-time Signup Validations
  const isSignupUsernameValid = signupData.username.trim().length > 0;
  const showSignupUsernameError = signupUsernameTouched && !isSignupUsernameValid;

  const isSignupEmailValid = /^[^@]+@[^@]+\.[^@]+$/.test(signupData.email.trim());
  const showSignupEmailError = signupEmailTouched && signupData.email.trim().length > 0 && !isSignupEmailValid;

  const isSignupPasswordValid = signupData.password.length >= 6;
  const showSignupPasswordError = signupPasswordTouched && signupData.password.length > 0 && !isSignupPasswordValid;

  const isSignupConfirmPasswordValid = signupData.password === signupData.confirmPassword;
  const showSignupConfirmPasswordError = signupConfirmPasswordTouched && signupData.confirmPassword.length > 0 && !isSignupConfirmPasswordValid;

  const isSignupAgeValid = signupData.age ? Number(signupData.age) > 0 : false;
  const showSignupAgeError = signupAgeTouched && !isSignupAgeValid;

  const isSignupHeightValid = signupData.height ? Number(signupData.height) > 0 : false;
  const showSignupHeightError = signupHeightTouched && !isSignupHeightValid;

  const isSignupWeightValid = signupData.weight ? Number(signupData.weight) > 0 : false;
  const showSignupWeightError = signupWeightTouched && !isSignupWeightValid;

  const isSignupGenderValid = signupData.gender.length > 0;
  const showSignupGenderError = signupGenderTouched && !isSignupGenderValid;

  // Step-by-Step validation flags
  const isStep1Valid = isSignupUsernameValid && isSignupEmailValid && isSignupPasswordValid && isSignupConfirmPasswordValid;
  const isStep2Valid = isSignupAgeValid && isSignupHeightValid && isSignupWeightValid && isSignupGenderValid;
  const isStep3Valid = signupData.goal.length > 0 && signupData.activityLevel.length > 0;

  const isSignupFormValid = isStep1Valid && isStep2Valid && isStep3Valid;

  // Sync tab state on url change
  useEffect(() => {
    setIsToggled(initialTab === 'signup');
    setSignupStep(1);
    setError('');
    setSuccess(false);
  }, [initialTab]);

  const handleTabChange = (targetSignup: boolean) => {
    setIsToggled(targetSignup);
    setSignupStep(1);
    setError('');
    setSuccess(false);
    navigate(targetSignup ? '/signup' : '/login');
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSignupData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGoalSelect = (goalId: string) => {
    setSignupData(prev => ({
      ...prev,
      goal: goalId
    }));
  };

  // Login Call Helper
  const loginWithBackend = async (loginEmail: string, loginPassword: string) => {
    const response = await apiClient.post('/api/auth/login', {
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword
    });

    const payload = response.data;
    if (!payload.success) throw new Error(payload.error?.message || 'Login failed');

    const { token, user } = payload.data || {};
    login(token, user);
    setSuccess(true);
    toast.success('Login successful! Welcome back!');

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 700);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await loginWithBackend(email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(getErrorMessage(err, 'Login failed. Please try again.'));
      }
      toast.error(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Signup
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignupFormValid) {
      setError('Please fill in all details correctly.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      let firebaseUserCreated = false;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
        await sendEmailVerification(userCredential.user);
        firebaseUserCreated = true;
      } catch (fbErr: any) {
        console.warn('⚠️ Firebase signup failed or disabled. Registering directly...', fbErr);
      }

      const response = await apiClient.post('/api/auth/signup', signupData);
      const payload = response.data;
      if (!payload.success) throw new Error(payload.error?.message || 'Error saving user profile to database');

      setSuccess(true);
      if (firebaseUserCreated) {
        toast.success('Account created! Please check your email for the verification link.', { duration: 5000 });
      } else {
        toast.success('Account created! You can now log in.', { duration: 5000 });
      }

      setTimeout(() => {
        setIsToggled(false);
        navigate('/login');
        setEmail(signupData.email);
        setPassword('');

        setSignupData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          age: '',
          gender: '',
          height: '',
          weight: '',
          activityLevel: 'moderately_active',
          goal: 'recomposition'
        });
        setSignupStep(1);
        setSignupUsernameTouched(false);
        setSignupEmailTouched(false);
        setSignupPasswordTouched(false);
        setSignupConfirmPasswordTouched(false);
        setSignupAgeTouched(false);
        setSignupHeightTouched(false);
        setSignupWeightTouched(false);
        setSignupGenderTouched(false);

        setIsLoading(false);
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Signup Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(getErrorMessage(err, 'Signup failed. Please try again.'));
      }
      toast.error(getErrorMessage(err, 'Signup failed.'));
      setIsLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await apiClient.post('/api/auth/firebase', { idToken });
      const payload = response.data;
      if (!payload.success) throw new Error(payload.error?.message || 'Google Auth failed');

      const { token, user } = payload.data || {};
      login(token, user);
      setSuccess(true);
      toast.success('Google Authentication successful!');

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err, 'Failed to authenticate with Google'));
      toast.error(getErrorMessage(err, 'Google Authentication encountered an error.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    toast.error('Apple Sign-In is not configured for this demo environment.');
  };

  return (
    <div className="auth-page-container">
      {/* LEFT SIDE: THE HOOK (Branding + Rotating proof-of-value carousel) */}
      <div className="auth-branding-panel">
        <div className="auth-branding-header">
          <div className="auth-branding-logo">🏋️‍♂️</div>
          <h1>Health Hub</h1>
          <p className="tagline">Active Guidance & Athletic Analytics</p>
        </div>

        {/* Dynamic Carousel */}
        <div className="carousel-wrapper">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`carousel-slide-item ${idx === activeSlide ? 'active' : ''}`}
            >
              <div className="slide-icon">{slide.icon}</div>
              <div className="slide-content">
                <h3>{slide.title}</h3>
                <p>{slide.desc}</p>
              </div>
            </div>
          ))}
          {/* Indicators */}
          <div className="carousel-dots">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: THE FOCUS (Authentication Card) */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Contextual Greeting Header */}
          <div className="auth-card-header">
            <h2>{!isToggled ? greeting.title : 'Join the Hub'}</h2>
            <p>{!isToggled ? greeting.sub : 'Fuel your potential by setting up your athletic profile.'}</p>
          </div>

          {/* Tab Selection Pill */}
          <div className="tab-selector">
            <button
              className={!isToggled ? 'active' : ''}
              onClick={() => handleTabChange(false)}
            >
              Sign In
            </button>
            <button
              className={isToggled ? 'active' : ''}
              onClick={() => handleTabChange(true)}
            >
              Sign Up
            </button>
          </div>

          {/* Form Alerts */}
          {error && <div className="alert-message alert-error">{error}</div>}
          {success && <div className="alert-message alert-success">✓ Syncing with dashboard...</div>}

          {/* SIGN IN VIEW */}
          {!isToggled ? (
            <div className="form-fade-container">
              <form onSubmit={handleLoginSubmit}>
                {/* Email Address */}
                <div className="field-wrapper">
                  <div className="input-container">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setSigninEmailTouched(true)}
                      className={(email ? 'has-value ' : '') + (showEmailError ? 'has-error' : (signinEmailTouched && isEmailValid ? 'is-valid' : ''))}
                      required
                      disabled={isLoading || success}
                      placeholder=" "
                      autoComplete="off"
                    />
                    <label>Email Address</label>
                    <i className="fa-solid fa-envelope"></i>
                    {signinEmailTouched && (
                      <span className="validation-indicator-icon">
                        {isEmailValid ? (
                          <i className="fa-solid fa-circle-check success-color"></i>
                        ) : (
                          <i className="fa-solid fa-triangle-exclamation error-color"></i>
                        )}
                      </span>
                    )}
                  </div>
                  {showEmailError && <span className="error-text">Please enter a valid email address.</span>}
                </div>

                {/* Password */}
                <div className="field-wrapper">
                  <div className="input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setSigninPasswordTouched(true)}
                      className={(password ? 'has-value ' : '') + (showPasswordError ? 'has-error' : (signinPasswordTouched && isPasswordValid ? 'is-valid' : ''))}
                      required
                      disabled={isLoading || success}
                      placeholder=" "
                      autoComplete="new-password"
                    />
                    <label>Password</label>
                    <i className="fa-solid fa-lock"></i>

                    {/* Password Visibility Toggle */}
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(prev => !prev)}
                      tabIndex={-1}
                    >
                      <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                    </button>
                  </div>
                  {showPasswordError && <span className="error-text">Password must be at least 6 characters.</span>}
                </div>

                {/* Signin Button */}
                <button
                  className="submit-button"
                  type="submit"
                  disabled={isLoading || success || !isFormValid}
                >
                  {isLoading ? (
                    <span className="btn-spinner-container">
                      <svg className="spinner" viewBox="0 0 50 50">
                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                      </svg>
                      Signing In...
                    </span>
                  ) : 'Sign In'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a3a3a3',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#a3a3a3'}
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>

              <div className="divider-text">OR</div>

              {/* Social Options */}
              <div className="auth-options-container">
                <button
                  className="social-btn google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || success}
                >
                  <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                <button
                  className="social-btn apple-btn"
                  onClick={handleAppleSignIn}
                  disabled={isLoading || success}
                >
                  <i className="fa-brands fa-apple"></i>
                  Apple
                </button>
              </div>

              <div className="credentials-info-box" style={{ marginTop: '24px' }}>
                <strong>Demo Credentials:</strong><br />
                Email: demo@health.com / Password: password123
              </div>
            </div>
          ) : (
            /* SIGN UP VIEW WITH PROGRESSIVE STEPPER */
            <div className="form-fade-container">
              {/* Stepper Progress bar */}
              <div className="stepper-indicator">
                <div className={`step-dot ${signupStep >= 1 ? 'active' : ''} ${signupStep > 1 ? 'completed' : ''}`}>
                  <span>1</span>
                </div>
                <div className={`step-bar ${signupStep > 1 ? 'active' : ''}`} />
                <div className={`step-dot ${signupStep >= 2 ? 'active' : ''} ${signupStep > 2 ? 'completed' : ''}`}>
                  <span>2</span>
                </div>
                <div className={`step-bar ${signupStep > 2 ? 'active' : ''}`} />
                <div className={`step-dot ${signupStep >= 3 ? 'active' : ''}`}>
                  <span>3</span>
                </div>
              </div>

              <form onSubmit={handleSignupSubmit}>
                {/* STEP 1: ACCOUNT DETAILS */}
                {signupStep === 1 && (
                  <div className="step-fade-container">
                    <h3 className="step-title">Account Details</h3>
                    <p className="step-subtitle">Start by creating your secure account credentials.</p>

                    {/* Username */}
                    <div className="field-wrapper">
                      <div className="input-container">
                        <input
                          type="text"
                          name="username"
                          value={signupData.username}
                          onChange={handleSignupChange}
                          onBlur={() => setSignupUsernameTouched(true)}
                          className={(signupData.username ? 'has-value ' : '') + (showSignupUsernameError ? 'has-error' : (signupUsernameTouched && isSignupUsernameValid ? 'is-valid' : ''))}
                          required
                          disabled={isLoading || success}
                          placeholder=" "
                          autoComplete="off"
                        />
                        <label>Username</label>
                        <i className="fa-solid fa-user"></i>
                        {signupUsernameTouched && (
                          <span className="validation-indicator-icon">
                            {isSignupUsernameValid ? (
                              <i className="fa-solid fa-circle-check success-color"></i>
                            ) : (
                              <i className="fa-solid fa-triangle-exclamation error-color"></i>
                            )}
                          </span>
                        )}
                      </div>
                      {showSignupUsernameError && <span className="error-text">Username is required.</span>}
                    </div>

                    {/* Email */}
                    <div className="field-wrapper">
                      <div className="input-container">
                        <input
                          type="email"
                          name="email"
                          value={signupData.email}
                          onChange={handleSignupChange}
                          onBlur={() => setSignupEmailTouched(true)}
                          className={(signupData.email ? 'has-value ' : '') + (showSignupEmailError ? 'has-error' : (signupEmailTouched && isSignupEmailValid ? 'is-valid' : ''))}
                          required
                          disabled={isLoading || success}
                          placeholder=" "
                          autoComplete="off"
                        />
                        <label>Email Address</label>
                        <i className="fa-solid fa-envelope"></i>
                        {signupEmailTouched && (
                          <span className="validation-indicator-icon">
                            {isSignupEmailValid ? (
                              <i className="fa-solid fa-circle-check success-color"></i>
                            ) : (
                              <i className="fa-solid fa-triangle-exclamation error-color"></i>
                            )}
                          </span>
                        )}
                      </div>
                      {showSignupEmailError && <span className="error-text">Valid email is required.</span>}
                    </div>

                    {/* Password */}
                    <div className="field-wrapper">
                      <div className="input-container">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={signupData.password}
                          onChange={handleSignupChange}
                          onBlur={() => setSignupPasswordTouched(true)}
                          className={(signupData.password ? 'has-value ' : '') + (showSignupPasswordError ? 'has-error' : (signupPasswordTouched && isSignupPasswordValid ? 'is-valid' : ''))}
                          required
                          disabled={isLoading || success}
                          placeholder=" "
                          autoComplete="new-password"
                        />
                        <label>Password</label>
                        <i className="fa-solid fa-lock"></i>
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(prev => !prev)}
                          tabIndex={-1}
                        >
                          <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                        </button>
                      </div>
                      {showSignupPasswordError && <span className="error-text">Must be at least 6 characters.</span>}
                    </div>

                    {/* Confirm Password */}
                    <div className="field-wrapper">
                      <div className="input-container">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={signupData.confirmPassword}
                          onChange={handleSignupChange}
                          onBlur={() => setSignupConfirmPasswordTouched(true)}
                          className={(signupData.confirmPassword ? 'has-value ' : '') + (showSignupConfirmPasswordError ? 'has-error' : (signupConfirmPasswordTouched && isSignupConfirmPasswordValid ? 'is-valid' : ''))}
                          required
                          disabled={isLoading || success}
                          placeholder=" "
                          autoComplete="new-password"
                        />
                        <label>Confirm Password</label>
                        <i className="fa-solid fa-check-double"></i>
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowConfirmPassword(prev => !prev)}
                          tabIndex={-1}
                        >
                          <i className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                        </button>
                      </div>
                      {showSignupConfirmPasswordError && <span className="error-text">Passwords must match.</span>}
                    </div>

                    {/* Validation Criteria */}
                    {(signupData.password.length > 0 || signupData.confirmPassword.length > 0) && (
                      <div className="validation-checklist">
                        <div className={`validation-item ${isSignupPasswordValid ? 'success' : 'error'}`}>
                          {isSignupPasswordValid ? '✓' : '✗'} At least 6 characters
                        </div>
                        <div className={`validation-item ${isSignupConfirmPasswordValid && signupData.confirmPassword.length > 0 ? 'success' : 'error'}`}>
                          {isSignupConfirmPasswordValid && signupData.confirmPassword.length > 0 ? '✓' : '✗'} Passwords match
                        </div>
                      </div>
                    )}

                    <div className="step-actions">
                      <button
                        type="button"
                        className="stepper-next-btn"
                        onClick={() => setSignupStep(2)}
                        disabled={!isStep1Valid}
                      >
                        Next: Body Metrics <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: BODY METRICS */}
                {signupStep === 2 && (
                  <div className="step-fade-container">
                    <h3 className="step-title">Body Metrics</h3>
                    <p className="step-subtitle">Provide metrics for dynamic calorie and BMI calculations.</p>

                    <div className="signup-fields-grid">
                      {/* Age */}
                      <div className="field-wrapper">
                        <div className="input-container">
                          <input
                            type="number"
                            name="age"
                            value={signupData.age}
                            onChange={handleSignupChange}
                            onBlur={() => setSignupAgeTouched(true)}
                            className={(signupData.age ? 'has-value ' : '') + (showSignupAgeError ? 'has-error' : (signupAgeTouched && isSignupAgeValid ? 'is-valid' : ''))}
                            required
                            disabled={isLoading || success}
                            placeholder=" "
                          />
                          <label>Age</label>
                          <i className="fa-solid fa-calendar"></i>
                        </div>
                        {showSignupAgeError && <span className="error-text">Valid age is required.</span>}
                      </div>

                      {/* Gender */}
                      <div className="field-wrapper">
                        <div className="input-container">
                          <select
                            name="gender"
                            value={signupData.gender}
                            onChange={handleSignupChange}
                            onBlur={() => setSignupGenderTouched(true)}
                            className={(signupData.gender ? 'has-value ' : '') + (showSignupGenderError ? 'has-error' : (signupGenderTouched && isSignupGenderValid ? 'is-valid' : ''))}
                            required
                            disabled={isLoading || success}
                          >
                            <option value=""></option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                          <label>Gender</label>
                          <i className="fa-solid fa-venus-mars"></i>
                        </div>
                        {showSignupGenderError && <span className="error-text">Gender is required.</span>}
                      </div>

                      {/* Height */}
                      <div className="field-wrapper">
                        <div className="input-container">
                          <input
                            type="number"
                            name="height"
                            value={signupData.height}
                            onChange={handleSignupChange}
                            onBlur={() => setSignupHeightTouched(true)}
                            className={(signupData.height ? 'has-value ' : '') + (showSignupHeightError ? 'has-error' : (signupHeightTouched && isSignupHeightValid ? 'is-valid' : ''))}
                            required
                            disabled={isLoading || success}
                            placeholder=" "
                          />
                          <label>Height (cm)</label>
                          <i className="fa-solid fa-ruler-vertical"></i>
                        </div>
                        {showSignupHeightError && <span className="error-text">Height must be &gt; 0.</span>}
                      </div>

                      {/* Weight */}
                      <div className="field-wrapper">
                        <div className="input-container">
                          <input
                            type="number"
                            name="weight"
                            value={signupData.weight}
                            onChange={handleSignupChange}
                            onBlur={() => setSignupWeightTouched(true)}
                            className={(signupData.weight ? 'has-value ' : '') + (showSignupWeightError ? 'has-error' : (signupWeightTouched && isSignupWeightValid ? 'is-valid' : ''))}
                            required
                            disabled={isLoading || success}
                            placeholder=" "
                          />
                          <label>Weight (kg)</label>
                          <i className="fa-solid fa-weight-scale"></i>
                        </div>
                        {showSignupWeightError && <span className="error-text">Weight must be &gt; 0.</span>}
                      </div>
                    </div>

                    <div className="step-actions dual-actions">
                      <button
                        type="button"
                        className="stepper-back-btn"
                        onClick={() => setSignupStep(1)}
                      >
                        <i className="fa-solid fa-arrow-left"></i> Back
                      </button>
                      <button
                        type="button"
                        className="stepper-next-btn"
                        onClick={() => setSignupStep(3)}
                        disabled={!isStep2Valid}
                      >
                        Next: Objectives <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: GOALS & ACTIVITY LEVEL */}
                {signupStep === 3 && (
                  <div className="step-fade-container">
                    <h3 className="step-title">Primary Objective</h3>
                    <p className="step-subtitle">Select your focus target below. Accent highlights signal active states.</p>

                    {/* Goal Selective Cards */}
                    <div className="goal-chips-grid">
                      <div
                        className={`goal-chip-card ${signupData.goal === 'bulking' ? 'selected' : ''}`}
                        onClick={() => handleGoalSelect('bulking')}
                      >
                        <div className="chip-icon">💪</div>
                        <div className="chip-content">
                          <h4>Gain Muscle</h4>
                          <p>Increase power & hypertrophy</p>
                        </div>
                      </div>
                      <div
                        className={`goal-chip-card ${signupData.goal === 'cutting' ? 'selected' : ''}`}
                        onClick={() => handleGoalSelect('cutting')}
                      >
                        <div className="chip-icon">🔥</div>
                        <div className="chip-content">
                          <h4>Lose Fat</h4>
                          <p>Shred fat, retain lean mass</p>
                        </div>
                      </div>
                      <div
                        className={`goal-chip-card ${signupData.goal === 'recomposition' ? 'selected' : ''}`}
                        onClick={() => handleGoalSelect('recomposition')}
                      >
                        <div className="chip-icon">⚡</div>
                        <div className="chip-content">
                          <h4>Maintain Health</h4>
                          <p>Optimize body composition</p>
                        </div>
                      </div>
                    </div>

                    {/* Activity Level selection */}
                    <div className="field-wrapper" style={{ marginTop: '24px' }}>
                      <div className="input-container">
                        <select
                          name="activityLevel"
                          value={signupData.activityLevel}
                          onChange={handleSignupChange}
                          className="has-value"
                          required
                          disabled={isLoading || success}
                        >
                          <option value="sedentary">Sedentary (No formal exercise)</option>
                          <option value="lightly_active">Lightly Active (1-3 days/wk gym)</option>
                          <option value="moderately_active">Moderately Active (3-5 days/wk training)</option>
                          <option value="very_active">Very Active (6-7 days/wk heavy training)</option>
                          <option value="super_active">Super Active (Physical job + training)</option>
                        </select>
                        <label>Activity Level</label>
                        <i className="fa-solid fa-person-running"></i>
                      </div>
                    </div>

                    <div className="step-actions dual-actions">
                      <button
                        type="button"
                        className="stepper-back-btn"
                        onClick={() => setSignupStep(2)}
                      >
                        <i className="fa-solid fa-arrow-left"></i> Back
                      </button>

                      <button
                        className="submit-button final-submit-btn"
                        type="submit"
                        disabled={isLoading || success || !isSignupFormValid}
                      >
                        {isLoading ? (
                          <span className="btn-spinner-container">
                            <svg className="spinner" viewBox="0 0 50 50">
                              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                            </svg>
                            Creating Profile...
                          </span>
                        ) : 'Create Profile'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
