import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/auth';
import { getMediaUrl } from '../config/env';

const AppLayout = () => {
  const { user, logout, activeTenantId, setActiveTenantId } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const location = useLocation();

  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  const fetchGlobalSettings = async () => {
    setIsRefreshingStatus(true);
    try {
      const sys = await authApi.getSystemSettings();
      setSystemSettings(sys);
    } catch (err) {
      console.error('Failed to fetch system settings in AppLayout:', err);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  // Read maintenance mode, lifecycle status, lockout toggle, & banner broadcast
  const maintenanceActive = systemSettings?.maintenance_mode ?? JSON.parse(localStorage.getItem('admin_maintenance_mode') || 'false');
  const maintenanceStatus = systemSettings?.maintenance_status ?? (localStorage.getItem('admin_maintenance_status') || 'in_progress');
  const lockPlatform = systemSettings?.lock_platform ?? JSON.parse(localStorage.getItem('admin_lock_platform') || 'false');
  const estCompletion = systemSettings?.estimated_completion ?? (localStorage.getItem('admin_est_completion') || 'Today at 3:00 AM UTC');
  const bannerSeverity = systemSettings?.banner_severity ?? (localStorage.getItem('admin_banner_severity') || 'warning');
  const bannerText = systemSettings?.banner_text ?? (localStorage.getItem('admin_banner_text') || 'Scheduled system maintenance in progress.');

  // Persistent banner dismissal logic across page reloads
  const bannerKey = `dismissed_maint_${maintenanceStatus}_${bannerText}`;
  const [dismissedBanner, setDismissedBanner] = useState(() => {
    return sessionStorage.getItem(bannerKey) === 'true';
  });

  useEffect(() => {
    if (sessionStorage.getItem(bannerKey) === 'true') {
      setDismissedBanner(true);
    }
  }, [bannerKey]);

  const handleDismissBanner = () => {
    setDismissedBanner(true);
    sessionStorage.setItem(bannerKey, 'true');
  };

  // Check if non-admin user must be locked out from dashboard work
  const isLockedOut = maintenanceActive && lockPlatform && maintenanceStatus === 'in_progress' && user?.role !== 'admin';

  if (isLockedOut) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0c0d14] text-white flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        <div className="max-w-xl w-full bg-[#161722] border border-amber-500/30 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl shadow-inner">
            🛠️
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            System Under Active Maintenance
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 font-heading">
            Platform Maintenance In Progress
          </h1>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
            {bannerText}
          </p>

          <div className="bg-[#1d1f2e] border border-[#2a2d42] p-4 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span className="text-gray-400 font-medium">Estimated Completion:</span>
            <span className="font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              ⏰ {estCompletion}
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-8 leading-relaxed">
            To ensure data integrity and platform performance, dashboard access is temporarily locked for all store operations. Thank you for your patience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={fetchGlobalSettings}
              disabled={isRefreshingStatus}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshingStatus ? 'Checking Status...' : 'Check Status Again'}
            </button>

            <button
              onClick={logout}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#232636] text-gray-300 hover:text-white hover:bg-[#2b2f44] font-semibold transition border border-[#343852]"
            >
              Logout Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ownerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    )},
    { name: 'Orders', href: '/orders', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { name: 'Restaurant Profile', href: '/profile', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )},
    { name: 'Menu Management', href: '/menu', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { name: 'QR Code', href: '/qr', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zm-6 0H4v4h2v-4zm0-6H4v4h2v-4zm10-6h.01M18 16h.01M21 21v-3a2 2 0 00-2-2h-3M3 21v-3a2 2 0 012-2h3M21 3v3a2 2 0 01-2 2h-3M3 3v3a2 2 0 002 2h3" />
      </svg>
    )},
    { name: 'Settings', href: '/settings', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/dashboard', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    )},
    { name: 'Manage Users', href: '/admin/users', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { name: 'Manage Restaurants', href: '/admin/restaurants', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )},
    { name: 'Platform Settings', href: '/admin/settings', icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  const navigation = (user?.role === 'admin' && !activeTenantId) ? adminNavigation : ownerNavigation;
  const isImpersonating = user?.role === 'admin' && activeTenantId;
  const settingsHref = (user?.role === 'admin' && !activeTenantId) ? '/admin/settings' : '/settings';

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0f1015] flex flex-col md:flex-row text-gray-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[#161720] border-r border-[#262837] shrink-0">
        <div className="flex items-center h-16 px-6 border-b border-[#262837] bg-[#12131b]">
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-heading">
            RestroMind AI
          </span>
          <span className="ml-2 text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">
            {user?.role === 'admin' ? 'Admin' : 'Owner'}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
          <nav className="space-y-1.5">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f212e]'
                  }`
                }
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-[#262837] space-y-3">
            <div className="flex items-center gap-3 px-3.5 py-2.5 bg-[#1d1f2b] rounded-xl border border-[#2c2f42] overflow-hidden shadow-sm">
              {user?.avatar ? (
                <img
                  src={getMediaUrl(user.avatar)}
                  alt="User Avatar"
                  className="w-9 h-9 rounded-full object-cover border border-amber-500/40 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm shrink-0 shadow-inner">
                  {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'O'}
                </div>
              )}
              <div className="overflow-hidden min-w-0">
                <p className="text-xs text-gray-200 font-semibold truncate">{user?.email}</p>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">{user?.role || 'owner'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header Bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-[#161720] border-b border-[#262837] shrink-0">
        <span className="text-lg font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent font-heading">
          RestroMind AI
        </span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-[#161720] border-b border-[#262837] p-6 flex flex-col justify-between overflow-y-auto">
          <nav className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20'
                      : 'text-gray-300 hover:text-gray-100 hover:bg-[#1f212e]'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#1d1f2b] rounded-xl border border-[#2c2f42] overflow-hidden">
              {user?.avatar ? (
                <img
                  src={getMediaUrl(user.avatar)}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base shrink-0 shadow-inner">
                  {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'O'}
                </div>
              )}
              <div className="overflow-hidden min-w-0">
                <p className="text-sm text-gray-100 font-bold truncate">{user?.email}</p>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mt-0.5">{user?.role || 'owner'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all duration-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
        {/* Top Maintenance & Lifecycle Broadcast Banner */}
        {maintenanceActive && !dismissedBanner && (
          <div className={`px-6 py-3 flex items-center justify-between shadow-lg z-30 transition-all ${
            maintenanceStatus === 'completed'
              ? 'bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 text-white font-medium'
              : maintenanceStatus === 'scheduled'
              ? 'bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 text-white font-medium'
              : bannerSeverity === 'critical'
              ? 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white font-medium'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-semibold'
          }`}>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">
                {maintenanceStatus === 'completed' ? '✅' : maintenanceStatus === 'scheduled' ? '📅' : bannerSeverity === 'critical' ? '🚨' : '⚠️'}
              </span>
              <div>
                <span className="font-bold uppercase tracking-wider text-xs mr-2 opacity-90">
                  {maintenanceStatus === 'completed' ? 'Maintenance Completed:' : maintenanceStatus === 'scheduled' ? 'Scheduled Maintenance:' : 'Active System Maintenance:'}
                </span>
                <span className="font-medium">
                  {maintenanceStatus === 'completed' 
                    ? 'All system upgrades are finished. Platform is 100% operational.'
                    : `${bannerText} (Est. Completion: ${estCompletion})`}
                </span>
              </div>
            </div>
            <button
              onClick={handleDismissBanner}
              className="text-xs px-2.5 py-1 rounded bg-black/20 hover:bg-black/40 transition font-bold"
            >
              Dismiss ✕
            </button>
          </div>
        )}

        {/* Super Admin Bypass Notification Banner when Lockout is Active */}
        {user?.role === 'admin' && maintenanceActive && lockPlatform && maintenanceStatus === 'in_progress' && (
          <div className="bg-purple-900/90 text-purple-200 border-b border-purple-500/30 px-6 py-2.5 flex items-center justify-between text-xs font-semibold z-30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>🚨 <strong>Admin Bypass Active:</strong> Non-admin store owners and staff are locked out during active maintenance. You have super admin privileges to manage settings.</span>
            </div>
            <NavLink to="/admin/settings" className="underline hover:text-white font-bold ml-4 shrink-0">
              Manage Settings →
            </NavLink>
          </div>
        )}

        {isImpersonating && (
          <div className="bg-amber-500 text-[#0f1015] px-6 py-3 flex items-center justify-between font-semibold shadow-md z-30">
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-5 w-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              You are impersonating a restaurant (ID: {activeTenantId})
            </div>
            <button
              onClick={() => setActiveTenantId(null)}
              className="text-xs px-3 py-1.5 bg-[#0f1015] text-amber-500 hover:text-amber-400 font-bold rounded-lg transition"
            >
              Exit Impersonation
            </button>
          </div>
        )}
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
