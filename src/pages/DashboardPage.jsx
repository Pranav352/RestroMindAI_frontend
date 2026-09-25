import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import restaurantApi from '../api/restaurant';
import authApi from '../api/auth';
import ordersApi from '../api/orders';
import DatePickerModal, { getLocalTodayDateString } from '../components/DatePickerModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import { getMediaUrl } from '../config/env';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await api.get('/api/admin/stats/');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to fetch platform metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2">
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  const getSubStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
      case 'active':
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
      case 'expired':
      case 'stopped':
        return 'bg-red-500/10 border border-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/10 border border-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Platform Admin Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time metrics and platform activity
          </p>
        </div>
        <div className="text-xs text-gray-400 font-semibold bg-[#161720] border border-[#262837] px-4 py-2.5 rounded-xl self-start sm:self-auto">
          🛡️ Admin View
        </div>
      </div>

      {/* Pending Approvals Notification */}
      {stats?.pending_approvals > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span>
              <strong>{stats.pending_approvals}</strong> restaurant owner{stats.pending_approvals > 1 ? 's are' : ' is'} awaiting subscription approval.
            </span>
          </div>
          <Link
            to="/admin/users?status=pending"
            className="text-xs px-3.5 py-1.5 bg-amber-500 text-[#0f1015] hover:bg-amber-400 font-bold rounded-lg transition text-center shrink-0"
          >
            Review Pending Users
          </Link>
        </div>
      )}

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Users Card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-20 w-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Users</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-heading">{stats?.total_users || 0}</p>
          <div className="mt-4">
            <Link to="/admin/users" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition">
              Manage Users
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Restaurants Card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-20 w-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Restaurants</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-heading">{stats?.total_restaurants || 0}</p>
          <div className="mt-4">
            <Link to="/admin/restaurants" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition">
              Manage Restaurants
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-20 w-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Categories</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-heading">{stats?.total_categories || 0}</p>
          <div className="mt-4 text-xs text-gray-500 font-semibold">Across all restaurants</div>
        </div>

        {/* Menu Items Card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-20 w-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Menu Items</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-heading">{stats?.total_menu_items || 0}</p>
          <div className="mt-4 text-xs text-gray-500 font-semibold">Aggregate items</div>
        </div>

        {/* QR Tables Card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-20 w-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zm-6 0H4v4h2v-4zm0-6H4v4h2v-4zm10-6h.01M18 16h.01M21 21v-3a2 2 0 00-2-2h-3M3 21v-3a2 2 0 012-2h3M21 3v3a2 2 0 01-2 2h-3M3 3v3a2 2 0 002 2h3" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active Tables</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-heading">{stats?.total_tables || 0}</p>
          <div className="mt-4 text-xs text-gray-500 font-semibold">QR codes generated</div>
        </div>
      </div>

      {/* Subscription Breakdown & Platform Growth Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white font-heading">Subscription Health</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-[#1e202e] border border-[#2c2f42] rounded-xl">
              <span className="text-2xl font-extrabold text-emerald-400 font-heading">{stats?.active_subscriptions || 0}</span>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Active Trials</p>
            </div>
            <div className="p-4 bg-[#1e202e] border border-[#2c2f42] rounded-xl">
              <span className="text-2xl font-extrabold text-amber-400 font-heading">{stats?.pending_approvals || 0}</span>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Pending</p>
            </div>
            <div className="p-4 bg-[#1e202e] border border-[#2c2f42] rounded-xl">
              <span className="text-2xl font-extrabold text-red-400 font-heading">{stats?.expired_subscriptions || 0}</span>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Expired/Stopped</p>
            </div>
          </div>
        </div>

        {/* Growth & Engagement */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white font-heading">Growth & Engagement</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-[#1e202e] border border-[#2c2f42] rounded-xl">
              <span className="text-2xl font-extrabold text-white font-heading">+{stats?.new_users_7_days || 0}</span>
              <p className="text-xs text-gray-400 mt-1 font-semibold">New Users (7d)</p>
            </div>
            <div className="p-4 bg-[#1e202e] border border-[#2c2f42] rounded-xl">
              <span className="text-2xl font-extrabold text-white font-heading">+{stats?.new_restaurants_7_days || 0}</span>
              <p className="text-xs text-gray-400 mt-1 font-semibold">New Restros (7d)</p>
            </div>
            <div className="p-4 bg-[#1e202e] border border-[#2c2f42] rounded-xl">
              <span className="text-2xl font-extrabold text-amber-500 font-heading">{stats?.total_orders_today || 0}</span>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Orders Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Admin Actions Row */}
      <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white font-heading">Quick Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-4 bg-[#1e202e] hover:bg-[#252839] border border-[#2c2f42] hover:border-amber-500/30 rounded-xl text-gray-300 hover:text-amber-400 transition duration-300"
          >
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">Manage Platform Users</p>
              <p className="text-xs text-gray-500">Approve plans & toggle status</p>
            </div>
          </Link>

          <Link
            to="/admin/restaurants"
            className="flex items-center gap-3 p-4 bg-[#1e202e] hover:bg-[#252839] border border-[#2c2f42] hover:border-amber-500/30 rounded-xl text-gray-300 hover:text-amber-400 transition duration-300"
          >
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">Manage Restaurants</p>
              <p className="text-xs text-gray-500">Track operations and profiles</p>
            </div>
          </Link>

          <Link
            to="/admin/users?status=pending"
            className="flex items-center gap-3 p-4 bg-[#1e202e] hover:bg-[#252839] border border-[#2c2f42] hover:border-amber-500/30 rounded-xl text-gray-300 hover:text-amber-400 transition duration-300"
          >
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">Review Pending Users</p>
              <p className="text-xs text-gray-500">Access approval list directly</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Signups Feed */}
      <div className="bg-[#161720] border border-[#262837] p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-heading">Recent Registrations</h2>
          <Link to="/admin/users" className="text-xs text-amber-400 hover:text-amber-300 font-bold transition flex items-center gap-1">
            See All Users
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {stats?.recent_signups?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400 border-collapse">
              <thead>
                <tr className="border-b border-[#2c2f42] text-xs font-semibold uppercase text-gray-500">
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Subscription Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2c2f42]/40">
                {stats.recent_signups.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1a1b26]/30 transition duration-150">
                    <td className="py-3.5 px-4 font-semibold text-white">{user.email}</td>
                    <td className="py-3.5 px-4 uppercase text-xs font-bold tracking-wider text-gray-300">{user.role}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(user.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2.5 py-1 text-xs font-extrabold uppercase rounded-full border ${getSubStatusStyle(user.subscription_status)}`}>
                        {user.subscription_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-[#2c2f42] rounded-xl">
            <p className="text-sm text-gray-500 font-medium">No signups found on the platform.</p>
          </div>
        )}
      </div>

      {/* System Health Board */}
      <div className="bg-[#161720] border border-[#262837] p-8 rounded-2xl shadow-xl space-y-6">
        <h2 className="text-xl font-bold text-white font-heading">Product Overview</h2>
        <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
          Welcome to the RestroMind AI platform admin board. As the product owner, you can manage user registrations, toggle their access status, or delete restaurants and users that violate terms. All systems are operational.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/admin/users" className="px-5 py-3 border border-[#2c2f42] hover:border-amber-500/30 text-gray-300 hover:text-amber-400 bg-[#1e202e] hover:bg-[#252839] rounded-xl text-sm font-semibold text-center transition duration-300">
            Access User Panel
          </Link>
          <Link to="/admin/restaurants" className="px-5 py-3 border border-[#2c2f42] hover:border-amber-500/30 text-gray-300 hover:text-amber-400 bg-[#1e202e] hover:bg-[#252839] rounded-xl text-sm font-semibold text-center transition duration-300">
            Access Restaurant Panel
          </Link>
        </div>
      </div>
    </div>
  );
};

const OwnerDashboard = ({ user, refreshUser, activeTenantId }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [datePreset, setDatePreset] = useState('today'); // 'today' | 'yesterday' | 'custom' | 'all'
  const [selectedCustomDate, setSelectedCustomDate] = useState(() => getLocalTodayDateString());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' or 'orders'
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [updatingStoreStatus, setUpdatingStoreStatus] = useState(false);
  const [peakHour, setPeakHour] = useState(null);
  const [categorySales, setCategorySales] = useState([]);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [stats, setStats] = useState({
    categoriesCount: 0,
    itemsCount: 0,
    tablesCount: 0,
    todayOrdersCount: 0,
    todayPendingOrdersCount: 0,
    todayRevenue: 0.0,
    revenueDelta: 0.0,
    ordersDelta: 0.0,
    aov: 0.0,
    occupancyRate: 0.0,
    cancellationRate: 0.0,
    timeframeLabel: 'Today'
  });
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [hourlySales, setHourlySales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const subscription = user?.subscription;
  const isSubscriptionActive = subscription?.status === 'active' && 
    (subscription?.days_remaining > 0 || subscription?.days_remaining === null);

  const renderSubscriptionBanner = () => {
    if (!subscription) return null;

    if (subscription.status === 'pending') {
      return (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>Your account is pending admin approval. You can view the dashboard, but you cannot edit or create new items.</span>
        </div>
      );
    }

    if (subscription.status === 'active') {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>You are currently using the <strong>Free Trial</strong>.</span>
          </div>
          <span className="font-semibold">{subscription.days_remaining} Days Remaining</span>
        </div>
      );
    }

    if (subscription.status === 'stopped' || subscription.status === 'expired' || !isSubscriptionActive) {
      return (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Your trial period has ended or been stopped by the admin. The platform is in read-only mode. Please contact the administrator to continue.</span>
        </div>
      );
    }

    return null;
  };

  const fetchDashboardData = async (selectedTimeframe = timeframe, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      setError('');
      const [statsResResult, restResResult] = await Promise.allSettled([
        authApi.getOwnerStats(selectedTimeframe),
        api.get('/api/restaurants/')
      ]);

      const statsResponse = statsResResult.status === 'fulfilled' ? statsResResult.value : null;
      const restResponse = restResResult.status === 'fulfilled' ? restResResult.value : null;

      const userRestaurants = Array.isArray(restResponse?.data) ? restResponse.data : [];
      const hasRestaurantInList = userRestaurants.length > 0;
      const hasRestaurantInStats = Boolean(statsResponse?.has_restaurant);

      if (hasRestaurantInList || hasRestaurantInStats) {
        if (hasRestaurantInList) {
          setRestaurant(userRestaurants[0]);
          setIsAcceptingOrders(userRestaurants[0].is_accepting_orders ?? true);
        } else if (statsResponse?.restaurant_id) {
          setRestaurant({
            id: statsResponse.restaurant_id,
            name: statsResponse.restaurant_name,
            currency: statsResponse.currency || '₹',
            is_accepting_orders: statsResponse.is_accepting_orders ?? true
          });
        }

        if (statsResponse) {
          const s = statsResponse.stats || {};
          setStats({
            categoriesCount: s.categories_count || 0,
            itemsCount: s.items_count || 0,
            tablesCount: s.tables_count || 0,
            todayOrdersCount: s.today_orders_count || 0,
            todayPendingOrdersCount: s.today_pending_orders_count || 0,
            todayRevenue: s.today_revenue || 0.0,
            revenueDelta: s.revenue_delta || 0.0,
            ordersDelta: s.orders_delta || 0.0,
            aov: s.aov || 0.0,
            occupancyRate: s.occupancy_rate || 0.0,
            cancellationRate: s.cancellation_rate || 0.0,
            timeframeLabel: s.timeframe_label || 'Today'
          });
          setTopSellingItems(statsResponse.top_selling_items || []);
          setHourlySales(statsResponse.hourly_sales || []);
          setRecentOrders(statsResponse.recent_orders || []);
          setPeakHour(statsResponse.peak_hour || null);
          setCategorySales(statsResponse.category_sales || []);
        }
      } else {
        setRestaurant(null);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard statistics.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const getActiveQueryDate = () => {
    if (datePreset === 'today') return 'today';
    if (datePreset === 'yesterday') return 'yesterday';
    if (datePreset === 'custom') return selectedCustomDate;
    return 'all';
  };

  // Primary fetch & 15s silent background polling
  useEffect(() => {
    const qDate = getActiveQueryDate();
    fetchDashboardData(qDate);

    const interval = setInterval(() => {
      fetchDashboardData(qDate, true);
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTenantId, datePreset, selectedCustomDate]);

  const handleToggleStoreStatus = async () => {
    if (!restaurant) return;
    try {
      setUpdatingStoreStatus(true);
      const nextStatus = !isAcceptingOrders;
      await restaurantApi.updateStoreStatus(restaurant.id, nextStatus);
      setIsAcceptingOrders(nextStatus);
    } catch (err) {
      console.error('Error updating store status:', err);
      alert('Failed to update store status. Please try again.');
    } finally {
      setUpdatingStoreStatus(false);
    }
  };

  const handleExportCSV = () => {
    if (!recentOrders || recentOrders.length === 0) {
      alert('No sales data available to export for the selected period.');
      return;
    }
    const headers = ['Order ID', 'Table', 'Customer', 'Date/Time', 'Status', 'Total Price'];
    const rows = recentOrders.map(o => [
      `#${o.id}`,
      `Table ${o.table_number || 'Takeaway'}`,
      `"${(o.customer_name || 'Anonymous').replace(/"/g, '""')}"`,
      `"${new Date(o.created_at).toLocaleString()}"`,
      o.status,
      parseFloat(o.total_price || 0).toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkServed = async (orderId) => {
    try {
      await ordersApi.updateOrderStatus(orderId, 'served');
      setRecentOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'served' } : o));
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to mark order as served.');
    }
  };

  const handlePrintReceipt = (order) => {
    setSelectedReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="space-y-6 font-sans">
        {renderSubscriptionBanner()}
        <div className="text-center py-16 max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">Welcome to RestroMind AI</h2>
          <p className="text-gray-400">
            To get started, please set up your restaurant profile first. This will enable menu categories and food item management.
          </p>
          {isSubscriptionActive ? (
            <Link
              to="/profile"
              className="inline-block px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-[#0f1015] font-semibold rounded-xl transition duration-300"
            >
              Set up Restaurant Profile
            </Link>
          ) : (
            <button
              disabled
              className="inline-block px-6 py-3.5 bg-gray-600 text-gray-400 font-semibold rounded-xl cursor-not-allowed opacity-50"
            >
              Set up Restaurant Profile (Disabled)
            </button>
          )}
        </div>
      </div>
    );
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
      case 'preparing':
        return 'bg-blue-500/10 border border-blue-500/20 text-blue-400';
      case 'served':
        return 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400';
      case 'completed':
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
      case 'cancelled':
        return 'bg-red-500/10 border border-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/10 border border-gray-500/20 text-gray-400';
    }
  };

  const steps = [
    { label: 'Set up Restaurant Profile', completed: true },
    { label: 'Create Menu Categories', completed: stats.categoriesCount > 0, link: '/menu' },
    { label: 'Add Food Dishes / Menu Items', completed: stats.itemsCount > 0, link: '/menu' },
    { label: 'Generate QR Codes for Tables', completed: stats.tablesCount > 0, link: '/qr' },
  ];
  const stepsCompleted = steps.filter(s => s.completed).length;
  const progressPercentage = Math.round((stepsCompleted / steps.length) * 100);
  const showChecklist = progressPercentage < 100;
  const currencySymbol = restaurant?.currency || '₹';

  const maxChartRevenue = Math.max(...(hourlySales || []).map(h => Number(h?.revenue) || 0), 100);
  const maxChartOrders = Math.max(...(hourlySales || []).map(h => Number(h?.orders) || 0), 5);
  const activeMaxVal = chartMetric === 'revenue' ? maxChartRevenue : maxChartOrders;

  return (
    <div className="space-y-8 font-sans">
      {renderSubscriptionBanner()}
      
      {/* Welcome header & Store Online Control */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-[#14151f] border border-[#232536] p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
              {restaurant?.name || 'Restaurant'} Dashboard
            </h1>
            
            {/* Store Accepting Orders Toggle Pill */}
            <button
              onClick={handleToggleStoreStatus}
              disabled={updatingStoreStatus}
              className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1.5 shadow ${
                isAcceptingOrders
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
              }`}
              title="Toggle Store Accepting / Pausing Digital QR Orders"
            >
              <span className={`h-2 w-2 rounded-full ${isAcceptingOrders ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span>{isAcceptingOrders ? '🟢 Store Online (Accepting Orders)' : '🔴 Store Busy (Orders Paused)'}</span>
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Real-time sales velocity, key performance indicators & operational telemetry.
          </p>
        </div>

        {/* Timeframe Selector Pod (Today, Yesterday, Custom Date, All Time) */}
        <div className="relative bg-[#101119] border border-[#222434] p-1.5 rounded-xl flex flex-wrap items-center gap-1 self-start xl:self-auto text-xs font-bold">
          <button
            onClick={() => {
              setDatePreset('today');
              setIsDatePickerOpen(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition duration-200 ${
              datePreset === 'today'
                ? 'bg-amber-500 text-black font-extrabold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1c29]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              setDatePreset('yesterday');
              setIsDatePickerOpen(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition duration-200 ${
              datePreset === 'yesterday'
                ? 'bg-amber-500 text-black font-extrabold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1c29]'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              setDatePreset('custom');
              setIsDatePickerOpen(prev => !prev);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition duration-200 flex items-center gap-1.5 ${
              datePreset === 'custom'
                ? 'bg-amber-500 text-black font-extrabold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1c29]'
            }`}
          >
            <span>📅</span>
            <span>{datePreset === 'custom' ? selectedCustomDate : 'Custom Date'}</span>
            <span className="text-[9px]">{isDatePickerOpen ? '▲' : '▼'}</span>
          </button>
          <button
            onClick={() => {
              setDatePreset('all');
              setIsDatePickerOpen(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition duration-200 ${
              datePreset === 'all'
                ? 'bg-amber-500 text-black font-extrabold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1c29]'
            }`}
          >
            All Time
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black font-extrabold transition duration-200 flex items-center gap-1.5 shadow ml-1"
            title="Download Sales CSV Report for selected period"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>

          {/* Inline Dark Popover Calendar */}
          <DatePickerModal
            isOpen={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            selectedDate={selectedCustomDate}
            onSelectDate={(dateStr) => {
              setSelectedCustomDate(dateStr);
              setDatePreset('custom');
              setIsDatePickerOpen(false);
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Cards (5 Cards Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Revenue Card */}
        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Revenue ({stats.timeframeLabel})
          </p>
          <p className="text-3xl font-black text-white mt-2 font-heading">
            {currencySymbol}{(stats.todayRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
              (stats.revenueDelta || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {(stats.revenueDelta || 0) >= 0 ? `↑ +${stats.revenueDelta || 0}%` : `↓ ${stats.revenueDelta || 0}%`} vs prev
            </span>
            <span className="text-gray-500 text-[10px]">Net Sales</span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Orders ({stats.timeframeLabel})
          </p>
          <p className="text-3xl font-black text-white mt-2 font-heading">{stats.todayOrdersCount || 0}</p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
              (stats.ordersDelta || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {(stats.ordersDelta || 0) >= 0 ? `↑ +${stats.ordersDelta || 0}%` : `↓ ${stats.ordersDelta || 0}%`} vs prev
            </span>
            {stats.todayPendingOrdersCount > 0 ? (
              <span className="text-amber-400 font-extrabold animate-pulse text-[10px]">
                ⚡ {stats.todayPendingOrdersCount} Pending
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold text-[10px]">✓ Clean Queue</span>
            )}
          </div>
        </div>

        {/* Average Order Value (AOV) Card */}
        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Average Order Value (AOV)
          </p>
          <p className="text-3xl font-black text-amber-400 mt-2 font-heading">
            {currencySymbol}{(stats.aov || 0).toFixed(2)}
          </p>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold">
            Avg spend per completed bill
          </div>
        </div>

        {/* Table Occupancy Rate Card */}
        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Table Occupancy Rate
          </p>
          <p className="text-3xl font-black text-emerald-400 mt-2 font-heading">
            {stats.occupancyRate || 0}%
          </p>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold">
            Active dining sessions on floor
          </div>
        </div>

        {/* Cancellation Rate Card */}
        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Cancellation Rate
          </p>
          <p className={`text-3xl font-black mt-2 font-heading ${(stats.cancellationRate || 0) > 5 ? 'text-red-400' : 'text-gray-300'}`}>
            {stats.cancellationRate || 0}%
          </p>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold">
            Unrecovered voided orders
          </div>
        </div>
      </div>

      {/* Visual Sales Velocity & Analytics Section */}
      <div className="space-y-6">
        {/* Visual Hourly / Daily Sales Chart Component */}
        <div className="bg-[#161720] border border-[#262837] p-5 sm:p-6 pb-4 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#262837] pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-white font-heading">
                  Sales Velocity Chart
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase">
                  LIVE TELEMETRY
                </span>
                {peakHour && peakHour.revenue > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black bg-[#1f2130] text-amber-400 border border-amber-500/30 rounded-lg flex items-center gap-1 shadow">
                    <span>🔥 Peak Hour:</span>
                    <span className="text-white font-extrabold">{peakHour.slot}</span>
                    <span className="text-emerald-400 font-extrabold">({currencySymbol}{(peakHour.revenue || 0).toFixed(2)})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {chartMetric === 'revenue' ? 'Revenue distribution' : 'Order volume counts'} across operating intervals ({stats.timeframeLabel}).
              </p>
            </div>

            {/* Interactive Tab Switcher & Timeframe Selector Pod */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Metric Toggle Tabs */}
              <div className="bg-[#12131c] border border-[#262837] p-1 rounded-xl flex items-center gap-1 text-xs">
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1.5 rounded-lg font-extrabold transition duration-200 flex items-center gap-1.5 ${
                    chartMetric === 'revenue'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-[#1e202e]'
                  }`}
                >
                  <span>💰</span>
                  <span>Revenue</span>
                </button>
                <button
                  onClick={() => setChartMetric('orders')}
                  className={`px-3 py-1.5 rounded-lg font-extrabold transition duration-200 flex items-center gap-1.5 ${
                    chartMetric === 'orders'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-[#1e202e]'
                  }`}
                >
                  <span>📦</span>
                  <span>Orders</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-1 relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-x-0 top-12 bottom-8 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="border-b border-gray-400 border-dashed w-full"></div>
              <div className="border-b border-gray-400 border-dashed w-full"></div>
            </div>

            <div className="h-56 w-full flex items-end gap-2 sm:gap-3 border-b border-[#262837] pb-2 px-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {hourlySales.map((item, idx) => {
                const itemRev = item?.revenue || 0;
                const itemOrders = item?.orders || 0;
                const val = chartMetric === 'revenue' ? itemRev : itemOrders;
                const maxVal = activeMaxVal;
                const hasVal = val > 0;
                const maxBarHeightPercent = 60;
                const heightPercent = hasVal && maxVal > 0
                  ? Math.max(12, Math.round((val / maxVal) * maxBarHeightPercent))
                  : 0;

                return (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group relative min-w-[32px] z-10">
                    {/* Hover Tooltip */}
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#1b1d2a] border border-amber-500/40 text-white text-[11px] font-bold p-2.5 rounded-xl shadow-2xl z-30 pointer-events-none whitespace-nowrap">
                      <div className="text-gray-300 font-semibold">{item.label}</div>
                      <div className="text-amber-400 font-extrabold">{currencySymbol}{itemRev.toFixed(2)}</div>
                      <div className="text-cyan-400 text-[10px]">{itemOrders} order(s)</div>
                    </div>

                    {/* Metric amount badge over bar if non-zero */}
                    {hasVal ? (
                      <span className={`text-[10px] font-black group-hover:scale-110 transition-transform font-heading leading-none pb-1 ${
                        chartMetric === 'revenue' ? 'text-amber-400' : 'text-cyan-400'
                      }`}>
                        {chartMetric === 'revenue'
                          ? `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}`
                          : `${val}`}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-transparent select-none leading-none pb-1">-</span>
                    )}

                    {/* Bar track container */}
                    <div className="w-full flex-1 rounded-t-xl flex items-end p-0.5 group-hover:bg-amber-500/5 transition-colors">
                      {hasVal ? (
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            chartMetric === 'revenue'
                              ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 group-hover:from-amber-500 group-hover:to-orange-400 shadow-[0_0_14px_rgba(245,158,11,0.35)]'
                              : 'bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400 group-hover:from-blue-500 group-hover:to-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.35)]'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                      ) : (
                        <div className="w-full h-1 bg-[#232635] group-hover:bg-amber-500/40 rounded-full transition-colors"></div>
                      )}
                    </div>

                    {/* X-axis Label */}
                    <span className={`text-[9.5px] font-bold truncate max-w-full shrink-0 transition-colors pt-1 ${hasVal ? 'text-white font-extrabold' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top 5 Bestsellers & Category Revenue Share Dual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Best-Selling Dishes Card */}
          <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-[#262837] pb-3">
              <h3 className="text-lg font-extrabold text-white font-heading">
                🔥 Top 5 Best-Sellers
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Most ordered dishes in selected period.</p>
            </div>

            <div className="space-y-3">
              {topSellingItems.map((dish, idx) => (
                <div key={idx} className="bg-[#12131a] border border-[#232635] p-3 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-white truncate max-w-[180px] flex items-center gap-1.5 font-heading">
                      <span className="text-amber-400 font-bold">#{idx + 1}</span> {dish.name}
                    </span>
                    <div className="text-right">
                      <span className="text-amber-400 font-extrabold">
                        {currencySymbol}{(dish?.total_sales || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-semibold">
                        {dish?.total_qty ?? dish?.quantity ?? 0} sold
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {topSellingItems.length === 0 && (
                <div className="text-center py-10 text-xs text-gray-500 border border-dashed border-[#262837] rounded-xl">
                  No dish sales recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Category Revenue Share Breakdown Card */}
          <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-[#262837] pb-3">
              <h3 className="text-lg font-extrabold text-white font-heading">
                📊 Category Revenue Share
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Sales contribution breakdown across categories.</p>
            </div>

            <div className="space-y-3">
              {categorySales.map((cat, idx) => (
                <div key={idx} className="bg-[#12131a] border border-[#232635] p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-white truncate max-w-[180px] font-heading">
                      {cat.category}
                    </span>
                    <div className="text-right">
                      <span className="text-amber-400 font-extrabold">
                        {currencySymbol}{(cat.revenue || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2 font-bold">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#232635] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              {categorySales.length === 0 && (
                <div className="text-center py-10 text-xs text-gray-500 border border-dashed border-[#262837] rounded-xl">
                  No category revenue recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding checklist */}
      {showChecklist && (
        <div className="bg-[#161720] border border-[#262837] p-8 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                🚀 Restaurant Setup Guide
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Complete these steps to launch your digital menus and start receiving orders.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <div className="text-sm font-semibold text-gray-300">{progressPercentage}% Done</div>
              <div className="w-24 h-2 bg-[#2c2f42] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
                  step.completed 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-gray-300' 
                    : 'bg-[#1e202e]/50 border-[#2c2f42] text-gray-400 hover:border-[#383a53]'
                }`}
              >
                {step.completed ? (
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border border-gray-600 flex items-center justify-center text-gray-500 shrink-0 font-semibold text-xs">
                    {idx + 1}
                  </div>
                )}
                <div className="flex-1 font-semibold text-sm">
                  {step.label}
                </div>
                {!step.completed && step.link && (
                  <Link 
                    to={step.link} 
                    className="text-xs px-3 py-1.5 bg-amber-500 text-[#0f1015] hover:bg-amber-400 font-bold rounded-lg transition"
                  >
                    Action
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action buttons */}
      <div className="bg-[#161720] border border-[#262837] p-8 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white font-heading">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link 
            to="/menu" 
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-[#2c2f42] hover:border-amber-500/30 text-gray-300 hover:text-amber-400 bg-[#1e202e] hover:bg-[#252839] transition-all group duration-300"
          >
            <svg className="h-6 w-6 text-gray-400 group-hover:text-amber-400 mb-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-semibold">Add Dish / Category</span>
          </Link>

          <Link 
            to="/orders" 
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-[#2c2f42] hover:border-amber-500/30 text-gray-300 hover:text-amber-400 bg-[#1e202e] hover:bg-[#252839] transition-all group duration-300"
          >
            <svg className="h-6 w-6 text-gray-400 group-hover:text-amber-400 mb-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-semibold font-heading">View Live Orders</span>
          </Link>

          <Link 
            to="/qr" 
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-[#2c2f42] hover:border-amber-500/30 text-gray-300 hover:text-amber-400 bg-[#1e202e] hover:bg-[#252839] transition-all group duration-300"
          >
            <svg className="h-6 w-6 text-gray-400 group-hover:text-amber-400 mb-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-xs font-semibold">Generate QRs</span>
          </Link>

          <Link 
            to="/profile" 
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-[#2c2f42] hover:border-amber-500/30 text-gray-300 hover:text-amber-400 bg-[#1e202e] hover:bg-[#252839] transition-all group duration-300"
          >
            <svg className="h-6 w-6 text-gray-400 group-hover:text-amber-400 mb-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-semibold">Store Settings</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders Panel */}
      <div className="bg-[#161720] border border-[#262837] p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-heading">Recent Orders</h2>
          <Link to="/orders" className="text-xs text-amber-400 hover:text-amber-300 font-bold transition flex items-center gap-1">
            See All Orders
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400 border-collapse">
              <thead>
                <tr className="border-b border-[#2c2f42] text-xs font-semibold uppercase text-gray-500">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2c2f42]/40">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#1a1b26]/30 transition duration-150">
                    <td className="py-3.5 px-4 font-mono text-gray-300 font-semibold">#{order.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">Table {order.table_number || 'Takeaway'}</td>
                    <td className="py-3.5 px-4 text-gray-300">{order.customer_name || 'Anonymous'}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-xs font-extrabold uppercase rounded-full border ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-white font-heading">
                      {currencySymbol}{(parseFloat(order?.total_price || 0) || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status !== 'served' && order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleMarkServed(order.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded-lg transition"
                            title="Mark Order Served"
                          >
                            ✓ Serve
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-black rounded-lg transition flex items-center gap-1"
                          title="Print Digital Invoice"
                        >
                          <span>🖨️</span>
                          <span>Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-[#2c2f42] rounded-xl">
            <svg className="h-10 w-10 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 0h-2M4 9h2" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">No orders received yet today.</p>
          </div>
        )}
      </div>

      {/* Restaurant Overview panel */}
      <div className="bg-[#161720] border border-[#262837] p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-[#1e202e] border border-[#2c2f42] overflow-hidden flex items-center justify-center shrink-0">
          {restaurant.logo ? (
            <img
              src={getMediaUrl(restaurant.logo)}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h2 className="text-xl font-bold text-white font-heading">{restaurant.name}</h2>
          <p className="text-sm text-gray-400">{restaurant.address || 'No address registered'}</p>
          <p className="text-xs text-amber-500 font-semibold">{restaurant.phone || 'No phone registered'}</p>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <Link
            to="/profile"
            className="w-full md:w-auto text-center inline-block px-5 py-3 border border-[#2c2f42] hover:border-amber-500/30 text-gray-300 hover:text-amber-400 bg-[#1e202e] hover:bg-[#252839] rounded-xl text-sm font-semibold transition"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={selectedReceiptOrder}
        restaurant={restaurant}
      />
    </div>
  );
};

const DashboardPage = () => {
  const { user, refreshUser, activeTenantId } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <OwnerDashboard user={user} refreshUser={refreshUser} activeTenantId={activeTenantId} />;
};

export default DashboardPage;
