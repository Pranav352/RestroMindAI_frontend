import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan: 'free_trial',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email format is invalid';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      tempErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
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
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post('/api/auth/register/', {
        email: formData.email,
        password: formData.password,
        role: 'owner', // Hardcoded for MVP owner signup
        plan: formData.plan,
      });
      navigate('/login?registered=true');
    } catch (err) {
      console.error('Signup error:', err);
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'object') {
          // Flatten dictionary errors from DRF
          const messages = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
            .join(' | ');
          setApiError(messages || 'Registration failed. Please try again.');
        } else {
          setApiError(err.response.data.error || 'Registration failed.');
        }
      } else {
        setApiError('Unable to connect to server.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1015] px-4 font-sans">
      <div className="max-w-md w-full space-y-8 bg-[#161720] p-8 rounded-2xl border border-[#262837] shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text font-heading">
            Create Restaurant Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Get started with RestroMind AI MVP
          </p>
        </div>

        {apiError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl bg-[#1e202e] border ${
                  errors.name ? 'border-red-500/50' : 'border-[#2c2f42] focus:border-amber-500/50'
                } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200`}
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl bg-[#1e202e] border ${
                  errors.email ? 'border-red-500/50' : 'border-[#2c2f42] focus:border-amber-500/50'
                } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200`}
                placeholder="owner@restaurant.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Select Subscription Plan</label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#1e202e] border border-[#2c2f42] focus:border-amber-500/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200"
              >
                <option value="free_trial">Free Trial (30 Days)</option>
                <option value="premium" disabled>Premium Plan (Coming Soon)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl bg-[#1e202e] border ${
                  errors.password ? 'border-red-500/50' : 'border-[#2c2f42] focus:border-amber-500/50'
                } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200`}
                placeholder="Min 8 characters"
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl bg-[#1e202e] border ${
                  errors.confirmPassword ? 'border-red-500/50' : 'border-[#2c2f42] focus:border-amber-500/50'
                } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200`}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-[#0f1015] bg-amber-500 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0f1015] border-t-transparent"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium transition duration-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
