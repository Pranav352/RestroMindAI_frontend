import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminApi from '../api/admin';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminUsersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || '';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [actionUserId, setActionUserId] = useState(null); // to track loading for individual user toggles
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false,
  });

  // Sync state if URL search param changes (e.g. navigation from dashboard pending alert link)
  useEffect(() => {
    setStatusFilter(statusParam);
    setCurrentPage(1);
  }, [statusParam]);

  // Debounce search term to prevent excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getUsers(page, search, status);
      if (data && data.results) {
        setUsers(data.results);
        setPagination({
          count: data.count,
          next: data.next,
          previous: data.previous,
        });
      } else {
        // Fallback if pagination is disabled in backend
        setUsers(Array.isArray(data) ? data : []);
        setPagination({
          count: data.length || 0,
          next: null,
          previous: null,
        });
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError('Failed to fetch platform users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleStatusFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    setCurrentPage(1);
    setSearchParams(val ? { status: val } : {});
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setActionUserId(userId);
    try {
      await adminApi.updateUserStatus(userId, !currentStatus);
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err) {
      console.error('Error toggling user active status:', err);
      setError('Failed to update user status.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleUpdateSubscription = async (userId, plan, status) => {
    setActionUserId(userId);
    try {
      const updatedUser = await adminApi.updateUserSubscription(userId, { plan, status });
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, subscription: updatedUser.subscription } : u))
      );
    } catch (err) {
      console.error('Error updating user subscription:', err);
      setError('Failed to update user subscription.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeleteUser = (userId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User Account?',
      message: 'Are you sure you want to permanently delete this user? All their restaurants and data will be lost.',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await adminApi.deleteUser(userId);
          setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
          setPagination((prev) => ({ ...prev, count: Math.max(0, prev.count - 1) }));
        } catch (err) {
          console.error('Error deleting user:', err);
          setError('Failed to delete user.');
        }
      },
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Manage Platform Users
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            View details, suspend/activate, or delete registered user accounts
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 max-w-md w-full sm:justify-end">
          {/* Status Dropdown */}
          <div className="relative w-full sm:w-48 shrink-0">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-[#161720] border border-[#262837] text-gray-200 focus:outline-none focus:border-amber-500/50 transition duration-200 text-sm appearance-none cursor-pointer"
            >
              <option value="">All Subscriptions</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="stopped">Stopped</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161720] border border-[#262837] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition duration-200 text-sm"
            />
            <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
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

      {/* Users table */}
      <div className="bg-[#161720] border border-[#262837] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-[200px] items-center justify-center bg-[#161720]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-[#262837] text-left text-sm text-gray-300">
              <thead className="bg-[#12131b] text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">User Email</th>
                  <th scope="col" className="px-6 py-4">Role</th>
                  <th scope="col" className="px-6 py-4">Restaurants</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Subscription / Trial</th>
                  <th scope="col" className="px-6 py-4">Date Joined</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262837]/50 bg-[#161720]">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#1a1b26]/50 transition duration-150">
                      <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${user.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : user.role === 'owner'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-200">
                        {user.restaurant_count}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          disabled={actionUserId === user.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition duration-200 ${user.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                            } disabled:opacity-50`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'owner' && user.subscription ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-400 capitalize">
                                {user.subscription.plan === 'free_trial' ? 'Free Trial' : 'Premium'}
                              </span>
                              
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                user.subscription.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : user.subscription.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                    : user.subscription.status === 'stopped'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                      : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              }`}>
                                {user.subscription.status === 'active' && user.subscription.days_remaining > 0
                                  ? `${user.subscription.days_remaining}d Left`
                                  : user.subscription.status === 'active'
                                    ? 'Expired'
                                    : user.subscription.status === 'stopped'
                                      ? 'Stopped'
                                      : user.subscription.status === 'pending'
                                        ? 'Pending'
                                        : user.subscription.status}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {user.subscription.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateSubscription(user.id, 'free_trial', 'active')}
                                  disabled={actionUserId === user.id}
                                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition duration-150 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}
                              {user.subscription.status === 'active' && (
                                <button
                                  onClick={() => handleUpdateSubscription(user.id, 'free_trial', 'stopped')}
                                  disabled={actionUserId === user.id}
                                  className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-slate-950 font-semibold border border-red-500/30 transition duration-150 disabled:opacity-50"
                                >
                                  Stop
                                </button>
                              )}
                              {(user.subscription.status === 'stopped' || user.subscription.status === 'expired') && (
                                <button
                                  onClick={() => handleUpdateSubscription(user.id, 'free_trial', 'active')}
                                  disabled={actionUserId === user.id}
                                  className="text-[10px] px-2 py-0.5 rounded bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold transition duration-150 disabled:opacity-50"
                                >
                                  Continue
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-transparent text-red-400 hover:text-[#0f1015] bg-red-500/5 hover:bg-red-500 transition duration-300 font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {(pagination.next || pagination.previous) && (
          <div className="flex items-center justify-between px-6 py-4 bg-[#12131b] border-t border-[#262837]">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.previous}
                className="relative inline-flex items-center rounded-xl border border-[#262837] bg-[#161720] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1b26] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.next}
                className="relative ml-3 inline-flex items-center rounded-xl border border-[#262837] bg-[#161720] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1b26] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing{' '}
                  <span className="font-medium text-white">
                    {(currentPage - 1) * 10 + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-white">
                    {Math.min(currentPage * 10, pagination.count)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-white">{pagination.count}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-xl border border-[#262837] overflow-hidden" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.previous}
                    className="relative inline-flex items-center px-3 py-2 text-gray-400 bg-[#161720] hover:bg-[#1a1b26] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#1a1b26] border-x border-[#262837]">
                    Page {currentPage}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.next}
                    className="relative inline-flex items-center px-3 py-2 text-gray-400 bg-[#161720] hover:bg-[#1a1b26] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        isDanger={confirmDialog.isDanger}
      />
    </div>
  );
};

export default AdminUsersPage;
