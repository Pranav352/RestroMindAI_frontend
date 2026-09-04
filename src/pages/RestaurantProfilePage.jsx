import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useRestaurant from '../hooks/useRestaurant';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl, getCustomerMenuUrl } from '../config/env';

const RestaurantProfilePage = () => {
  const navigate = useNavigate();
  const {
    restaurant,
    loading,
    error,
    success,
    setSuccess,
    setError,
    fetchRestaurant,
    createRestaurant,
    updateRestaurant,
  } = useRestaurant();

  const { user } = useAuth();
  const subscription = user?.subscription;
  const isSubscriptionActive = subscription?.status === 'active' && 
    (subscription?.days_remaining > 0 || subscription?.days_remaining === null);

  const [activeTab, setActiveTab] = useState('branding');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currency: '₹',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const rest = await fetchRestaurant();
        if (rest) {
          setFormData({
            name: rest.name || '',
            phone: rest.phone || '',
            address: rest.address || '',
            currency: rest.currency || '₹',
          });
          if (rest.logo) {
            setLogoPreview(getMediaUrl(rest.logo));
          }
        }
      } catch (err) {
        // Handled by hook
      }
    };
    loadProfile();
  }, [fetchRestaurant]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [success, setSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const processFile = (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, WEBP, and GIF images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(restaurant?.logo ? getMediaUrl(restaurant.logo) : null);
  };

  const handleCopyPublicUrl = () => {
    if (!restaurant?.id) return;
    const url = getCustomerMenuUrl(restaurant.id);
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (formData.name?.trim()) score += 30;
    if (logoPreview) score += 30;
    if (formData.phone?.trim()) score += 20;
    if (formData.address?.trim()) score += 20;
    return score;
  };

  const completenessScore = calculateCompleteness();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Restaurant brand name is required.');
      return;
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Phone number must be a valid format (e.g. +91 9876543210 or 123-456-7890) with 7 to 20 digits.');
        return;
      }
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('phone', formData.phone.trim());
    data.append('address', formData.address.trim());
    data.append('currency', formData.currency);
    if (logoFile) {
      data.append('logo', logoFile);
    }

    try {
      if (restaurant) {
        await updateRestaurant(restaurant.id, data);
      } else {
        await createRestaurant(data);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      }
      setLogoFile(null);
    } catch (err) {
      // Error message set in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !restaurant) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  const publicMenuUrl = restaurant?.id ? getCustomerMenuUrl(restaurant.id) : '';

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-16">
      
      {/* Top Header Hero Showcase */}
      <div className="bg-[#161720] border border-[#262837] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#1d1f2c] border-2 border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-xl group">
              {logoPreview ? (
                <img src={logoPreview} alt="Restaurant Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-amber-400 font-heading">
                  {formData.name?.charAt(0)?.toUpperCase() || 'R'}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white font-heading tracking-tight">
                  {formData.name || 'Your Restaurant Brand'}
                </h1>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live & Active Store
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-400">
                Manage your official digital storefront, brand logo, contact channels, and currency settings.
              </p>

              {/* Profile Completeness Bar */}
              <div className="pt-2 flex items-center gap-3">
                <div className="w-36 h-2 bg-[#23273b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${completenessScore}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-300">
                  {completenessScore}% Profile Complete
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links & Public Menu Actions */}
          {restaurant && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCopyPublicUrl}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1f2232] hover:bg-[#282b3f] text-gray-200 border border-[#2d3148] rounded-xl text-xs font-semibold transition duration-200 cursor-pointer shadow-sm"
              >
                {copiedUrl ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Menu URL</span>
                  </>
                )}
              </button>

              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-bold transition duration-200 shadow-lg cursor-pointer"
              >
                <span>View Digital Menu</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Read-Only Subscription Alert */}
      {!isSubscriptionActive && subscription && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-sm flex items-start gap-3 backdrop-blur-md">
          <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">Read-Only Mode Active</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              {subscription.status === 'pending'
                ? 'Your owner account is currently pending admin approval. Profile updates are disabled in read-only mode.'
                : 'Your trial period has ended. Please contact system admin to reactivate full edit access.'}
            </p>
          </div>
        </div>
      )}

      {/* Success & Error Banners */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-sm flex items-center gap-3 backdrop-blur-md animate-fade-in">
          <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl text-sm flex items-center gap-3 backdrop-blur-md">
          <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[#262837] gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a26]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-23" />
          </svg>
          <span>Brand Identity & Logo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('location')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${
            activeTab === 'location'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a26]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Location & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('currency')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${
            activeTab === 'currency'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a26]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Currency & Regional</span>
        </button>
      </div>

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Cards */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* TAB 1: BRAND IDENTITY & LOGO */}
            {activeTab === 'branding' && (
              <div className="bg-[#161720] border border-[#262837] p-6 md:p-8 rounded-3xl shadow-xl space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-[#23273b]">
                  <div>
                    <h3 className="font-bold text-white text-base font-heading">Brand Identity & Logo Avatar</h3>
                    <p className="text-xs text-gray-400">Manage official restaurant logo and public brand name.</p>
                  </div>
                  <span className="text-xs text-amber-400 font-bold px-3 py-1 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    Step 1 of 3
                  </span>
                </div>

                {/* Logo Avatar Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Official Brand Logo Avatar
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#12131b] border border-[#23273b]">
                    <div className="relative w-28 h-28 rounded-2xl bg-[#1a1c29] border border-[#2c2f42] overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <svg className="h-8 w-8 text-gray-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-[10px] text-gray-500 font-medium">No Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full text-center sm:text-left space-y-2">
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingLogo(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(false);
                          if (isSubscriptionActive && e.dataTransfer.files[0]) {
                            processFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`p-4 rounded-xl border-2 border-dashed transition duration-200 text-center ${
                          isDraggingLogo ? 'border-amber-500 bg-amber-500/10' : 'border-[#2d3148] hover:border-amber-500/40 bg-[#171926]'
                        }`}
                      >
                        <p className="text-xs text-gray-300 font-medium">
                          Drag logo here or{' '}
                          <label className="text-amber-400 hover:underline cursor-pointer font-bold">
                            select logo file
                            <input
                              type="file"
                              onChange={handleLogoChange}
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              disabled={!isSubscriptionActive}
                            />
                          </label>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">Recommended square 500x500 (Max 5MB)</p>
                      </div>

                      {logoFile && (
                        <div className="flex items-center justify-between text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                          <span className="truncate max-w-[200px]">{logoFile.name}</span>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="text-xs text-red-400 hover:text-red-300 font-bold ml-2 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Restaurant Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Restaurant Brand Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isSubscriptionActive}
                    className={`w-full px-4 py-3.5 rounded-xl bg-[#191b2b] border ${
                      !isSubscriptionActive
                        ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60'
                        : 'border-[#2d3148] focus:border-amber-500'
                    } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition duration-200 text-sm font-semibold`}
                    placeholder="e.g. Gourmet Bistro & Cafe"
                    required
                  />
                </div>
              </div>
            )}

            {/* TAB 2: LOCATION & CONTACT */}
            {activeTab === 'location' && (
              <div className="bg-[#161720] border border-[#262837] p-6 md:p-8 rounded-3xl shadow-xl space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-[#23273b]">
                  <div>
                    <h3 className="font-bold text-white text-base font-heading">Location & Customer Channels</h3>
                    <p className="text-xs text-gray-400">Configure store contact phone and physical dining address.</p>
                  </div>
                  <span className="text-xs text-amber-400 font-bold px-3 py-1 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    Step 2 of 3
                  </span>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isSubscriptionActive}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#191b2b] border ${
                        !isSubscriptionActive
                          ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60'
                          : 'border-[#2d3148] focus:border-amber-500'
                      } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition duration-200 text-sm`}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">Formatted with country code (7 to 20 digits).</p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Full Street Address & Landmark
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="4"
                    disabled={!isSubscriptionActive}
                    className={`w-full p-4 rounded-xl bg-[#191b2b] border ${
                      !isSubscriptionActive
                        ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60'
                        : 'border-[#2d3148] focus:border-amber-500'
                    } text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition duration-200 text-sm`}
                    placeholder="e.g. Building 42, Food Street, Near City Center"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: CURRENCY & REGIONAL */}
            {activeTab === 'currency' && (
              <div className="bg-[#161720] border border-[#262837] p-6 md:p-8 rounded-3xl shadow-xl space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-[#23273b]">
                  <div>
                    <h3 className="font-bold text-white text-base font-heading">Currency & Price Presentation</h3>
                    <p className="text-xs text-gray-400">Select standard currency symbol for food items & invoices.</p>
                  </div>
                  <span className="text-xs text-amber-400 font-bold px-3 py-1 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    Step 3 of 3
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Menu Currency Symbol
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      disabled={!isSubscriptionActive}
                      className={`w-full px-4 py-3.5 rounded-xl bg-[#191b2b] border ${
                        !isSubscriptionActive
                          ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60'
                          : 'border-[#2d3148] focus:border-amber-500'
                      } text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition duration-200 text-sm font-semibold cursor-pointer`}
                    >
                      <option value="₹">Indian Rupee (₹)</option>
                      <option value="$">US Dollar ($)</option>
                      <option value="€">Euro (€)</option>
                      <option value="£">British Pound (£)</option>
                    </select>
                  </div>

                  {/* Sample Format Preview Card */}
                  <div className="p-5 rounded-2xl bg-[#12131b] border border-[#23273b] space-y-3">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Live Customer Menu Formatting</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300 font-medium">Sample Margherita Pizza</span>
                      <span className="text-base font-extrabold text-amber-400 font-heading">
                        {formData.currency}299.00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Global Submit Action Bar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isSubscriptionActive}
                className="w-full flex justify-center items-center py-4 px-6 rounded-2xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Saving Changes...</span>
                  </div>
                ) : restaurant ? (
                  <div className="flex items-center gap-2">
                    <span>Save & Update Profile</span>
                    <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <span>Create Restaurant Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Smartphone Customer Device Mockup */}
        <div className="space-y-6">
          <div className="bg-[#161720] border border-[#262837] p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23273b] pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 font-heading flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Customer Mobile Mockup
              </h3>
              <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Real-Time
              </span>
            </div>

            {/* Smartphone Device Frame */}
            <div className="w-full bg-[#090a0f] border-2 border-[#23273b] rounded-3xl p-4 shadow-2xl space-y-4 relative overflow-hidden">
              
              {/* Smartphone Notch Bar */}
              <div className="w-24 h-4 bg-[#141520] mx-auto rounded-b-xl flex items-center justify-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#262839]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#262839]" />
              </div>

              {/* Brand Header Avatar & Details */}
              <div className="bg-[#141520] p-4 rounded-2xl border border-[#23273b] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a1c29] border-2 border-amber-500/50 overflow-hidden flex items-center justify-center shrink-0 shadow-xl">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-amber-400 font-extrabold text-sm">
                        {formData.name?.charAt(0)?.toUpperCase() || 'R'}
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-extrabold text-white truncate font-heading">
                      {formData.name || 'Your Restaurant Name'}
                    </h4>
                    <p className="text-[10px] text-amber-400/90 font-semibold truncate mt-0.5">
                      📞 {formData.phone || 'Contact Phone'}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 border-t border-[#23273b] pt-2">
                  <p className="truncate">📍 {formData.address || 'Street Address'}</p>
                </div>
              </div>

              {/* Sample Mobile Menu Card */}
              <div className="bg-[#141520] p-3.5 rounded-2xl border border-[#23273b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Chef's Special Pizza</span>
                  <span className="text-xs font-extrabold text-amber-400 font-heading">
                    {formData.currency}399.00
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 line-clamp-1">
                  Fresh mozzarella, basil, & artisanal sauce.
                </p>
                <div className="flex justify-end pt-1">
                  <span className="text-[10px] font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 rounded-lg shadow-sm">
                    + Add Item
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 text-center">
              Real-time mobile simulation showing your live digital QR storefront.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfilePage;
