import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useRestaurant from '../hooks/useRestaurant';
import { useAuth } from '../context/AuthContext';

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

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currency: '₹', // Default inr and currently used inr only
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            const logoUrl = rest.logo.startsWith('http')
              ? rest.logo
              : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${rest.logo}`;
            setLogoPreview(logoUrl);
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
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, setSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, WEBP, and GIF images are allowed.');
        e.target.value = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be under 5MB.');
        e.target.value = null;
        return;
      }
      setError('');
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Restaurant name is required.');
      return;
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Phone number must be a valid format (e.g. +1234567890 or 123-456-7890) with 7 to 20 digits.');
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
        }, 1500);
      }
      setLogoFile(null);
    } catch (err) {
      // Error message is set in hook
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

  return (
    <div className="space-y-8 font-sans max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
          Restaurant Profile
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {restaurant ? 'Update your restaurant info and branding' : 'Create your restaurant brand to get started'}
        </p>
      </div>

      {!isSubscriptionActive && subscription && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2 mb-4">
          <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            {subscription.status === 'pending'
              ? 'Your account is pending admin approval. Profile updates are disabled in read-only mode.'
              : 'Your trial period has ended or has been paused. Profile updates are disabled in read-only mode.'}
          </span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-start gap-2">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#161720] border border-[#262837] p-8 rounded-2xl shadow-xl space-y-6">
        {/* Logo upload field */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#262837]">
          <div className="relative w-24 h-24 rounded-2xl bg-[#1e202e] border border-[#2c2f42] overflow-hidden flex items-center justify-center shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <svg className="h-10 w-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1 w-full text-center sm:text-left space-y-2">
            <h3 className="text-md font-semibold text-gray-200">Restaurant Logo</h3>
            <p className="text-xs text-gray-400">JPEG, PNG formats accepted. Recommended square image.</p>
            <label className={`inline-block mt-2 px-4 py-2 bg-[#252839] ${!isSubscriptionActive ? 'text-gray-500 cursor-not-allowed opacity-50' : 'hover:bg-[#2b2f44] text-amber-400 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer'} rounded-lg text-xs font-semibold transition duration-200`}>
              Browse Image
              <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" disabled={!isSubscriptionActive} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Restaurant Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isSubscriptionActive}
              className={`w-full px-4 py-3 rounded-xl bg-[#1e202e] border ${!isSubscriptionActive ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60' : 'border-[#2c2f42] focus:border-amber-500/50 text-gray-100'} placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200`}
              placeholder="e.g. Gourmet Bistro"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Contact Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isSubscriptionActive}
              className={`w-full px-4 py-3 rounded-xl bg-[#1e202e] border ${!isSubscriptionActive ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60' : 'border-[#2c2f42] focus:border-amber-500/50 text-gray-100'} placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200`}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Street Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              disabled={!isSubscriptionActive}
              className={`w-full px-4 py-3 rounded-xl bg-[#1e202e] border ${!isSubscriptionActive ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60' : 'border-[#2c2f42] focus:border-amber-500/50 text-gray-100'} placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200`}
              placeholder="e.g. 123 Culinary St, Food City"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Menu Currency Symbol</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              disabled={!isSubscriptionActive}
              className={`w-full px-4 py-3 rounded-xl bg-[#1e202e] border ${!isSubscriptionActive ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60' : 'border-[#2c2f42] focus:border-amber-500/50 text-gray-100'} focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition duration-200 text-sm`}
            >
              <option value="₹">INR (₹)</option>
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !isSubscriptionActive}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-[#0f1015] bg-amber-500 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0f1015] border-t-transparent"></div>
            ) : restaurant ? (
              'Update Profile'
            ) : (
              'Create Restaurant'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantProfilePage;
