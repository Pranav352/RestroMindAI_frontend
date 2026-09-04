import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import AuthLayout from '../layouts/AuthLayout';

const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('registered') === 'true') {
      setShowSuccess(true);
    }
  }, [location]);

  const validate = () => {
    const tempErrors = {};
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setShowSuccess(false);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/auth/login/', {
        email: formData.email,
        password: formData.password,
      });
      const { access, refresh } = response.data;

      localStorage.setItem('access_token', access);
      
      const meResponse = await api.get('/api/auth/me/');
      const userData = meResponse.data;

      await login({ access, refresh }, userData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      localStorage.removeItem('access_token');

      if (err.response && err.response.data) {
        setApiError(err.response.data.detail || err.response.data.error || 'Invalid email or password credentials.');
      } else {
        setApiError('Unable to connect to server. Please check your network connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login Hero Left Section
  const heroCustomContent = (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#131522]/80 border border-[#23273b] backdrop-blur-md">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-white text-sm">30-Day Instant Trial</h3>
          <p className="text-xs text-gray-400 mt-1">Start immediately without admin lockouts.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#131522]/80 border border-[#23273b] backdrop-blur-md">
          <div className="h-9 w-9 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3 text-orange-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-semibold text-white text-sm">Live KDS Sync</h3>
          <p className="text-xs text-gray-400 mt-1">Zero-delay kitchen order dispatching.</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 flex items-center gap-4">
        <div className="flex -space-x-2 overflow-hidden">
          <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#0a0b10] bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">R1</div>
          <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#0a0b10] bg-orange-500 text-slate-950 font-bold flex items-center justify-center text-xs">R2</div>
          <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#0a0b10] bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs">R3</div>
        </div>
        <p className="text-xs text-gray-300 font-medium">
          Over <span className="text-amber-400 font-bold">10,000+ customer orders</span> served smoothly every day.
        </p>
      </div>
    </div>
  );

  return (
    <AuthLayout
      heroTitle="Manage Your Digital Menu & Kitchen"
      heroHighlight="Effortlessly."
      heroSubtitle="Empower your restaurant with real-time KDS ordering, instant table QR generation, and automated free trial setup."
      heroCustomContent={heroCustomContent}
      cardTitle="Welcome Back 👋"
      cardSubtitle="Sign in to access your restaurant dashboard and KDS order board."
    >
      {showSuccess && (
        <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-sm flex items-start gap-3 backdrop-blur-md animate-fade-in">
          <svg className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-emerald-300">Registration Submitted!</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">Your owner account has been created. Please log in with your credentials.</p>
          </div>

        </div>
      )}

      {apiError && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-sm flex items-start gap-3 backdrop-blur-md">
          <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#191b2b] border ${
                errors.email ? 'border-red-500/70 focus:border-red-500' : 'border-[#2d3148] focus:border-amber-500'
              } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-sm`}
              placeholder="owner@restaurant.com"
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium transition duration-150 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#191b2b] border ${
                errors.password ? 'border-red-500/70 focus:border-red-500' : 'border-[#2d3148] focus:border-amber-500'
              } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-sm`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition duration-150 cursor-pointer"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password}</p>}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Sign In to Dashboard</span>
                <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </form>

      <div className="text-center mt-6 pt-5 border-t border-[#23273b]">
        <p className="text-sm text-gray-400">
          Don't have a restaurant account yet?{' '}
          <Link to="/signup" className="text-amber-400 hover:text-amber-300 font-semibold transition duration-150 hover:underline">
            Start 30-Day Free Trial
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
