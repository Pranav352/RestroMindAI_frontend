import React, { useState, useEffect } from 'react';
import adminApi from '../api/admin';

const AdminRestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  // Debounce search term to prevent excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchRestaurants = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getRestaurants(page, search);
      if (data && data.results) {
        setRestaurants(data.results);
        setPagination({
          count: data.count,
          next: data.next,
          previous: data.previous,
        });
      } else {
        // Fallback if pagination is disabled in backend
        setRestaurants(Array.isArray(data) ? data : []);
        setPagination({
          count: data.length || 0,
          next: null,
          previous: null,
        });
      }
    } catch (err) {
      console.error('Error fetching admin restaurants:', err);
      setError('Failed to fetch platform restaurants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handleDeleteRestaurant = async (restaurantId) => {
    if (!window.confirm('Are you sure you want to permanently delete this restaurant? This will remove all their categories, menu items, and tables.')) {
      return;
    }
    try {
      await adminApi.deleteRestaurant(restaurantId);
      setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
      setPagination((prev) => ({ ...prev, count: Math.max(0, prev.count - 1) }));
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      alert('Failed to delete restaurant.');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
    }
  };

  if (loading && restaurants.length === 0) {
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
            Manage Onboarded Restaurants
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Overview of all active food spots on the platform and removal controls
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search by restaurant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161720] border border-[#262837] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition duration-200 text-sm"
          />
          <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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

      {/* Restaurants list table */}
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
                  <th scope="col" className="px-6 py-4">Restaurant</th>
                  <th scope="col" className="px-6 py-4">Owner Email</th>
                  <th scope="col" className="px-6 py-4">Phone</th>
                  <th scope="col" className="px-6 py-4">Address</th>
                  <th scope="col" className="px-6 py-4">Date Created</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262837]/50 bg-[#161720]">
                {restaurants.length > 0 ? (
                  restaurants.map((res) => (
                    <tr key={res.id} className="hover:bg-[#1a1b26]/50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#1e202e] border border-[#2c2f42] flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
                            {res.logo ? (
                              <img
                                src={
                                  res.logo.startsWith('http')
                                    ? res.logo
                                    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${res.logo}`
                                }
                                alt={res.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-amber-500 uppercase">
                                {res.name.substring(0, 2)}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-white truncate max-w-[180px]">{res.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{res.owner_email}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-amber-500">{res.phone || 'No phone'}</td>
                      <td className="px-6 py-4 text-xs max-w-[200px] truncate">{res.address || 'No address'}</td>
                      <td className="px-6 py-4 text-xs text-gray-505">
                        {res.created_at ? new Date(res.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteRestaurant(res.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-transparent text-red-400 hover:text-[#0f1015] bg-red-500/5 hover:bg-red-500 transition duration-300 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No restaurants onboarded yet.
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
    </div>
  );
};

export default AdminRestaurantsPage;
