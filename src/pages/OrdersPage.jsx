import React, { useState, useEffect } from 'react';
import ordersApi from '../api/orders';
import { useAuth } from '../context/AuthContext';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [refreshCount, setRefreshCount] = useState(0);

  const subscription = user?.subscription;
  const isSubscriptionActive = subscription?.status === 'active' && 
    (subscription?.days_remaining > 0 || subscription?.days_remaining === null);

  const fetchOrders = async () => {
    try {
      setError('');
      const data = await ordersApi.getOwnerOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Could not retrieve orders. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Poll orders every 8 seconds for real-time tracking
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      setError('');
      await ordersApi.updateOrderStatus(orderId, status);
      fetchOrders(); // Immediately refresh after status update
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    }
  };

  const tabs = [
    { id: 'all', name: 'All Orders' },
    { id: 'pending', name: 'Pending' },
    { id: 'preparing', name: 'Preparing' },
    { id: 'served', name: 'Served' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' },
  ];

  // Filters orders based on selected tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  // Calculate order stats for dashboard cards
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    served: orders.filter(o => o.status === 'served').length,
    revenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.total_price), 0)
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'preparing':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'served':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  // Helper for formatting time (relative or HH:MM)
  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            Live Orders Board
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track and dispatch customer orders per table in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Live Polling Active</span>
          <button
            onClick={() => setRefreshCount(prev => prev + 1)}
            className="p-2 bg-[#161720] hover:bg-[#1e202e] border border-[#262837] rounded-xl text-gray-400 hover:text-gray-200 transition"
            title="Refresh Orders"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Pending Acceptance</p>
          <p className="text-3xl font-extrabold text-white mt-2 font-heading">{stats.pending}</p>
        </div>

        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">In Kitchen</p>
          <p className="text-3xl font-extrabold text-blue-400 mt-2 font-heading">{stats.preparing}</p>
        </div>

        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Served Tables</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2 font-heading">{stats.served}</p>
        </div>

        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Completed Revenue</p>
          <p className="text-3xl font-extrabold text-amber-500 mt-2 font-heading">
            ₹{stats.revenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex border-b border-[#262837] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 px-5 font-semibold text-sm border-b-2 whitespace-nowrap transition-all duration-300 outline-none ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.name}
            {orders.filter(o => tab.id === 'all' ? true : o.status === tab.id).length > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                activeTab === tab.id ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1e202e] text-gray-500'
              }`}>
                {orders.filter(o => tab.id === 'all' ? true : o.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-[#161720] border border-[#262837] rounded-3xl">
          <svg className="h-12 w-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-bold text-gray-200">No Orders Found</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
            {activeTab === 'all'
              ? 'No customer orders have been placed yet.'
              : `No orders are currently in "${activeTab}" status.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-[#161720] border border-[#262837] hover:border-[#35384e] p-6 rounded-2xl shadow-xl flex flex-col justify-between transition duration-300 relative"
            >
              {/* Order Card Top Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-200">Order #{order.id}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Placed at {formatTime(order.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-400 text-sm font-black rounded-xl border border-amber-500/15">
                      T - {order.table_number || 'N/A'}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#262837]/50 pt-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Guest</p>
                  <p className="text-xs text-gray-200 font-semibold">{order.customer_name || 'Anonymous Guest'}</p>
                </div>

                {/* Items List */}
                <div className="pt-2 space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ordered Items</p>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-300">
                          <strong className="text-amber-500">{item.quantity}x</strong> {item.menu_item_name}
                        </span>
                        <span className="text-gray-400">
                          ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Card Bottom Info & Actions */}
              <div className="mt-6 pt-4 border-t border-[#262837]/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-gray-400">Total Price</span>
                  <span className="text-base font-bold text-amber-500 font-heading">
                    ₹{parseFloat(order.total_price).toFixed(2)}
                  </span>
                </div>

                {/* Dynamic Actions based on status */}
                {isSubscriptionActive ? (
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-[#0f1015] text-xs font-bold rounded-xl transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          className="px-3.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'served')}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-[#0f1015] text-xs font-bold rounded-xl transition"
                      >
                        Mark as Served
                      </button>
                    )}

                    {order.status === 'served' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0f1015] text-xs font-bold rounded-xl transition"
                      >
                        Complete Order
                      </button>
                    )}

                    {['completed', 'cancelled'].includes(order.status) && (
                      <div className="w-full text-center py-2 bg-[#1d1f2b] rounded-xl text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                        Order Processed
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full text-center py-2 bg-[#1d1f2b] rounded-xl text-[10px] text-red-400/75 border border-red-500/10 font-semibold uppercase tracking-wide">
                    Read-only (Trial Ended)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
