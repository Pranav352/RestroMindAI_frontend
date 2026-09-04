import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import AuthLayout from '../layouts/AuthLayout';
import PasswordCriteriaChecklist from '../components/PasswordCriteriaChecklist';
import { evaluatePasswordCriteria, PIN_MIN_LENGTH, PIN_MAX_LENGTH } from '../utils/passwordUtils';

const ForgotPasswordPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    pin: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const criteria = evaluatePasswordCriteria(formData.newPassword);

  const validate = () => {
    const tempErrors = {};
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!formData.pin.trim()) {
      tempErrors.pin = 'Security PIN is required';
    } else if (!new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`).test(formData.pin.trim())) {
      tempErrors.pin = `PIN must be between ${PIN_MIN_LENGTH} and ${PIN_MAX_LENGTH} digits`;
    }
    if (!formData.newPassword) {
      tempErrors.newPassword = 'New password is required';
    } else if (!criteria.isAllValid) {
      tempErrors.newPassword = 'Password does not meet all complexity requirements.';
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      tempErrors.confirmNewPassword = 'Passwords do not match';
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
    setSuccessMessage('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/auth/reset-password-with-pin/', {
        email: formData.email.trim(),
        pin: formData.pin.trim(),
        new_password: formData.newPassword,
      });

      setSuccessMessage(response.data.message || 'Password has been reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'object') {
          const messages = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
            .join(' | ');
          setApiError(messages || 'Password reset failed. Please check your credentials.');
        } else {
          setApiError(err.response.data.error || 'Password reset failed.');
        }
      } else {
        setApiError('Unable to connect to server.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password Left Hero Custom Instructions Box
  const heroCustomContent = (
    <div className="p-5 rounded-2xl bg-[#131522]/80 border border-[#23273b] space-y-3.5 backdrop-blur-md">
      <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>How PIN Recovery Works</span>
      </div>
      <ul className="space-y-2 text-xs text-gray-300">
        <li className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>Enter your restaurant account email address.</span>
        </li>
        <li className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>Enter the 4 to 6-digit Secret PIN set during signup.</span>
        </li>
        <li className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>Type your new password to regain instant access.</span>
        </li>
      </ul>
    </div>
  );

  return (
    <AuthLayout
      heroTitle="Self-Service PIN"
      heroHighlight="Recovery."
      heroSubtitle="No need to wait for email links or admin support. Reset your account password instantly using your registered Secret Security PIN."
      heroCustomContent={heroCustomContent}
      cardTitle="Reset Password"
      cardSubtitle="Enter your registered Email & Secret PIN to choose a new password."
    >
      {successMessage && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-sm flex items-start gap-3 backdrop-blur-md">
          <svg className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-emerald-300">{successMessage}</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">Redirecting to login page...</p>
          </div>
        </div>
      )}

      {apiError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-sm flex items-start gap-3 backdrop-blur-md">
          <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#191b2b] border ${
                errors.email ? 'border-red-500/70 focus:border-red-500' : 'border-[#2d3148] focus:border-amber-500'
              } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-sm`}
              placeholder="owner@restaurant.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.email}</p>}
        </div>

        {/* Secret PIN */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Secret PIN
            </label>
            <span className="text-[10px] text-amber-400 font-medium">Set at signup</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              type="password"
              name="pin"
              maxLength={PIN_MAX_LENGTH}
              value={formData.pin}
              onChange={handleChange}
              className={`w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#191b2b] border ${
                errors.pin ? 'border-red-500/70 focus:border-red-500' : 'border-[#2d3148] focus:border-amber-500'
              } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-sm`}
              placeholder={`${PIN_MIN_LENGTH} to ${PIN_MAX_LENGTH}-Digit PIN`}
            />
          </div>
          {errors.pin && <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.pin}</p>}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showNewPassword ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3 rounded-xl bg-[#191b2b] border ${
                errors.newPassword ? 'border-red-500/70 focus:border-red-500' : 'border-[#2d3148] focus:border-amber-500'
              } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-sm`}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition duration-150 cursor-pointer"
            >
              {showNewPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <PasswordCriteriaChecklist criteria={criteria} password={formData.newPassword} />
          {errors.newPassword && <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.newPassword}</p>}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3 rounded-xl bg-[#191b2b] border ${
                errors.confirmNewPassword ? 'border-red-500/70 focus:border-red-500' : 'border-[#2d3148] focus:border-amber-500'
              } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-sm`}
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition duration-150 cursor-pointer"
            >
              {showConfirmPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmNewPassword && (
            <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.confirmNewPassword}</p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Resetting Password...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Update Password</span>
                <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </form>

      <div className="text-center mt-5 pt-4 border-t border-[#23273b]">
        <p className="text-xs text-gray-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition duration-150 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
