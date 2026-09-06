import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/auth';
import { getMediaUrl } from '../config/env';

const OwnerSettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? getMediaUrl(user.avatar) : null);
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

  // Kitchen & Notification Preferences (Persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('setting_order_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(() => {
    const saved = localStorage.getItem('setting_auto_accept');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [kdsRefreshInterval, setKdsRefreshInterval] = useState(() => {
    return localStorage.getItem('setting_kds_refresh') || '10';
  });
  const [notifEmail, setNotifEmail] = useState(() => {
    return localStorage.getItem('setting_notif_email') || user?.email || '';
  });
  const [dailyDigestEmail, setDailyDigestEmail] = useState(() => {
    const saved = localStorage.getItem('setting_daily_digest');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lowStockAlerts, setLowStockAlerts] = useState(() => {
    const saved = localStorage.getItem('setting_low_stock_alerts');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [kitchenMsg, setKitchenMsg] = useState('');

  // Receipt & Store Policy Preferences (Persisted in localStorage)
  const [autoPrint, setAutoPrint] = useState(() => {
    const saved = localStorage.getItem('setting_auto_print');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [printCopies, setPrintCopies] = useState(() => {
    return localStorage.getItem('setting_print_copies') || '1';
  });
  const [receiptHeader, setReceiptHeader] = useState(() => {
    return localStorage.getItem('setting_receipt_header') || 'Welcome to RestroMind AI Dining!';
  });
  const [receiptFooter, setReceiptFooter] = useState(() => {
    return localStorage.getItem('setting_receipt_footer') || 'Thank you for dining with us! Please visit again.';
  });
  const [prepBufferTime, setPrepBufferTime] = useState(() => {
    return localStorage.getItem('setting_prep_buffer') || '20';
  });
  const [minOrderValue, setMinOrderValue] = useState(() => {
    return localStorage.getItem('setting_min_order') || '0.00';
  });
  const [receiptMsg, setReceiptMsg] = useState('');

  useEffect(() => {
    if (user?.first_name) {
      setFirstName(user.first_name);
    }
    if (user?.avatar) {
      setAvatarPreview(getMediaUrl(user.avatar));
    }
    if (user?.settings) {
      const s = user.settings;
      if (s.setting_order_sound !== undefined) setSoundEnabled(s.setting_order_sound);
      if (s.setting_auto_accept !== undefined) setAutoAcceptOrders(s.setting_auto_accept);
      if (s.setting_kds_refresh !== undefined) setKdsRefreshInterval(s.setting_kds_refresh);
      if (s.setting_notif_email !== undefined) setNotifEmail(s.setting_notif_email);
      if (s.setting_daily_digest !== undefined) setDailyDigestEmail(s.setting_daily_digest);
      if (s.setting_low_stock_alerts !== undefined) setLowStockAlerts(s.setting_low_stock_alerts);
      if (s.setting_auto_print !== undefined) setAutoPrint(s.setting_auto_print);
      if (s.setting_print_copies !== undefined) setPrintCopies(s.setting_print_copies);
      if (s.setting_receipt_header !== undefined) setReceiptHeader(s.setting_receipt_header);
      if (s.setting_receipt_footer !== undefined) setReceiptFooter(s.setting_receipt_footer);
      if (s.setting_prep_buffer !== undefined) setPrepBufferTime(s.setting_prep_buffer);
      if (s.setting_min_order !== undefined) setMinOrderValue(s.setting_min_order);
    }
    refreshUser();
  }, [activeTab]);

  const [systemSettings, setSystemSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('system_settings_cache');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const sys = await authApi.getSystemSettings();
        setSystemSettings(sys);
        if (sys) {
          localStorage.setItem('system_settings_cache', JSON.stringify(sys));
        }
      } catch (err) {
        console.error('Failed to fetch system settings in OwnerSettingsPage:', err);
      }
    };
    fetchSystemSettings();
  }, []);

  const isFreeTier = user?.role !== 'admin' && (user?.subscription?.plan === 'free_trial' || !user?.subscription?.plan);
  
  // Safe calculation even before initial API fetch completes:
  // Default restricted tabs to locked for free tier users when systemSettings is null
  const receiptLocked = isFreeTier && (systemSettings ? systemSettings.free_tier_allow_receipt_settings === false : true);
  const kitchenLocked = isFreeTier && (systemSettings ? systemSettings.free_tier_allow_kitchen_settings === false : false);
  const showBadges = systemSettings?.show_pro_badges_on_user_settings ?? true;
  const hideLockedTabs = systemSettings?.hide_locked_settings_tabs ?? true;

  // Auto fallback activeTab if current tab is locked and set to be hidden by admin
  useEffect(() => {
    if (isFreeTier && hideLockedTabs) {
      if (activeTab === 'receipt' && receiptLocked) {
        setActiveTab('profile');
      } else if (activeTab === 'kitchen' && kitchenLocked) {
        setActiveTab('profile');
      }
    }
  }, [activeTab, receiptLocked, kitchenLocked, hideLockedTabs, isFreeTier]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await authApi.updateProfile(formData);
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Profile & account avatar updated successfully!' });
    } catch (err) {
      const errMsg = err.response?.data?.first_name?.[0] || err.response?.data?.avatar?.[0] || 'Failed to update profile. Please try again.';
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

  // Handle Save Kitchen & Notification Settings
  const handleSaveKitchenPrefs = async (e) => {
    e.preventDefault();
    localStorage.setItem('setting_order_sound', JSON.stringify(soundEnabled));
    localStorage.setItem('setting_auto_accept', JSON.stringify(autoAcceptOrders));
    localStorage.setItem('setting_kds_refresh', kdsRefreshInterval);
    localStorage.setItem('setting_notif_email', notifEmail);
    localStorage.setItem('setting_daily_digest', JSON.stringify(dailyDigestEmail));
    localStorage.setItem('setting_low_stock_alerts', JSON.stringify(lowStockAlerts));

    try {
      await authApi.updateProfile({
        settings: {
          setting_order_sound: soundEnabled,
          setting_auto_accept: autoAcceptOrders,
          setting_kds_refresh: kdsRefreshInterval,
          setting_notif_email: notifEmail,
          setting_daily_digest: dailyDigestEmail,
          setting_low_stock_alerts: lowStockAlerts
        }
      });
      await refreshUser();
      setKitchenMsg('Kitchen and notification preferences saved to database!');
    } catch (err) {
      setKitchenMsg('Preferences saved successfully!');
    }
    setTimeout(() => setKitchenMsg(''), 3000);
  };

  // Handle Save Receipt & Policy Settings
  const handleSaveReceiptSettings = async (e) => {
    e.preventDefault();
    localStorage.setItem('setting_auto_print', JSON.stringify(autoPrint));
    localStorage.setItem('setting_print_copies', printCopies);
    localStorage.setItem('setting_receipt_header', receiptHeader);
    localStorage.setItem('setting_receipt_footer', receiptFooter);
    localStorage.setItem('setting_prep_buffer', prepBufferTime);
    localStorage.setItem('setting_min_order', minOrderValue);

    try {
      await authApi.updateProfile({
        settings: {
          setting_auto_print: autoPrint,
          setting_print_copies: printCopies,
          setting_receipt_header: receiptHeader,
          setting_receipt_footer: receiptFooter,
          setting_prep_buffer: prepBufferTime,
          setting_min_order: minOrderValue
        }
      });
      await refreshUser();
      setReceiptMsg('Thermal receipt formatting and store policies saved to database!');
    } catch (err) {
      setReceiptMsg('Receipt settings saved successfully!');
    }
    setTimeout(() => setReceiptMsg(''), 3000);
  };

  // Audio preview test
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

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#191a26] via-[#161720] to-[#12131c] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
                Store & Account Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Restaurant Owner
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Manage store operations, live kitchen audio chimes, receipt printing formats, and account security.
            </p>
          </div>
        </div>

        {/* Redesigned Premium User Settings Tab Navigation */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 bg-[#12131c]/90 border border-[#262837] p-2.5 rounded-2xl shadow-xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/25 border border-amber-300/40 ring-1 ring-amber-400/30'
                : 'bg-[#181926]/70 hover:bg-[#222436] text-gray-300 hover:text-white border border-[#262837] hover:border-[#383c54]'
            }`}
          >
            <svg className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-slate-950' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate">Profile & Account</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/25 border border-amber-300/40 ring-1 ring-amber-400/30'
                : 'bg-[#181926]/70 hover:bg-[#222436] text-gray-300 hover:text-white border border-[#262837] hover:border-[#383c54]'
            }`}
          >
            <svg className={`w-4 h-4 shrink-0 ${activeTab === 'security' ? 'text-slate-950' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="truncate">Password & Security</span>
          </button>

          {!(kitchenLocked && hideLockedTabs) && (
            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'kitchen'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/25 border border-amber-300/40 ring-1 ring-amber-400/30'
                  : 'bg-[#181926]/70 hover:bg-[#222436] text-gray-300 hover:text-white border border-[#262837] hover:border-[#383c54]'
              }`}
            >
              <svg className={`w-4 h-4 shrink-0 ${activeTab === 'kitchen' ? 'text-slate-950' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="truncate">Kitchen & Alerts</span>
              {kitchenLocked && showBadges && (
                <span className="ml-0.5 px-1 py-0.2 rounded text-[9px] font-black bg-amber-400/30 text-amber-900 border border-amber-400/40">PRO 🔒</span>
              )}
            </button>
          )}

          {!(receiptLocked && hideLockedTabs) && (
            <button
              onClick={() => setActiveTab('receipt')}
              className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'receipt'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/25 border border-amber-300/40 ring-1 ring-amber-400/30'
                  : 'bg-[#181926]/70 hover:bg-[#222436] text-gray-300 hover:text-white border border-[#262837] hover:border-[#383c54]'
              }`}
            >
              <svg className={`w-4 h-4 shrink-0 ${activeTab === 'receipt' ? 'text-slate-950' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="truncate">Receipts & Policies</span>
              {receiptLocked && showBadges && (
                <span className="ml-0.5 px-1 py-0.2 rounded text-[9px] font-black bg-amber-400/30 text-amber-900 border border-amber-400/40">PRO 🔒</span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'subscription'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/25 border border-amber-300/40 ring-1 ring-amber-400/30'
                : 'bg-[#181926]/70 hover:bg-[#222436] text-gray-300 hover:text-white border border-[#262837] hover:border-[#383c54]'
            }`}
          >
            <svg className={`w-4 h-4 shrink-0 ${activeTab === 'subscription' ? 'text-slate-950' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="truncate">Subscription & Plan</span>
          </button>
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
              Owner Profile Information
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
              {/* Account Avatar Photo Upload Picker */}
              <div className="p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42] flex flex-col sm:flex-row items-center gap-5">
                <div className="relative shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Account Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/40 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-3xl shadow-inner">
                      {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'O'}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-sm font-semibold text-white">Account Profile Photo</h4>
                  <p className="text-xs text-gray-400">Upload a profile avatar photo (.PNG, .JPG, .WEBP).</p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs transition cursor-pointer">
                      <span>Upload Avatar 📷</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>

                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                  Account Email Address
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
                <p className="text-xs text-gray-500 mt-1">Email is used for owner login and store billing receipts.</p>
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
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Account Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/50 shadow-lg shadow-amber-500/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-3xl shadow-inner">
                  {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'O'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#161720] rounded-full shadow-sm" title="Active Account" />
            </div>

            <h3 className="text-lg font-bold text-white font-heading tracking-tight">{user?.first_name || 'Restaurant Owner'}</h3>
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
                <span className="text-gray-400 font-medium">Role</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {user?.role === 'owner' ? 'Restaurant Owner' : user?.role || 'Owner'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Subscription</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20 uppercase">
                  {user?.subscription?.plan ? user.subscription.plan.replace('_', ' ') : 'Free Trial'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Security PIN</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  user?.has_recovery_pin 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {user?.has_recovery_pin ? 'Configured ✓' : 'Not Set ⚠️'}
                </span>
              </div>

              {/* Free Tier Quota Usage Bar Preview if available */}
              {user?.quota_usage && (
                <div className="pt-2 border-t border-[#232536] space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-400">Monthly Orders</span>
                    <span className="text-gray-300 font-mono font-semibold">
                      {user.quota_usage.orders_used_this_month} / {user.quota_usage.max_orders_limit} ({user.quota_usage.orders_percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#1c1e2b] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${user.quota_usage.orders_percentage}%` }}
                    />
                  </div>
                </div>
              )}
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

              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1d1f2b] hover:bg-[#252838] border border-[#2c2f42] hover:border-amber-500/40 text-xs text-gray-300 hover:text-white font-semibold transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>⚡</span> Subscription & Plan
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
          <div className="bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Account Password
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Protect your store access with a strong password containing uppercase, numbers, and special characters.
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

          <div className="bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security Recovery PIN (4–6 Digits)
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Set a secret numeric PIN to reset your password if you ever get locked out of your account.
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

      {/* TAB 3: Kitchen & Notification Preferences */}
      {activeTab === 'kitchen' && kitchenLocked ? (
        <div className="bg-[#161720] p-8 md:p-12 rounded-2xl border border-amber-500/30 text-center max-w-2xl mx-auto space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
            🔔
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-3 inline-block">
              RestroMind Pro Feature 🔒
            </span>
            <h2 className="text-2xl font-extrabold text-white font-heading">
              Unlock Advanced Kitchen & Notification Preferences
            </h2>
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">
              Custom Kitchen Display System (KDS) refresh intervals, WhatsApp order alerts, and automated stock outage alerts are restricted to paid subscription tiers.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('subscription')}
              className="px-8 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
              Upgrade to Pro Plan ($29/mo) →
            </button>
          </div>
        </div>
      ) : activeTab === 'kitchen' && (
        <div className="bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Kitchen & Order Operational Preferences
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Customize live kitchen notifications, order acceptance modes, and notification email recipients.
          </p>

          {kitchenMsg && (
            <div className="p-4 rounded-xl mb-6 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {kitchenMsg}
            </div>
          )}

          <form onSubmit={handleSaveKitchenPrefs} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42]">
              <div>
                <h4 className="text-sm font-semibold text-white">Live Order Audio Chime</h4>
                <p className="text-xs text-gray-400">Play an audio alert when a new customer order is placed.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={playSoundPreview}
                  className="px-3 py-1.5 bg-[#262837] text-xs font-semibold text-amber-400 rounded-lg hover:bg-[#323548] transition"
                >
                  🔊 Test Chime
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
                <h4 className="text-sm font-semibold text-white">Auto-Accept Incoming Orders</h4>
                <p className="text-xs text-gray-400">Automatically accept orders directly into the kitchen queue without manual tap.</p>
              </div>
              <input
                type="checkbox"
                checked={autoAcceptOrders}
                onChange={(e) => setAutoAcceptOrders(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42]">
              <label className="block text-sm font-semibold text-white mb-1">
                Kitchen Display System (KDS) Auto-Refresh Interval
              </label>
              <p className="text-xs text-gray-400 mb-3">Choose how frequently the Live Orders screen polls for new orders.</p>
              <select
                value={kdsRefreshInterval}
                onChange={(e) => setKdsRefreshInterval(e.target.value)}
                className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-[#161720] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="5">Every 5 Seconds (Fast)</option>
                <option value="10">Every 10 Seconds (Standard)</option>
                <option value="30">Every 30 Seconds (Low Bandwidth)</option>
              </select>
            </div>

            <div className="p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42] space-y-4">
              <h4 className="text-sm font-semibold text-white">Automated Email Alert Recipients</h4>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Notification Email Address
                </label>
                <input
                  type="email"
                  value={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.value)}
                  placeholder="e.g. manager@restaurant.com"
                  className="w-full max-w-lg px-4 py-3 rounded-xl bg-[#161720] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-300 font-medium">Receive Daily Sales Summary Email Digest</span>
                <input
                  type="checkbox"
                  checked={dailyDigestEmail}
                  onChange={(e) => setDailyDigestEmail(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300 font-medium">Receive Low Stock & Inventory Outage Alerts</span>
                <input
                  type="checkbox"
                  checked={lowStockAlerts}
                  onChange={(e) => setLowStockAlerts(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0f1015] font-bold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
              >
                Save Kitchen Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Receipts & Store Policies */}
      {activeTab === 'receipt' && receiptLocked ? (
        <div className="bg-[#161720] p-8 md:p-12 rounded-2xl border border-amber-500/30 text-center max-w-2xl mx-auto space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
            🧾
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-3 inline-block">
              RestroMind Pro Feature 🔒
            </span>
            <h2 className="text-2xl font-extrabold text-white font-heading">
              Unlock Receipt Customization & Thermal Auto-Printing
            </h2>
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">
              Custom receipt headers, footer store policies, Tax ID numbers, copy counts, and automatic thermal printing configurations are reserved for RestroMind Pro subscribers.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('subscription')}
              className="px-8 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
              Upgrade to Pro Plan ($29/mo) →
            </button>
          </div>
        </div>
      ) : activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#161720] p-6 md:p-8 rounded-2xl border border-[#262837] shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 font-heading">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Thermal Receipt Formatting & Store Policies
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Configure printed thermal receipt layouts, customer buffer prep times, and minimum cart values.
            </p>

            {receiptMsg && (
              <div className="p-4 rounded-xl mb-6 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {receiptMsg}
              </div>
            )}

            <form onSubmit={handleSaveReceiptSettings} className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#1d1f2b] rounded-xl border border-[#2c2f42]">
                <div>
                  <h4 className="text-sm font-semibold text-white">Thermal Receipt Auto-Print</h4>
                  <p className="text-xs text-gray-400">Automatically trigger receipt printing when order state moves to Preparing.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Number of Receipt Copies to Print
                </label>
                <select
                  value={printCopies}
                  onChange={(e) => setPrintCopies(e.target.value)}
                  className="w-full max-w-xs px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="1">1 Copy (Kitchen Ticket Only)</option>
                  <option value="2">2 Copies (Kitchen Copy + Customer Receipt)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Custom Receipt Header Note
                </label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  placeholder="e.g. Welcome to RestroMind AI Dining!"
                  className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Custom Receipt Footer Note
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="e.g. Thank you! Visit again @restromind"
                  className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Default Order Prep Buffer Time
                  </label>
                  <select
                    value={prepBufferTime}
                    onChange={(e) => setPrepBufferTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="15">15 Minutes (Fast Food / Express)</option>
                    <option value="20">20 Minutes (Standard Casual)</option>
                    <option value="30">30 Minutes (Fine Dining / Peak)</option>
                    <option value="45">45 Minutes (Large Parties)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Minimum Order Cart Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#1d1f2b] border border-[#2c2f42] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0f1015] font-bold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
                >
                  Save Receipt & Store Policies
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Thermal Receipt Preview Box */}
          <div className="bg-[#161720] p-6 rounded-2xl border border-[#262837] shadow-lg flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🧾 Live Thermal Receipt Preview</span>
            </h3>
            <div className="bg-white text-black font-mono p-5 rounded-lg text-xs space-y-3 shadow-inner border border-gray-300">
              <div className="text-center font-bold text-sm uppercase border-b border-dashed border-gray-400 pb-2">
                RestroMind AI Cafe<br />
                <span className="text-[10px] font-normal text-gray-600 italic">{receiptHeader}</span>
              </div>

              <div className="flex justify-between text-[10px]">
                <span>Order #1042</span>
                <span>Prep: {prepBufferTime}m</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 border-b border-dashed border-gray-400 pb-2">
                <span>Dine-In Table 4</span>
                <span>Copies: {printCopies}</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>1x Truffle Mushroom Pizza</span>
                  <span>$18.50</span>
                </div>
                <div className="flex justify-between">
                  <span>2x Iced Artisan Matcha</span>
                  <span>$12.00</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-right">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>$30.50</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-600 border-t border-dashed border-gray-400 pt-2 italic">
                {receiptFooter}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Subscription & Plan */}
      {activeTab === 'subscription' && (
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
                {user?.subscription?.plan || 'Free Trial'}
              </span>
              <h3 className="text-2xl font-black text-white mt-3 font-heading">RestroMind AI Suite</h3>
              <p className="text-sm text-gray-400 mt-1">
                Full access to Menu Management, Dynamic QR Codes, Live Orders Board, Thermal Printing, and Analytics.
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-extrabold text-amber-400 font-heading">
                {user?.subscription?.days_remaining ?? 7} Days
              </div>
              <p className="text-xs text-gray-400">Remaining in Free Trial</p>
            </div>
          </div>

          {/* Live Free Tier Quota Usage Card */}
          <div className="bg-[#1d1f2b] p-6 rounded-xl border border-[#2c2f42] space-y-6">
            <div className="flex items-center justify-between border-b border-[#282b3d] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 012 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Live Free Tier Usage Quota
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Real-time resource tracking for your monthly orders & active menu catalog items.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {isFreeTier ? 'Free Tier Limits ⚡' : 'Unlimited Pro ♾️'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Monthly Orders Meter */}
              <div className="bg-[#161720] p-4 rounded-xl border border-[#282b3d] space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-300">Monthly Orders Used</span>
                  <span className="text-amber-400 font-mono">
                    {user?.quota_usage?.orders_used_this_month ?? 0} / {user?.quota_usage?.max_orders_limit ?? 50} ({user?.quota_usage?.orders_percentage ?? 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#202230] rounded-full overflow-hidden p-0.5 border border-[#2e3248]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (user?.quota_usage?.orders_percentage ?? 0) >= 90
                        ? 'bg-rose-500 shadow-md shadow-rose-500/30'
                        : (user?.quota_usage?.orders_percentage ?? 0) >= 70
                        ? 'bg-amber-500 shadow-md shadow-amber-500/30'
                        : 'bg-emerald-400 shadow-md shadow-emerald-400/30'
                    }`}
                    style={{ width: `${Math.min(100, user?.quota_usage?.orders_percentage ?? 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">Resets on 1st of every calendar month.</p>
              </div>

              {/* Menu Items Meter */}
              <div className="bg-[#161720] p-4 rounded-xl border border-[#282b3d] space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-300">Active Menu Items</span>
                  <span className="text-amber-400 font-mono">
                    {user?.quota_usage?.menu_items_count ?? 0} / {user?.quota_usage?.max_menu_items_limit ?? 20} ({user?.quota_usage?.menu_items_percentage ?? 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#202230] rounded-full overflow-hidden p-0.5 border border-[#2e3248]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (user?.quota_usage?.menu_items_percentage ?? 0) >= 90
                        ? 'bg-rose-500 shadow-md shadow-rose-500/30'
                        : (user?.quota_usage?.menu_items_percentage ?? 0) >= 70
                        ? 'bg-amber-500 shadow-md shadow-amber-500/30'
                        : 'bg-emerald-400 shadow-md shadow-emerald-400/30'
                    }`}
                    style={{ width: `${Math.min(100, user?.quota_usage?.menu_items_percentage ?? 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">Total items in active menu categories.</p>
              </div>

              {/* QR Codes / Tables Meter */}
              <div className="bg-[#161720] p-4 rounded-xl border border-[#282b3d] space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-300">Active QR Codes / Tables</span>
                  <span className={`font-mono ${user?.quota_usage?.tables_limit_reached ? 'text-red-400 font-bold' : 'text-amber-400'}`}>
                    {user?.quota_usage?.tables_count ?? 0} / {user?.quota_usage?.max_tables_limit ?? 5} ({user?.quota_usage?.tables_percentage ?? 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#202230] rounded-full overflow-hidden p-0.5 border border-[#2e3248]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      user?.quota_usage?.tables_limit_reached
                        ? 'bg-rose-500 shadow-md shadow-rose-500/30'
                        : (user?.quota_usage?.tables_percentage ?? 0) >= 70
                        ? 'bg-amber-500 shadow-md shadow-amber-500/30'
                        : 'bg-emerald-400 shadow-md shadow-emerald-400/30'
                    }`}
                    style={{ width: `${Math.min(100, user?.quota_usage?.tables_percentage ?? 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  {user?.quota_usage?.tables_limit_reached ? (
                    <span className="text-red-400 font-semibold">Free Trial Limit Reached ({user?.quota_usage?.max_tables_limit ?? 5} QRs max)</span>
                  ) : (
                    'Total active QR table codes generated.'
                  )}
                </p>
              </div>
            </div>

            {isFreeTier && ((user?.quota_usage?.orders_percentage ?? 0) >= 80 || (user?.quota_usage?.menu_items_percentage ?? 0) >= 80) && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-4">
                <span>⚠️ Approaching Free Tier limits! Upgrade to paid Pro tier for unlimited monthly orders & menu items.</span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition shrink-0"
                >
                  Upgrade Now ($29/mo)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSettingsPage;
