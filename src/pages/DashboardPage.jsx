import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

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

const OwnerDashboard = ({ user, refreshUser }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState({
    categoriesCount: 0,
    itemsCount: 0,
    tablesCount: 0,
    todayOrdersCount: 0,
    todayPendingOrdersCount: 0,
    todayRevenue: 0.0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const subscription = user?.subscription;
  // An subscription is active only if status is 'active' and has remaining days or doesn't have an expiry
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, restResponse] = await Promise.all([
          api.get('/api/owner/stats/'),
          api.get('/api/restaurants/')
        ]);

        if (statsResponse.data && statsResponse.data.has_restaurant) {
          if (restResponse.data && restResponse.data.length > 0) {
            setRestaurant(restResponse.data[0]);
          }
          const s = statsResponse.data.stats;
          setStats({
            categoriesCount: s.categories_count || 0,
            itemsCount: s.items_count || 0,
            tablesCount: s.tables_count || 0,
            todayOrdersCount: s.today_orders_count || 0,
            todayPendingOrdersCount: s.today_pending_orders_count || 0,
            todayRevenue: s.today_revenue || 0.0,
          });
          setRecentOrders(statsResponse.data.recent_orders || []);
        } else {
          setRestaurant(null);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to fetch dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


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

  return (
    <div className="space-y-8 font-sans">
      {renderSubscriptionBanner()}
      
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time metrics for {restaurant.name}
          </p>
        </div>
        <div className="text-xs text-gray-400 font-semibold bg-[#161720] border border-[#262837] px-4 py-2.5 rounded-xl self-start sm:self-auto">
          📅 Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue Card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-24 w-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today's Revenue</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-heading">
            {restaurant.currency}{stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-4 text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            From completed & served orders
          </div>
        </div>

        {/* Today's Orders Card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-24 w-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today's Orders</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-heading">{stats.todayOrdersCount}</p>
          <div className="mt-4">
            {stats.todayPendingOrdersCount > 0 ? (
              <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                {stats.todayPendingOrdersCount} pending orders to action
              </div>
            ) : (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                All caught up!
              </div>
            )}
          </div>
        </div>

        {/* Menu stats card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-24 w-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Menu Overview</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-white font-heading">{stats.itemsCount}</span>
            <span className="text-gray-500 text-sm">items in {stats.categoriesCount} categories</span>
          </div>
          <div className="mt-4">
            <Link to="/menu" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition">
              Manage Menu List
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* QR Tables Card */}
        <div className="bg-[#161720] border border-[#262837] p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#383a53] transition duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg className="h-24 w-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active QR Tables</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-heading">{stats.tablesCount}</p>
          <div className="mt-4">
            <Link to="/qr" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition">
              Manage Tables / QR
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
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
                  <th className="py-3 px-4 text-right">Total</th>
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
                    <td className="py-3.5 px-4 text-right font-extrabold text-white font-heading">
                      {restaurant.currency}{parseFloat(order.total_price).toFixed(2)}
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
              src={
                restaurant.logo.startsWith('http')
                  ? restaurant.logo
                  : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${restaurant.logo}`
              }
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
    </div>
  );
};

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <OwnerDashboard user={user} refreshUser={refreshUser} />;
};

export default DashboardPage;
