import React, { useState, useEffect, useRef } from 'react';
import ordersApi from '../api/orders';
import authApi from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { playNewOrderChime, isAudioMuted, toggleAudioMuted } from '../utils/audioAlert';
import PaymentModal from '../components/PaymentModal';
import KotPrintModal from '../components/KotPrintModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import DatePickerModal, { getLocalTodayDateString } from '../components/DatePickerModal';
import WalkoutModal from '../components/WalkoutModal';

const OrdersPage = () => {
  const { user } = useAuth();
  const currencySymbol = user?.restaurant?.currency || '₹';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // View & Filter states
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'cancelled' | 'all'
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'grid' | 'tables'
  const [datePreset, setDatePreset] = useState('today'); // 'today' | 'yesterday' | 'custom' | 'all'
  const [selectedCustomDate, setSelectedCustomDate] = useState(() => getLocalTodayDateString());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [multiRoundOnly, setMultiRoundOnly] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [muted, setMuted] = useState(isAudioMuted());
  const [collapsedOrders, setCollapsedOrders] = useState({});

  // Modal states
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [selectedOrderForKot, setSelectedOrderForKot] = useState(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [selectedOrderForWalkout, setSelectedOrderForWalkout] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const prevActiveItemsCount = useRef(null);
  const prevOrdersMapRef = useRef({});
  const wakeLockRef = useRef(null);

  // Screen Wake Lock API implementation for kitchen display tablets
  useEffect(() => {
    let isMounted = true;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('[PWA KDS] Screen Wake Lock active — Kitchen display screen will remain on.');
        } catch (err) {
          console.warn('[PWA KDS] Wake Lock error:', err.message);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMounted) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  const subscription = user?.subscription;
  const isSubscriptionActive = subscription?.status === 'active' && 
    (subscription?.days_remaining > 0 || subscription?.days_remaining === null);

  // System Settings & Governance / Feature Flag Checks
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
        if (sys) {
          setSystemSettings(sys);
          localStorage.setItem('system_settings_cache', JSON.stringify(sys));
        }
      } catch (err) {
        console.error('Error fetching system settings in OrdersPage:', err);
      }
    };
    fetchSystemSettings();
  }, []);

  const isFreeTier = user?.role !== 'admin' && (user?.subscription?.plan === 'free_trial' || !user?.subscription?.plan);
  
  // Kitchen features allowed check (Governance rule + Admin system settings)
  const isKitchenFeatureAllowed = !(isFreeTier && (systemSettings ? systemSettings.free_tier_allow_kitchen_settings === false : (localStorage.getItem('ff_free_kitchen') === 'false')));

  // Sound notification setting from Owner Settings / localStorage
  const isSoundNotificationSettingEnabled = (() => {
    try {
      const savedSoundSetting = localStorage.getItem('setting_order_sound');
      if (savedSoundSetting !== null) {
        return JSON.parse(savedSoundSetting) !== false;
      }
    } catch (e) {}
    return true;
  })();

  const showSoundToggle = isKitchenFeatureAllowed && isSoundNotificationSettingEnabled;
  const showKotFeatures = isKitchenFeatureAllowed;

  const getActiveQueryDate = () => {
    if (datePreset === 'today') return 'today';
    if (datePreset === 'yesterday') return 'yesterday';
    if (datePreset === 'custom') return selectedCustomDate;
    return 'all'; // 'all' time
  };

  const handleJumpToOrder = (orderId) => {
    setHighlightedOrderId(orderId);
    const el = document.getElementById(`order-card-${orderId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedOrderId(null);
    }, 4000);
  };

  const fetchOrders = async () => {
    try {
      setError('');
      const queryDate = getActiveQueryDate();
      const data = await ordersApi.getOwnerOrders(queryDate);
      
      // Calculate total non-cancelled line items across all active (pending/preparing/served) orders
      const currentActiveItemsCount = (data || []).reduce((acc, order) => {
        if (['pending', 'preparing', 'served'].includes(order.status)) {
          return acc + (order.items || []).filter(i => i.status !== 'cancelled').length;
        }
        return acc;
      }, 0);

      // Detect round additions on existing orders for interactive toast banner
      const newOrdersMap = {};
      (data || []).forEach(order => {
        const roundCount = getGroupedRounds(order.items).roundKeys.length;
        newOrdersMap[order.id] = roundCount;
        
        const prevRoundCount = prevOrdersMapRef.current[order.id];
        if (prevRoundCount !== undefined && roundCount > prevRoundCount) {
          setToastAlert({
            orderId: order.id,
            tableNumber: order.table_number || 'N/A',
            roundNumber: roundCount,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      });
      prevOrdersMapRef.current = newOrdersMap;

      // Trigger audio alert whenever new orders or round items arrive
      if (prevActiveItemsCount.current !== null && currentActiveItemsCount > prevActiveItemsCount.current) {
        playNewOrderChime();
      }
      prevActiveItemsCount.current = currentActiveItemsCount;

      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Could not retrieve orders. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time tracking: Dual-layer (Sub-second SSE stream + 8s polling fallback)
  useEffect(() => {
    fetchOrders();

    // 1. Primary Layer: Sub-second SSE Instant Order Stream
    let eventSource = null;
    try {
      const token = localStorage.getItem('access_token');
      const activeTenant = localStorage.getItem('active_tenant_id') || '';
      const baseUrl = import.meta.env.VITE_API_URL || '';
      if (token) {
        // EventSource with bearer token in query parameter for authentication
        const streamUrl = `${baseUrl}/api/orders/stream/?token=${encodeURIComponent(token)}${activeTenant ? `&tenant_id=${activeTenant}` : ''}`;
        eventSource = new EventSource(streamUrl);

        const handleIncomingStreamEvent = () => {
          playNewOrderChime();
          fetchOrders();
        };

        eventSource.addEventListener('new_order', handleIncomingStreamEvent);
        eventSource.addEventListener('order_updated', handleIncomingStreamEvent);
      }
    } catch (e) {
      console.log('SSE Stream notice:', e);
    }

    // 2. Backup Layer: 8-second polling fallback
    const interval = setInterval(() => {
      fetchOrders();
    }, 8000);

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [refreshCount, datePreset, selectedCustomDate]);

  const handleToggleSound = () => {
    const isNowMuted = toggleAudioMuted();
    setMuted(isNowMuted);
  };

  const toggleCollapseOrder = (orderId) => {
    setCollapsedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const [autoKotPrint, setAutoKotPrint] = useState(() => {
    return localStorage.getItem('auto_kot_print') === 'true';
  });

  const toggleAutoKotPrint = () => {
    const nextVal = !autoKotPrint;
    setAutoKotPrint(nextVal);
    localStorage.setItem('auto_kot_print', String(nextVal));
  };

  const handleUpdateStatus = async (orderId, status, paymentMethod = null) => {
    try {
      setError('');
      setActionLoading(true);
      await ordersApi.updateOrderStatus(orderId, status, paymentMethod);
      setSelectedOrderForPayment(null);

      // Auto-KOT Thermal Print trigger on Accept Order
      if (status === 'preparing' && autoKotPrint) {
        const targetOrder = orders.find(o => o.id === orderId);
        if (targetOrder) {
          setSelectedOrderForKot(targetOrder);
        }
      }

      fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmVoidWalkout = async (reason, customerPhone) => {
    if (!selectedOrderForWalkout) return;
    try {
      setError('');
      setActionLoading(true);
      await ordersApi.updateOrderStatus(selectedOrderForWalkout.id, 'cancelled', null, reason);
      setSelectedOrderForWalkout(null);
      fetchOrders();
    } catch (err) {
      console.error('Error voiding order:', err);
      setError('Failed to void order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecoverPayment = async (orderId) => {
    try {
      setError('');
      setActionLoading(true);
      await ordersApi.recoverPayment(orderId, 'upi');
      fetchOrders();
    } catch (err) {
      console.error('Error recovering payment:', err);
      setError('Failed to mark payment as recovered. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRoundStatus = async (orderId, roundNumber, status) => {
    try {
      setError('');
      await ordersApi.updateOrderRoundStatus(orderId, roundNumber, status);
      fetchOrders();
    } catch (err) {
      console.error('Error updating round status:', err);
      setError('Failed to update round status. Please try again.');
    }
  };

  const handleUpdateItemStatus = async (orderId, itemId, status) => {
    try {
      setError('');
      await ordersApi.updateOrderItemStatus(orderId, itemId, status);
      fetchOrders();
    } catch (err) {
      console.error('Error updating item status:', err);
      setError('Failed to update item status. Please try again.');
    }
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    // Automatically switch to Grid view when viewing history tabs if in Kanban mode
    if (tabId !== 'active' && viewMode === 'kanban') {
      setViewMode('grid');
    }
  };

  // Helper for SLA relative timer
  const getSlaInfo = (timeString) => {
    try {
      const createdTime = new Date(timeString).getTime();
      const now = Date.now();
      const elapsedMinutes = Math.max(0, Math.floor((now - createdTime) / (1000 * 60)));

      let style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      if (elapsedMinutes >= 15) {
        style = 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse';
      } else if (elapsedMinutes >= 10) {
        style = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      }

      return {
        minutes: elapsedMinutes,
        label: `⏱️ ${elapsedMinutes}m ago`,
        style
      };
    } catch (e) {
      return { minutes: 0, label: '⏱️ Just now', style: 'bg-gray-500/10 text-gray-400' };
    }
  };

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
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

  // Group items helper for orders
  const getGroupedRounds = (items = []) => {
    const grouped = (items || []).reduce((acc, item) => {
      const r = item.round || 1;
      if (!acc[r]) acc[r] = [];
      acc[r].push(item);
      return acc;
    }, {});
    const roundKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    return { grouped, roundKeys };
  };

  // 1. Filter by Tab
  const tabFilteredOrders = orders.filter((order) => {
    if (activeTab === 'active') {
      return ['pending', 'preparing', 'served'].includes(order.status);
    }
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  // 2. Filter by Multi-Round Toggle
  const tabAndMultiFilteredOrders = tabFilteredOrders.filter((order) => {
    if (multiRoundOnly) {
      const { roundKeys } = getGroupedRounds(order.items);
      return roundKeys.length > 1;
    }
    return true;
  });

  // 3. Filter by Search Query (Supports Order #, Table #, Guest Name, and Dish / Item Name)
  const finalFilteredOrders = tabAndMultiFilteredOrders.filter((order) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const tableStr = (order.table_number || '').toString();
    const matchesTable = tableStr.includes(query) || `table ${tableStr}`.toLowerCase().includes(query);
    const matchesCustomer = (order.customer_name || '').toLowerCase().includes(query);
    const idStr = (order.id || '').toString();
    const matchesId = idStr.includes(query) || `#${idStr}`.includes(query);
    const matchesItem = (order.items || []).some(item => (item.menu_item_name || '').toLowerCase().includes(query));
    return matchesTable || matchesCustomer || matchesId || matchesItem;
  });

  // 4. Auto-Bump Sorting: Float orders with unserved new rounds to TOP of queue
  const sortedAndFilteredOrders = [...finalFilteredOrders].sort((a, b) => {
    const aRounds = getGroupedRounds(a.items).roundKeys;
    const bRounds = getGroupedRounds(b.items).roundKeys;

    const aHasUnservedNewRound = aRounds.length > 1 && (a.items || []).some(i => i.round === Math.max(...aRounds.map(Number)) && i.status !== 'served' && i.status !== 'cancelled');
    const bHasUnservedNewRound = bRounds.length > 1 && (b.items || []).some(i => i.round === Math.max(...bRounds.map(Number)) && i.status !== 'served' && i.status !== 'cancelled');

    if (aHasUnservedNewRound && !bHasUnservedNewRound) return -1;
    if (!aHasUnservedNewRound && bHasUnservedNewRound) return 1;

    const aLatestTime = new Date(a.updated_at || a.created_at).getTime();
    const bLatestTime = new Date(b.updated_at || b.created_at).getTime();
    return bLatestTime - aLatestTime;
  });

  const multiRoundCount = orders.filter(o => ['pending', 'preparing', 'served'].includes(o.status) && getGroupedRounds(o.items).roundKeys.length > 1).length;

  // Dashboard Stats (Revenue includes completed sales + recovered walkouts)
  const stats = {
    active: orders.filter(o => ['pending', 'preparing', 'served'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders
      .filter(o => o.status === 'completed' || (o.status === 'cancelled' && o.is_recovered))
      .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
  };

  const tabs = [
    { id: 'active', name: '🔥 Active Queue', count: stats.active },
    { id: 'completed', name: '✅ Completed', count: stats.completed },
    { id: 'cancelled', name: '❌ Cancelled', count: stats.cancelled },
    { id: 'all', name: '📁 All Orders', count: orders.length },
  ];

  const getDateLabel = () => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'custom') return selectedCustomDate;
    return 'All Time';
  };

  // Render Card Component
  const renderOrderCard = (order, isCompact = false) => {
    const sla = getSlaInfo(order.created_at);
    const isSlaBreached = sla.minutes >= 15 && ['pending', 'preparing'].includes(order.status);
    const { grouped: groupedRounds, roundKeys } = getGroupedRounds(order.items);
    const isCollapsed = collapsedOrders[order.id];

    const maxRound = Math.max(...roundKeys.map(Number));
    const latestRoundItems = groupedRounds[maxRound] || [];
    const isLatestRoundUnserved = maxRound > 1 && latestRoundItems.some(i => i.status !== 'served' && i.status !== 'cancelled');
    const isHighlighted = highlightedOrderId === order.id;

    return (
      <div
        key={order.id}
        id={`order-card-${order.id}`}
        className={`bg-[#161720] border border-[#262837] hover:border-[#3a3d54] rounded-2xl shadow-xl flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${
          isHighlighted
            ? 'ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-[1.02]'
            : isSlaBreached
            ? 'ring-2 ring-red-500/80 animate-pulse'
            : isLatestRoundUnserved
            ? 'ring-2 ring-amber-500/70'
            : order.status === 'pending'
            ? 'ring-1 ring-amber-500/40'
            : ''
        } ${isCompact ? 'p-4' : 'p-5'}`}
      >
        {/* Order Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white font-heading">
                  Order #{order.id}
                </h3>
                {['pending', 'preparing'].includes(order.status) && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${sla.style}`}>
                    {sla.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Placed at {formatTime(order.created_at)}</p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-black rounded-xl border border-amber-500/15 font-heading">
                Table {order.table_number || 'N/A'}
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${getStatusBadgeClass(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Sub Header / Guest & Payment */}
          <div className="border-t border-[#262837]/50 pt-2 flex justify-between items-center text-xs">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Guest</p>
              <p className="text-xs text-gray-200 font-semibold truncate max-w-[120px]">
                {order.customer_name || 'Walk-in Guest'}
              </p>
            </div>

            {order.payment_method && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Payment</p>
                <p className="text-xs text-amber-400 font-semibold uppercase">{order.payment_method}</p>
              </div>
            )}

            <div className="text-right">
              <button
                onClick={() => toggleCollapseOrder(order.id)}
                className="text-[10px] font-bold bg-[#1e202e] hover:bg-[#282b3d] text-amber-400 px-2.5 py-1 rounded-full border border-[#2c2f42] transition flex items-center gap-1"
              >
                <span>{roundKeys.length} {roundKeys.length === 1 ? 'Round' : 'Rounds'}</span>
                <span>{isCollapsed ? '▼' : '▲'}</span>
              </button>
            </div>
          </div>

          {/* Multi-Round Visual Stepper Header */}
          <div className="flex items-center gap-1.5 flex-wrap my-1 bg-[#12131a] p-2 rounded-xl border border-[#232635]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Rounds:</span>
            {roundKeys.map((rNum) => {
              const itemsInRound = groupedRounds[rNum] || [];
              const isRoundServed = itemsInRound.every(i => i.status === 'served' || i.status === 'cancelled');
              const isRoundPreparing = itemsInRound.some(i => i.status === 'preparing');
              
              return (
                <span
                  key={rNum}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border flex items-center gap-1 transition ${
                    isRoundServed
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : isRoundPreparing
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span>R{rNum}</span>
                  <span>{isRoundServed ? '✓' : isRoundPreparing ? '⚡' : '⏳'}</span>
                </span>
              );
            })}

            {isLatestRoundUnserved && (
              <span className="ml-auto px-2 py-0.5 text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-[#0f1015] rounded-lg shadow animate-bounce">
                🔥 R{maxRound} NEW
              </span>
            )}
          </div>

          {/* Multi-Round Items */}
          {!isCollapsed && (
            <div className="pt-1 space-y-2 max-h-[240px] overflow-y-auto pr-1 no-scrollbar">
              {roundKeys.map((roundNum) => {
                const roundItems = groupedRounds[roundNum];
                const allServed = roundItems.every(i => i.status === 'served');
                const anyPreparing = roundItems.some(i => i.status === 'preparing');
                const anyPending = roundItems.some(i => i.status === 'pending');

                return (
                  <div key={roundNum} className="bg-[#12131a] border border-[#232635] rounded-xl p-2.5 space-y-1.5">
                    <div className="flex justify-between items-center pb-1 border-b border-[#1e202e]">
                      <span className="text-[10px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1 font-heading">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                        Round {roundNum}
                      </span>
                      
                      {isSubscriptionActive && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <div>
                          {allServed ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              Served ✓
                            </span>
                          ) : anyPreparing ? (
                            <button
                              onClick={() => handleUpdateRoundStatus(order.id, roundNum, 'served')}
                              className="text-[9px] font-bold bg-emerald-500 hover:bg-emerald-600 text-[#0f1015] px-1.5 py-0.5 rounded transition"
                            >
                              Serve R{roundNum}
                            </button>
                          ) : anyPending ? (
                            <button
                              onClick={() => handleUpdateRoundStatus(order.id, roundNum, 'preparing')}
                              className="text-[9px] font-bold bg-blue-500 hover:bg-blue-600 text-[#0f1015] px-1.5 py-0.5 rounded transition"
                            >
                              Cook R{roundNum}
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {roundItems.map((item) => (
                        <div key={item.id} className="text-xs space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 flex items-center gap-1 text-[11px]">
                              <strong className="text-amber-400">{item.quantity}x</strong> {item.menu_item_name}
                              {item.status === 'cancelled' && <span className="text-[9px] text-red-400 font-bold">(Cancelled)</span>}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 text-[10px]">
                                {currencySymbol}{(parseFloat(item.price) * item.quantity).toFixed(2)}
                              </span>

                              {isSubscriptionActive && ['pending', 'preparing'].includes(order.status) && item.status !== 'cancelled' && (
                                <div className="flex items-center gap-1">
                                  {item.status === 'pending' && (
                                    <button
                                      onClick={() => handleUpdateItemStatus(order.id, item.id, 'preparing')}
                                      className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded font-bold transition"
                                    >
                                      Cook
                                    </button>
                                  )}
                                  {item.status === 'preparing' && (
                                    <button
                                      onClick={() => handleUpdateItemStatus(order.id, item.id, 'served')}
                                      className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded font-bold transition"
                                    >
                                      Served
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {item.notes && (
                            <p className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/15">
                              📝 Note: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 border-t border-[#262837]/50">
          <div className="flex justify-between items-center mb-3 gap-2">
            <div className="flex items-center gap-1.5">
              {['served', 'completed'].includes(order.status) && (
                <button
                  onClick={() => setSelectedOrderForReceipt(order)}
                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 transition flex items-center gap-1"
                  title="View / Print Tax Invoice"
                >
                  <span>📄</span> Invoice
                </button>
              )}
              {showKotFeatures && (
                <button
                  onClick={() => setSelectedOrderForKot(order)}
                  className="px-2.5 py-1.5 bg-[#1e202e] hover:bg-[#252839] text-gray-300 hover:text-white text-xs font-bold rounded-xl border border-[#2c2f42] transition flex items-center gap-1"
                  title="Print Kitchen Ticket"
                >
                  <span>🖨️</span> KOT
                </button>
              )}
            </div>
            
            <div className="text-right">
              <span className="text-[9px] font-bold text-gray-400 block uppercase">Total Bill</span>
              <span className="text-base font-extrabold text-amber-500 font-heading">
                {currencySymbol}{parseFloat(order.total_price || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          {isSubscriptionActive ? (
            <div className="flex gap-2">
              {order.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-[#0f1015] text-xs font-extrabold rounded-xl transition shadow"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition"
                  >
                    Decline
                  </button>
                </>
              )}

              {order.status === 'preparing' && (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'served')}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0f1015] text-xs font-extrabold rounded-xl transition shadow"
                  >
                    Mark All Served
                  </button>
                  <button
                    onClick={() => setSelectedOrderForWalkout(order)}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition flex items-center gap-1"
                    title="Report Guest Walkout / Cancel Order"
                  >
                    <span>🚫</span> Void
                  </button>
                </div>
              )}

              {order.status === 'served' && (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setSelectedOrderForPayment(order)}
                    className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-[#0f1015] text-xs font-extrabold rounded-xl transition shadow flex items-center justify-center gap-1.5"
                  >
                    <span>💳</span> Settle Bill & Complete
                  </button>
                  <button
                    onClick={() => setSelectedOrderForWalkout(order)}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition flex items-center gap-1 font-heading"
                    title="Report Guest Walkout / Dine & Dash"
                  >
                    <span>🚫</span> Walkout
                  </button>
                </div>
              )}

              {order.status === 'completed' && (
                <div className="w-full text-center py-1.5 bg-[#1d1f2b] rounded-xl text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                  Order Completed
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-[10px] bg-[#1a151b] border border-red-500/20 p-2 rounded-xl text-red-300 font-sans">
                    <span className="truncate max-w-[140px]">
                      Reason: <strong>{order.cancellation_reason || 'Cancelled'}</strong>
                    </span>
                    {order.is_recovered ? (
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-extrabold">
                        💰 Recovered ✓
                      </span>
                    ) : (
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
                        Unpaid
                      </span>
                    )}
                  </div>

                  {!order.is_recovered && (
                    <button
                      onClick={() => handleRecoverPayment(order.id)}
                      disabled={actionLoading}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0f1015] text-xs font-extrabold rounded-xl transition shadow flex items-center justify-center gap-1.5 font-heading"
                    >
                      <span>💰</span> Mark Paid & Recovered
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full text-center py-1.5 bg-[#1d1f2b] rounded-xl text-[10px] text-red-400/75 border border-red-500/10 font-semibold uppercase tracking-wide">
              Read-only
            </div>
          )}
        </div>
      </div>
    );
  };

  const occupiedTablesCount = new Set(
    orders
      .filter(o => ['pending', 'preparing', 'served'].includes(o.status) && o.table_number)
      .map(o => o.table_number)
  ).size;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-[#14151f] border border-[#232536] p-4 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-heading">
              Live Orders Board
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5 font-sans">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE STREAM
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Real-time kitchen order dispatch system & bill settlement hub.
          </p>
        </div>

        {/* Right Controls: Grouped Pods for Guaranteed 1-Row Alignment */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status & Control Pod */}
          <div className="bg-[#101119] border border-[#222434] p-1 rounded-xl flex items-center gap-1 text-xs">
            <div className="px-2.5 py-1 text-xs font-bold text-gray-300 flex items-center gap-1.5 border-r border-[#222434] pr-3">
              <span className="text-amber-400 font-extrabold">🪑 Tables:</span>
              <span className="text-amber-400 font-extrabold font-heading px-1.5 py-0.2 bg-amber-500/15 rounded border border-amber-500/25">
                {occupiedTablesCount}
              </span>
            </div>

            {showSoundToggle && (
              <button
                onClick={handleToggleSound}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  muted
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
                title="Toggle Audio Alert Chime"
              >
                <span>{muted ? '🔇 Sound OFF' : '🔊 Sound ON'}</span>
              </button>
            )}

            {showKotFeatures && (
              <button
                onClick={toggleAutoKotPrint}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  autoKotPrint
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Automatically open KOT Print dialog on order acceptance"
              >
                <span>{autoKotPrint ? '⚡ Auto-KOT: ON' : '⚡ Auto-KOT: OFF'}</span>
              </button>
            )}
          </div>

          {/* Date Selector Pod */}
          <div className="relative flex items-center gap-1 bg-[#101119] border border-[#222434] rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                setDatePreset('today');
                setIsDatePickerOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                datePreset === 'today'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setDatePreset('yesterday');
                setIsDatePickerOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                datePreset === 'yesterday'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => {
                setDatePreset('custom');
                setIsDatePickerOpen(prev => !prev);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                datePreset === 'custom'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'text-gray-400 hover:text-white'
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
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                datePreset === 'all'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Time
            </button>

            {/* Inline Dark Popover Calendar */}
            <DatePickerModal
              isOpen={isDatePickerOpen}
              onClose={() => setIsDatePickerOpen(false)}
              selectedDate={selectedCustomDate}
              onSelectDate={(dateStr) => {
                setSelectedCustomDate(dateStr);
                setDatePreset('custom');
              }}
            />
          </div>

          {/* Refresh Action Button */}
          <button
            onClick={() => setRefreshCount(prev => prev + 1)}
            className="p-2.5 bg-[#101119] hover:bg-[#1c1e2b] border border-[#222434] rounded-xl text-gray-400 hover:text-gray-200 transition"
            title="Refresh Orders"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats Summary Counter Cards (Consolidated 3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Live Queue</p>
            <p className="text-3xl font-black text-amber-400 mt-1 font-heading">{stats.active}</p>
          </div>
          <span className="text-3xl p-3 bg-amber-500/10 rounded-2xl border border-amber-500/15">⚡</span>
        </div>

        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Completed ({getDateLabel()})
            </p>
            <p className="text-3xl font-black text-emerald-400 mt-1 font-heading">{stats.completed}</p>
          </div>
          <span className="text-3xl p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/15">✅</span>
        </div>

        <div className="bg-[#161720] border border-[#262837] p-5 rounded-2xl shadow flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Revenue ({getDateLabel()})
            </p>
            <p className="text-3xl font-black text-amber-500 mt-1 font-heading">
              {currencySymbol}{stats.revenue.toFixed(2)}
            </p>
          </div>
          <span className="text-3xl p-3 bg-amber-500/10 rounded-2xl border border-amber-500/15">💰</span>
        </div>
      </div>

      {/* UNIFIED CONTROL TOOLBAR HUB CARD */}
      <div className="bg-[#161720] border border-[#262837] rounded-2xl p-3 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Left Segmented Tab Pills */}
        <div className="bg-[#101119] p-1 border border-[#222434] rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`py-1.5 px-3 font-bold text-xs rounded-lg whitespace-nowrap transition-all duration-200 outline-none flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black font-extrabold shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29]'
              }`}
            >
              <span>{tab.name}</span>
              <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${
                activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-[#1d1f2e] text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Controls: Multi-Round Chip, View Switcher & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Multi-Round Filter Chip */}
          {activeTab === 'active' && (
            <button
              type="button"
              onClick={() => setMultiRoundOnly(!multiRoundOnly)}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition border flex items-center gap-1.5 ${
                multiRoundOnly
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-[#101119] text-gray-400 border-[#222434] hover:text-white hover:border-gray-600'
              }`}
              title="Filter tables with multiple rounds"
            >
              <span>🔂</span> Multi-Round
              {multiRoundCount > 0 && (
                <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-black ${
                  multiRoundOnly ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {multiRoundCount}
                </span>
              )}
            </button>
          )}

          {/* View Switcher Segmented Pills */}
          <div className="bg-[#101119] p-1 border border-[#222434] rounded-xl flex items-center gap-1">
            {activeTab === 'active' && (
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                  viewMode === 'kanban' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
                title="Kanban Swimlanes View"
              >
                <span>📊</span> Kanban
              </button>
            )}
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <span>🎴</span> Grid
            </button>
            <button
              onClick={() => setViewMode('tables')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                viewMode === 'tables' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Table-Wise View"
            >
              <span>🪑</span> By Table
            </button>
          </div>

          {/* Expandable Click-to-Search Control */}
          {!isSearchExpanded && !searchQuery ? (
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="px-3 py-1.5 bg-[#101119] hover:bg-[#1c1e2b] border border-[#222434] hover:border-amber-500/40 text-gray-400 hover:text-amber-400 rounded-xl font-bold text-xs transition duration-200 flex items-center gap-1.5 shadow"
              title="Click to search orders, tables, guests, or dishes"
            >
              <span>🔍</span>
              <span>Search</span>
            </button>
          ) : (
            <div className="relative animate-fadeIn min-w-[220px] sm:min-w-[260px]">
              <span className="absolute left-3 top-2 text-xs text-amber-400 font-bold">🔍</span>
              <input
                autoFocus
                type="text"
                placeholder="Search Table, Guest, #ID, Dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101119] border border-amber-500/50 focus:border-amber-400 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none transition shadow-lg shadow-amber-500/5 font-medium"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchExpanded(false);
                }}
                className="absolute right-2.5 top-1.5 text-xs text-gray-400 hover:text-white font-bold transition"
                title="Close search"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Toast Banner for New Round / Order Arrivals */}
      {toastAlert && (
        <div className="fixed top-20 right-6 z-50 bg-[#1a1b26] border-2 border-amber-500/80 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 max-w-md animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold">
              🔔
            </div>
            <div>
              <p className="text-xs font-black text-amber-400 uppercase tracking-wider font-heading">
                {toastAlert.roundNumber > 1 ? `Round ${toastAlert.roundNumber} Added!` : 'New Order Arrived!'}
              </p>
              <p className="text-xs font-bold text-gray-200 mt-0.5">
                Table {toastAlert.tableNumber} • {toastAlert.timestamp}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleJumpToOrder(toastAlert.orderId);
                setToastAlert(null);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-[#0f1015] font-black text-xs rounded-xl shadow transition whitespace-nowrap"
            >
              🎯 Jump to Table
            </button>
            <button
              onClick={() => setToastAlert(null)}
              className="text-gray-400 hover:text-white p-1 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area based on View Mode */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : viewMode === 'kanban' && activeTab === 'active' ? (
        /* KANBAN BOARD VIEW (Always renders 3 Swimlane Columns) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Pending */}
          <div className="bg-[#12131c] border border-[#222435] rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="font-extrabold text-amber-400 text-xs uppercase tracking-wider font-heading">
                  New Pending ({sortedAndFilteredOrders.filter(o => o.status === 'pending').length})
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {sortedAndFilteredOrders
                .filter(o => o.status === 'pending')
                .map(order => renderOrderCard(order, true))}
              {sortedAndFilteredOrders.filter(o => o.status === 'pending').length === 0 && (
                <div className="text-center py-12 text-xs text-gray-500 bg-[#161720]/60 rounded-2xl border border-dashed border-amber-500/20 flex flex-col items-center justify-center gap-2.5 p-6 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/5">
                    📥
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-200 text-sm font-heading">No Pending Orders</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">New customer table orders will pop up here in real-time</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Kitchen */}
          <div className="bg-[#12131c] border border-[#222435] rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-blue-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                <h3 className="font-extrabold text-blue-400 text-xs uppercase tracking-wider font-heading">
                  In Kitchen ({sortedAndFilteredOrders.filter(o => o.status === 'preparing').length})
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {sortedAndFilteredOrders
                .filter(o => o.status === 'preparing')
                .map(order => renderOrderCard(order, true))}
              {sortedAndFilteredOrders.filter(o => o.status === 'preparing').length === 0 && (
                <div className="text-center py-12 text-xs text-gray-500 bg-[#161720]/60 rounded-2xl border border-dashed border-blue-500/20 flex flex-col items-center justify-center gap-2.5 p-6 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/5">
                    🍳
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-200 text-sm font-heading">Kitchen Station Clear</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">No dishes currently cooking in kitchen queue</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Served & Billing */}
          <div className="bg-[#12131c] border border-[#222435] rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-extrabold text-emerald-400 text-xs uppercase tracking-wider font-heading">
                  Served / Settle ({sortedAndFilteredOrders.filter(o => o.status === 'served').length})
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {sortedAndFilteredOrders
                .filter(o => o.status === 'served')
                .map(order => renderOrderCard(order, true))}
              {sortedAndFilteredOrders.filter(o => o.status === 'served').length === 0 && (
                <div className="text-center py-12 text-xs text-gray-500 bg-[#161720]/60 rounded-2xl border border-dashed border-emerald-500/20 flex flex-col items-center justify-center gap-2.5 p-6 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/5">
                    🛎️
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-200 text-sm font-heading">No Billing Pending</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Served tables ready for bill settlement will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : sortedAndFilteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-[#161720] border border-[#262837] rounded-3xl">
          <svg className="h-12 w-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-bold text-gray-200">No Orders Found</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No orders match "${searchQuery}".`
              : activeTab === 'active'
              ? `No active orders found for ${getDateLabel()}.`
              : `No orders found for ${getDateLabel()} in "${activeTab}" status.`}
          </p>
        </div>
      ) : viewMode === 'tables' ? (
        /* TABLE-WISE GROUPED VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            // Group orders by table_number
            const tableMap = sortedAndFilteredOrders.reduce((acc, order) => {
              const tableKey = order.table_number || 'Takeaway / N/A';
              if (!acc[tableKey]) acc[tableKey] = [];
              acc[tableKey].push(order);
              return acc;
            }, {});

            return Object.keys(tableMap).map((tableNum) => {
              const tableOrders = tableMap[tableNum];
              const runningTotal = tableOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

              return (
                <div key={tableNum} className="bg-[#161720] border border-[#262837] rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-[#262837] pb-3">
                    <div>
                      <h3 className="text-lg font-black text-amber-400 font-heading">
                        Table {tableNum}
                      </h3>
                      <p className="text-xs text-gray-400">{tableOrders.length} Order(s)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Running Bill</span>
                      <p className="text-lg font-extrabold text-emerald-400 font-heading">
                        {currencySymbol}{runningTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {tableOrders.map(order => renderOrderCard(order, true))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : (
        /* STANDARD REDESIGNED GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndFilteredOrders.map(order => renderOrderCard(order, false))}
        </div>
      )}

      {/* Payment Settlement Modal */}
      <PaymentModal
        order={selectedOrderForPayment}
        isOpen={Boolean(selectedOrderForPayment)}
        onClose={() => setSelectedOrderForPayment(null)}
        loading={actionLoading}
        currency={currencySymbol}
        onConfirm={(paymentMethod) => {
          if (selectedOrderForPayment) {
            handleUpdateStatus(selectedOrderForPayment.id, 'completed', paymentMethod);
          }
        }}
      />

      {/* Kitchen Order Ticket (KOT) Thermal Receipt Modal */}
      <KotPrintModal
        order={selectedOrderForKot}
        isOpen={Boolean(selectedOrderForKot)}
        onClose={() => setSelectedOrderForKot(null)}
      />

      {/* Digital Tax Invoice Modal */}
      <DigitalReceiptModal
        order={selectedOrderForReceipt}
        restaurant={user?.restaurant || { name: 'Restaurant', currency: currencySymbol }}
        isOpen={Boolean(selectedOrderForReceipt)}
        onClose={() => setSelectedOrderForReceipt(null)}
      />

      {/* Walkout & Payment Recovery Modal */}
      <WalkoutModal
        order={selectedOrderForWalkout}
        isOpen={Boolean(selectedOrderForWalkout)}
        onClose={() => setSelectedOrderForWalkout(null)}
        loading={actionLoading}
        currency={currencySymbol}
        onConfirmVoid={handleConfirmVoidWalkout}
      />
    </div>
  );
};

export default OrdersPage;
