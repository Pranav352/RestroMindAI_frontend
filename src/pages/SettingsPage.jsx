import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/auth';

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Security & Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // Recovery PIN State
  const [recoveryPin, setRecoveryPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg, setPinMsg] = useState({ type: '', text: '' });

  // Notifications State (Persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('setting_order_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [desktopNotif, setDesktopNotif] = useState(() => {
    const saved = localStorage.getItem('setting_desktop_notif');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('setting_auto_refresh');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notifMsg, setNotifMsg] = useState('');

  // Admin Platform Settings (State for mock/admin controls)
  const [trialDuration, setTrialDuration] = useState('7');
  const [autoApproveOwners, setAutoApproveOwners] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    if (user?.first_name) {
      setFirstName(user.first_name);
    }
    refreshUser();
  }, [activeTab]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });

    try {
      await authApi.updateProfile({ first_name: firstName });
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      const errMsg = err.response?.data?.first_name?.[0] || 'Failed to update profile. Please try again.';
      setProfileMsg({ type: 'error', text: errMsg });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'New password and confirmation password do not match.' });
      setPassLoading(false);
      return;
    }

    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      setPassMsg({ type: 'success', text: 'Password changed successfully! Please use your new password next time you log in.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      let message = 'Failed to change password.';
      if (err.response?.data) {
        if (err.response.data.current_password) {
          message = err.response.data.current_password;
        } else if (err.response.data.new_password) {
          message = Array.isArray(err.response.data.new_password) ? err.response.data.new_password[0] : err.response.data.new_password;
        } else if (err.response.data.confirm_password) {
          message = err.response.data.confirm_password;
        } else if (typeof err.response.data === 'string') {
          message = err.response.data;
        }
      }
      setPassMsg({ type: 'error', text: message });
    } finally {
      setPassLoading(false);
    }
  };

  // Handle Recovery PIN Update
  const handlePinUpdate = async (e) => {
    e.preventDefault();
    setPinLoading(true);
    setPinMsg({ type: '', text: '' });

    if (recoveryPin && (recoveryPin.length < 4 || recoveryPin.length > 6 || !/^\d+$/.test(recoveryPin))) {
      setPinMsg({ type: 'error', text: 'Recovery PIN must be 4 to 6 numeric digits.' });
      setPinLoading(false);
      return;
    }

    try {
      await authApi.updateProfile({ recovery_pin: recoveryPin });
      await refreshUser();
      setPinMsg({ type: 'success', text: 'Security recovery PIN updated successfully!' });
      setRecoveryPin('');
    } catch (err) {
      setPinMsg({ type: 'error', text: 'Failed to update recovery PIN.' });
    } finally {
      setPinLoading(false);
    }
  };

  // Handle Save Notifications Preferences
  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem('setting_order_sound', JSON.stringify(soundEnabled));
    localStorage.setItem('setting_desktop_notif', JSON.stringify(desktopNotif));
    localStorage.setItem('setting_auto_refresh', JSON.stringify(autoRefresh));
    setNotifMsg('Notification preferences saved!');
    setTimeout(() => setNotifMsg(''), 3000);
  };

  // Audio preview helper
  const playSoundPreview = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.log('Audio preview not supported', err);
    }
  };

  // Handle Save Admin Settings
  const handleSaveAdminSettings = (e) => {
    e.preventDefault();
    setAdminMsg('Platform settings updated successfully!');
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#191a26] via-[#161720] to-[#12131c] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
                Settings & Preferences
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                isAdmin 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {isAdmin ? 'Admin Console' : 'Restaurant Owner'}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Manage your personal credentials, security PIN, order alert sounds, and platform configurations.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-[#262837] pb-px">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-[#0f1015] font-semibold shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-[#202230]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile & Account
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'security'
                ? 'bg-amber-500 text-[#0f1015] font-semibold shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-[#202230]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Password & Security
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'notifications'
                ? 'bg-amber-500 text-[#0f1015] font-semibold shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-[#202230]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Alerts & Audio
          </button>

          {!isAdmin && (
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'subscription'
                  ? 'bg-amber-500 text-[#0f1015] font-semibold shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#202230]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Subscription & Plan
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin_platform')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'admin_platform'
                  ? 'bg-amber-500 text-[#0f1015] font-semibold shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#202230]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Platform Controls
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-heading">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Profile
            </h2>

            {profileMsg.text && (
              <div className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 ${
                profileMsg.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  First Name / Display Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-[#12131c] border border-[#262837] text-gray-400 cursor-not-allowed pr-24"
                  />
                  <span className="absolute right-3 top-3 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Email is used for account login and cannot be modified directly.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0f1015] font-bold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition-all duration-200 disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save Profile Updates'}
                </button>
              </div>
            </form>
          </div>

          {/* Executive User Summary & Quick Action Card */}
          <div className="bg-[#161720] p-6 rounded-2xl border border-[#262837] shadow-xl flex flex-col items-center text-center self-start relative overflow-hidden">
            {/* Top Accent Gradient Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Avatar & Online Pulse */}
            <div className="relative mb-3 mt-1">
              {user?.avatar ? (
                <img
                  src={user.avatar.startsWith('http') ? user.avatar : `${window.location.origin}${user.avatar}`}
                  alt="Account Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/50 shadow-lg shadow-amber-500/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-3xl shadow-inner">
                  {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#161720] rounded-full shadow-sm" title="Active Account" />
            </div>

            <h3 className="text-lg font-bold text-white font-heading tracking-tight">{user?.first_name || 'Account User'}</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>

            {/* Status Pill */}
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Account • Verified
              </span>
            </div>

            {/* Account Details Box */}
            <div className="w-full bg-[#11121a] rounded-xl border border-[#232536] p-4 my-5 space-y-3.5 text-left shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Account Role</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {user?.role || 'Staff'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Recovery PIN Status</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  user?.has_recovery_pin 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {user?.has_recovery_pin ? 'Configured ✓' : 'Not Set ⚠️'}
                </span>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1d1f2b] hover:bg-[#252838] border border-[#2c2f42] hover:border-amber-500/40 text-xs text-gray-300 hover:text-white font-semibold transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🔒</span> Password & Security
                </span>
                <span className="text-amber-400 text-sm">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Password & Security */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Account Password
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Ensure your account stays secure by using a strong password with uppercase, numbers, and special characters.
            </p>

            {passMsg.text && (
              <div className={`p-4 rounded-xl mb-6 text-sm ${
                passMsg.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    {showCurrentPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Min 8 characters"
                      className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500 transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                    >
                      {showNewPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0f1015] font-bold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition-all duration-200 disabled:opacity-50"
                >
                  {passLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Security Recovery PIN Card */}
          <div className="bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security Recovery PIN (4–6 Digits)
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              A security PIN allows quick password resets if you ever lose access to your account.
            </p>

            {pinMsg.text && (
              <div className={`p-4 rounded-xl mb-6 text-sm ${
                pinMsg.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {pinMsg.text}
              </div>
            )}

            <form onSubmit={handlePinUpdate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  {user?.has_recovery_pin ? 'Update Security PIN' : 'Set Security PIN'}
                </label>
                <input
                  type="password"
                  maxLength="6"
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white tracking-widest text-lg focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading || !recoveryPin}
                className="px-6 py-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold transition-all duration-200 disabled:opacity-50"
              >
                {pinLoading ? 'Updating PIN...' : 'Save Recovery PIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Notifications & Audio Alerts */}
      {activeTab === 'notifications' && (
        <div className="bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Order Alerts & Notification Preferences
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Configure how you get notified when new orders arrive in your kitchen queue.
          </p>

          {notifMsg && (
            <div className="p-4 rounded-xl mb-6 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {notifMsg}
            </div>
          )}

          <form onSubmit={handleSaveNotifications} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42]">
              <div>
                <h4 className="text-sm font-semibold text-white">Live Order Chime Sound</h4>
                <p className="text-xs text-gray-400">Play audio chime automatically when a new customer order is placed.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={playSoundPreview}
                  className="px-3 py-1.5 bg-[#262837] text-xs font-semibold text-amber-400 rounded-lg hover:bg-[#323548] transition"
                >
                  🔊 Test Sound
                </button>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42]">
              <div>
                <h4 className="text-sm font-semibold text-white">Desktop Popup Notifications</h4>
                <p className="text-xs text-gray-400">Show browser popups when orders arrive while using other tabs.</p>
              </div>
              <input
                type="checkbox"
                checked={desktopNotif}
                onChange={(e) => setDesktopNotif(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42]">
              <div>
                <h4 className="text-sm font-semibold text-white">Auto-Refresh Order Board</h4>
                <p className="text-xs text-gray-400">Automatically poll and refresh live kitchen orders every 10 seconds.</p>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0f1015] font-bold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Subscription & Plan (Owner only) */}
      {!isAdmin && activeTab === 'subscription' && (
        <div className="bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Subscription Plan & Billing
          </h2>

          <div className="p-6 bg-gradient-to-br from-[#1d1f2b] to-[#161720] rounded-xl border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                {user?.subscription?.plan?.toUpperCase() || 'FREE_TRIAL'}
              </span>
              <h3 className="text-2xl font-black text-white mt-3 font-heading">RestroMind AI Suite</h3>
              <p className="text-sm text-gray-400 mt-1">
                Full access to Menu Management, Dynamic QR Codes, Live Orders Board, Thermal Printing, and Analytics.
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-extrabold text-amber-400 font-heading">
                {user?.subscription?.days_remaining ?? 28} Days
              </div>
              <p className="text-xs text-gray-400">Remaining in Free Trial</p>
            </div>
          </div>

          {/* Quota Usage Matrix Card */}
          {user?.role === 'owner' && (
            <div className="p-6 bg-[#14151f] rounded-xl border border-[#262837] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
                    <span className="text-amber-400 text-lg">📊</span>
                    Live Free Tier Usage Quota
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Real-time resource tracking for your monthly orders & active menu catalog items.
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1">
                  FREE TIER LIMITS ⚡
                </span>
              </div>

              {(() => {
                const q = user?.quota_usage || {};
                const ordersUsed = q.orders_used_this_month ?? 0;
                const maxOrders = q.max_orders_limit ?? 50;
                const ordersPct = q.orders_percentage ?? Math.min(100, Math.round((ordersUsed / (maxOrders || 1)) * 100));

                const menuCount = q.menu_items_count ?? 0;
                const maxMenu = q.max_menu_items_limit ?? 20;
                const menuPct = q.menu_items_percentage ?? Math.min(100, Math.round((menuCount / (maxMenu || 1)) * 100));

                const tablesCount = q.tables_count ?? 0;
                const maxTables = q.max_tables_limit ?? 5;
                const tablesPct = q.tables_percentage ?? Math.min(100, Math.round((tablesCount / (maxTables || 1)) * 100));
                const tablesLimitReached = q.tables_limit_reached ?? (tablesCount >= maxTables);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Monthly Orders Quota Card */}
                    <div className="bg-[#1c1d2a] p-4 rounded-xl border border-[#2a2c3f] space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-gray-300">Monthly Orders Used</span>
                        <span className="text-amber-400 font-bold font-mono">
                          {ordersUsed} / {maxOrders} ({ordersPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#14151f] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                          style={{ width: `${ordersPct}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-gray-500">Resets on 1st of every calendar month.</p>
                    </div>

                    {/* Menu Items Quota Card */}
                    <div className="bg-[#1c1d2a] p-4 rounded-xl border border-[#2a2c3f] space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-gray-300">Active Menu Items</span>
                        <span className="text-amber-400 font-bold font-mono">
                          {menuCount} / {maxMenu} ({menuPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#14151f] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-300 rounded-full"
                          style={{ width: `${menuPct}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-gray-500">Total items in active menu categories.</p>
                    </div>

                    {/* QR Codes / Tables Quota Card */}
                    <div className="bg-[#1c1d2a] p-4 rounded-xl border border-[#2a2c3f] space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-gray-300">Active QR Codes / Tables</span>
                        <span className={`font-bold font-mono ${tablesLimitReached ? 'text-red-400' : 'text-amber-400'}`}>
                          {tablesCount} / {maxTables} ({tablesPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#14151f] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            tablesLimitReached ? 'bg-red-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${tablesPct}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {tablesLimitReached ? (
                          <span className="text-red-400 font-semibold">Free Trial Limit Reached ({maxTables}/{maxTables} QRs)</span>
                        ) : (
                          'Total active QR table codes generated.'
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Admin Platform Controls (Admin only) */}
      {isAdmin && activeTab === 'admin_platform' && (
        <div className="bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Platform Governance Controls
          </h2>

          {adminMsg && (
            <div className="p-4 rounded-xl text-sm bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {adminMsg}
            </div>
          )}

          <form onSubmit={handleSaveAdminSettings} className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Default Free Trial Duration for New Restaurants
              </label>
              <select
                value={trialDuration}
                onChange={(e) => setTrialDuration(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-purple-500"
              >
                <option value="7">7 Days Trial</option>
                <option value="14">14 Days Trial</option>
                <option value="30">30 Days Trial</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42]">
              <div>
                <h4 className="text-sm font-semibold text-white">Auto-Approve New Owner Registrations</h4>
                <p className="text-xs text-gray-400">Automatically activate newly registered restaurant owner accounts without manual review.</p>
              </div>
              <input
                type="checkbox"
                checked={autoApproveOwners}
                onChange={(e) => setAutoApproveOwners(e.target.checked)}
                className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Default Platform Currency Code
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-purple-500"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-500/20"
              >
                Save Platform Controls
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
