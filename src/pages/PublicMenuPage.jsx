import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ordersApi from '../api/orders';

const PublicMenuPage = () => {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get('table');

  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  // Cart and Order Placement States
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(tableParam || '');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const handleCancelOrder = async () => {
    if (!activeOrderToken) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      setCancellingOrder(true);
      const updatedOrder = await ordersApi.cancelOrder(activeOrderToken);
      setActiveOrder(updatedOrder);
      // Remove from localStorage so it does not persist active tracking
      localStorage.removeItem(`active_order_token_${restaurantId}`);
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.error || 'Failed to cancel order. It might already be in preparation.');
    } finally {
      setCancellingOrder(false);
    }
  };

  // Active Order Tracker (persisted locally)
  const [activeOrderToken, setActiveOrderToken] = useState(() => {
    return localStorage.getItem(`active_order_token_${restaurantId}`) || null;
  });
  const [activeOrder, setActiveOrder] = useState(null);

  const categoryRefs = useRef({});
  const pillsContainerRef = useRef(null);
  const stickyHeaderRef = useRef(null);

  // Poll order status if there is an active order
  const fetchActiveOrderStatus = async (token) => {
    try {
      const data = await ordersApi.getOrderStatus(token);
      setActiveOrder(data);
      if (data.status === 'completed' || data.status === 'cancelled') {
        localStorage.removeItem(`active_order_token_${restaurantId}`);
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
    }
  };

  useEffect(() => {
    if (activeOrderToken) {
      fetchActiveOrderStatus(activeOrderToken);
      const interval = setInterval(() => {
        fetchActiveOrderStatus(activeOrderToken);
      }, 8000);
      return () => clearInterval(interval);
    } else {
      setActiveOrder(null);
    }
  }, [activeOrderToken]);

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const current = prev[item.id] || { item, quantity: 0 };
      return {
        ...prev,
        [item.id]: {
          ...current,
          quantity: current.quantity + 1,
        },
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: current.quantity - 1,
        },
      };
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const finalTable = tableParam || tableNumber;
    if (!finalTable) {
      setOrderError('Please specify your table number.');
      return;
    }

    const itemsArray = Object.values(cart).map((c) => ({
      menu_item: c.item.id,
      quantity: c.quantity,
    }));

    if (itemsArray.length === 0) {
      setOrderError('Your cart is empty.');
      return;
    }

    try {
      setPlacingOrder(true);
      setOrderError('');
      const response = await ordersApi.createOrder({
        restaurant: parseInt(restaurantId, 10),
        table_number: parseInt(finalTable, 10),
        customer_name: customerName,
        items: itemsArray,
      });
      localStorage.setItem(`active_order_token_${restaurantId}`, response.tracking_token);
      setActiveOrderToken(response.tracking_token);
      setCart({});
      setIsCartOpen(false);
    } catch (err) {
      console.error('Order creation error:', err);
      setOrderError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  useEffect(() => {
    fetchPublicMenu();
  }, [restaurantId]);

  const fetchPublicMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      // Call standard axios directly (no JWT interceptors) for public access
      const response = await axios.get(`${apiBaseUrl}/api/menu/public/${restaurantId}/`);
      setMenuData(response.data);
      if (response.data?.categories?.length > 0) {
        setActiveCategory(response.data.categories[0].id);
      }
    } catch (err) {
      console.error('Error fetching public menu:', err);
      setError('Could not load the menu. Please verify the link or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      const headerHeight = stickyHeaderRef.current ? stickyHeaderRef.current.offsetHeight : 180;
      const offset = headerHeight + 20; // Extra padding
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Setup intersection observer to update active pill on scroll
  useEffect(() => {
    if (loading || !menuData?.categories) return;

    const observerOptions = {
      root: null,
      rootMargin: '-210px 0px -40% 0px',
      threshold: 0
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryId = parseInt(entry.target.getAttribute('data-category-id'), 10);
          setActiveCategory(categoryId);

          // Center the active pill in the horizontal scrolling container
          const pillElement = document.getElementById(`pill-${categoryId}`);
          if (pillElement && pillsContainerRef.current) {
            const container = pillsContainerRef.current;
            const containerWidth = container.offsetWidth;
            const pillLeft = pillElement.offsetLeft;
            const pillWidth = pillElement.offsetWidth;
            container.scrollTo({
              left: pillLeft - containerWidth / 2 + pillWidth / 2,
              behavior: 'smooth'
            });
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    // Observe all category section elements
    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading, menuData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1015] flex flex-col items-center justify-center text-gray-400">
        <svg className="animate-spin h-10 w-10 text-amber-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-semibold">Opening Digital Menu...</p>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen bg-[#0f1015] px-4 py-16 flex flex-col justify-center items-center text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mb-6 border border-red-500/20">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-heading text-gray-100">Menu Unavailable</h2>
        <p className="text-gray-400 mt-2 max-w-sm leading-relaxed">{error || 'Unable to load menu.'}</p>
      </div>
    );
  }

  const { name, logo, phone, address, categories } = menuData;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Filter items client-side based on search query
  const filteredCategories = categories.map(cat => {
    const rawItems = cat.menu_items || cat.items || [];
    const items = rawItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const rawSubcats = cat.subcategories || [];
    const subcats = rawSubcats.map(subCat => {
      const subRawItems = subCat.menu_items || subCat.items || [];
      const subItems = subRawItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return { ...subCat, items: subItems };
    }).filter(subCat => subCat.items.length > 0);

    return { ...cat, items, subcategories: subcats };
  }).filter(cat => cat.items.length > 0 || (cat.subcategories && cat.subcategories.length > 0));

  const hasItems = filteredCategories.length > 0;

  const getTotalItems = (category) => {
    const directItems = category.items?.length || 0;
    const subItems = category.subcategories?.reduce((acc, sub) => acc + (sub.items?.length || 0), 0) || 0;
    return directItems + subItems;
  };

  return (
    <div className="min-h-screen bg-[#0f1015] text-gray-100 selection:bg-amber-500/30 selection:text-amber-300">
      {/* Maximum-width wrapper for premium mobile presentation */}
      <div className="max-w-[480px] mx-auto bg-[#12131a] min-h-screen pb-16 shadow-2xl border-x border-[#1d202d] flex flex-col">
        
        {/* Sticky Header Top Section */}
        <div ref={stickyHeaderRef} className="sticky top-0 z-30 bg-[#12131a]/95 backdrop-blur-md border-b border-[#1f2231]">
          {/* Restaurant Banner & Meta */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold font-heading text-amber-500 leading-tight">
                {name}
              </h1>
              {(address || phone) && (
                <p className="text-[11px] text-gray-400 mt-1 leading-snug truncate max-w-[320px]">
                  {address} {phone && `• ${phone}`}
                </p>
              )}
            </div>
            {logo ? (
              <img
                src={logo.startsWith('http') ? logo : `${apiBaseUrl}${logo}`}
                alt={name}
                className="w-12 h-12 rounded-xl object-cover border border-[#2b2e40] bg-[#1a1b24] shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 font-bold text-lg font-heading shadow-inner">
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Search bar inside header */}
          <div className="px-5 pb-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#1a1b24] border border-[#252838] focus:border-amber-500 focus:bg-[#12131a] rounded-xl text-sm text-gray-200 placeholder-gray-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Sticky horizontal categories pills */}
          {!searchQuery && categories?.length > 0 && (
            <div
              ref={pillsContainerRef}
              className="px-5 py-3 border-t border-[#1a1b24] flex gap-2 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  id={`pill-${cat.id}`}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border shrink-0 transition-all ${
                    activeCategory === cat.id
                      ? 'bg-amber-500 text-[#0f1015] border-amber-500 shadow-md shadow-amber-500/10 scale-102'
                      : 'bg-[#1a1b24] text-gray-400 border-[#252838] hover:text-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Content Area */}
        <div className="flex-1 px-5 pt-6 space-y-8">
          {hasItems ? (
            filteredCategories.map((category) => (
              <section
                key={category.id}
                ref={(el) => (categoryRefs.current[category.id] = el)}
                data-category-id={category.id}
                className="space-y-4"
                style={{ scrollMarginTop: '210px' }}
              >
                {/* Category Header */}
                <h2 className="text-base font-bold font-heading text-amber-500 border-b border-[#1f2231] pb-2 flex justify-between items-center">
                  <span>{category.name}</span>
                  <span className="text-[10px] bg-[#1a1b24] text-gray-400 px-2 py-0.5 rounded-full font-medium">
                    {getTotalItems(category)} {getTotalItems(category) === 1 ? 'item' : 'items'}
                  </span>
                </h2>

                {/* Category Dishes List */}
                {category.items.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#161720]/80 border border-[#232635] p-3 rounded-2xl flex gap-3.5 hover:border-[#2e3247] transition duration-300 relative overflow-hidden"
                      >
                        {/* Dish Image */}
                        <div className="w-20 h-20 rounded-xl bg-[#1e202e] border border-[#2c2f42] overflow-hidden flex items-center justify-center shrink-0">
                          {item.image ? (
                            <img
                              src={item.image.startsWith('http') ? item.image : `${apiBaseUrl}${item.image}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          )}
                        </div>

                        {/* Dish Details */}
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-sm text-gray-200 truncate">{item.name}</h3>
                              <span className="text-sm font-bold text-amber-500 shrink-0 font-heading">
                                {menuData.currency || '₹'}{parseFloat(item.price).toFixed(2)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-2 flex justify-between items-center">
                            {!item.is_available ? (
                              <span className="inline-flex text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-semibold border border-red-500/20">
                                Sold Out
                              </span>
                            ) : (
                              <div></div>
                            )}

                            {item.is_available && (
                              <div className="flex items-center bg-[#1d1f2b] border border-[#2c2f42] rounded-lg overflow-hidden shrink-0">
                                {cart[item.id] ? (
                                  <>
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="px-2.5 py-1 text-xs font-bold text-amber-500 hover:bg-[#252839] transition"
                                    >
                                      -
                                    </button>
                                    <span className="px-2 text-xs font-semibold text-gray-200 min-w-[20px] text-center">
                                      {cart[item.id].quantity}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="px-2.5 py-1 text-xs font-bold text-amber-500 hover:bg-[#252839] transition"
                                    >
                                      +
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="px-3 py-1 text-xs font-semibold text-amber-500 hover:bg-[#252839] transition flex items-center gap-1"
                                  >
                                    Add
                                    <span className="text-[10px] text-amber-500/60">+</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subcategories */}
                {category.subcategories && category.subcategories.map((subCat, index) => (
                  <div key={subCat.id} className={`${index === 0 && category.items.length === 0 ? 'mt-4' : 'mt-8'} pl-4 border-l-[3px] border-[#252838]`}>
                    <h3 className="text-sm font-bold font-heading text-gray-300 pb-3 flex justify-between items-center">
                      <span>{subCat.name}</span>
                      <span className="text-[10px] bg-[#1a1b24] text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        {subCat.items.length} {subCat.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {subCat.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#161720]/80 border border-[#232635] p-3 rounded-2xl flex gap-3.5 hover:border-[#2e3247] transition duration-300 relative overflow-hidden"
                        >
                          {/* Dish Image */}
                          <div className="w-16 h-16 rounded-xl bg-[#1e202e] border border-[#2c2f42] overflow-hidden flex items-center justify-center shrink-0">
                            {item.image ? (
                              <img
                                src={item.image.startsWith('http') ? item.image : `${apiBaseUrl}${item.image}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            )}
                          </div>

                          {/* Dish Details */}
                          <div className="flex-1 flex flex-col justify-between overflow-hidden">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-sm text-gray-200 truncate">{item.name}</h4>
                                <span className="text-sm font-bold text-amber-500 shrink-0 font-heading">
                                  {menuData.currency || '₹'}{parseFloat(item.price).toFixed(2)}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-2 flex justify-between items-center">
                              {!item.is_available ? (
                                <span className="inline-flex text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-semibold border border-red-500/20">
                                  Sold Out
                                </span>
                              ) : (
                                <div></div>
                              )}

                              {item.is_available && (
                                <div className="flex items-center bg-[#1d1f2b] border border-[#2c2f42] rounded-lg overflow-hidden shrink-0">
                                  {cart[item.id] ? (
                                    <>
                                      <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="px-2.5 py-1 text-xs font-bold text-amber-500 hover:bg-[#252839] transition"
                                      >
                                        -
                                      </button>
                                      <span className="px-2 text-xs font-semibold text-gray-200 min-w-[20px] text-center">
                                        {cart[item.id].quantity}
                                      </span>
                                      <button
                                        onClick={() => addToCart(item)}
                                        className="px-2.5 py-1 text-xs font-bold text-amber-500 hover:bg-[#252839] transition"
                                      >
                                        +
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="px-3 py-1 text-xs font-semibold text-amber-500 hover:bg-[#252839] transition flex items-center gap-1"
                                    >
                                      Add
                                      <span className="text-[10px] text-amber-500/60">+</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))
          ) : (
            <div className="py-20 text-center text-gray-500">
              <svg className="h-10 w-10 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No items found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Active Order Sticky Top status bar */}
        {activeOrder && (
          <div className="sticky top-[110px] z-20 bg-gradient-to-r from-amber-500 to-orange-600 text-[#0f1015] px-5 py-2.5 flex items-center justify-between text-xs font-black shadow-lg">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f1015] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f1015]"></span>
              </span>
              <span>
                Order #{activeOrder.id} Status: {activeOrder.status.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-2.5 py-1 bg-[#0f1015] text-amber-400 hover:text-white rounded-md font-bold transition"
            >
              Track Order
            </button>
          </div>
        )}

        {/* Branded Footer */}
        <div className="mt-auto pt-12 pb-16 text-center">
          <p className="text-[10px] text-gray-500 tracking-wider">
            POWERED BY <span className="font-bold font-heading text-amber-500/75">RESTROMIND AI</span>
          </p>
        </div>

        {/* Sticky Bottom View Cart Bar */}
        {Object.keys(cart).length > 0 && !activeOrder && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-4 z-40">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-[#0f1015] font-extrabold py-3.5 px-6 rounded-2xl shadow-2xl flex items-center justify-between transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <span className="bg-[#0f1015] text-amber-500 text-xs font-black h-6 w-6 rounded-lg flex items-center justify-center">
                  {Object.values(cart).reduce((a, b) => a + b.quantity, 0)}
                </span>
                <span>View Cart</span>
              </div>
              <span className="font-heading">
                {menuData.currency || '₹'}
                {Object.values(cart).reduce((a, b) => a + b.quantity * parseFloat(b.item.price), 0).toFixed(2)}
              </span>
            </button>
          </div>
        )}

        {/* Combined Drawer / Tracker Modal */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>

            <div className="relative bg-[#161720] border-t border-[#262837] w-full max-w-[480px] rounded-t-3xl max-h-[85vh] overflow-y-auto px-6 py-6 shadow-2xl flex flex-col no-scrollbar">
              <div className="w-12 h-1.5 bg-[#2c2f42] rounded-full mx-auto mb-6"></div>

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold font-heading text-gray-200">
                  {activeOrder ? 'Track Your Order' : 'Your Basket'}
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full hover:bg-[#1d1f2b] text-gray-400 hover:text-gray-200"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {activeOrder ? (
                /* ORDER TRACKER STATE */
                <div className="space-y-6">
                  <div className="bg-[#1d1f2b] border border-[#2c2f42] p-5 rounded-2xl text-center space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Order Status</p>
                    <div className="inline-flex px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25">
                      {activeOrder.status}
                    </div>

                    <div className="flex items-center justify-between pt-4 max-w-xs mx-auto">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          ['pending', 'preparing', 'served', 'completed'].includes(activeOrder.status)
                            ? 'bg-amber-500 text-[#0f1015]'
                            : 'bg-[#2c2f42] text-gray-500'
                        }`}>✓</div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Sent</span>
                      </div>

                      <div className={`flex-1 h-0.5 ${
                        ['preparing', 'served', 'completed'].includes(activeOrder.status)
                          ? 'bg-amber-500'
                          : 'bg-[#2c2f42]'
                      }`}></div>

                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          ['preparing', 'served', 'completed'].includes(activeOrder.status)
                            ? 'bg-amber-500 text-[#0f1015] animate-pulse'
                            : 'bg-[#2c2f42] text-gray-500'
                        }`}>
                          {activeOrder.status === 'preparing' ? '⏳' : '✓'}
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Kitchen</span>
                      </div>

                      <div className={`flex-1 h-0.5 ${
                        ['served', 'completed'].includes(activeOrder.status)
                          ? 'bg-amber-500'
                          : 'bg-[#2c2f42]'
                      }`}></div>

                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          ['served', 'completed'].includes(activeOrder.status)
                            ? 'bg-emerald-500 text-[#0f1015]'
                            : 'bg-[#2c2f42] text-gray-500'
                        }`}>🍽</div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Served</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-[#1d1f2b] border border-[#2c2f42] p-4 rounded-2xl text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>Order ID</span>
                      <span className="font-bold text-gray-200">#{activeOrder.id}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Table Number</span>
                      <span className="font-bold text-amber-500">Table {activeOrder.table_number}</span>
                    </div>
                    {activeOrder.customer_name && (
                      <div className="flex justify-between text-gray-400">
                        <span>Customer</span>
                        <span className="font-bold text-gray-200">{activeOrder.customer_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 border-b border-[#2c2f42] pb-4 max-h-[160px] overflow-y-auto">
                    {activeOrder.items?.map((orderItem) => (
                      <div key={orderItem.id} className="flex justify-between text-xs py-1">
                        <span className="text-gray-300">
                          <strong className="text-amber-500">{orderItem.quantity}x</strong> {orderItem.menu_item_name}
                        </span>
                        <span className="text-gray-400">
                          {menuData.currency || '₹'}{(parseFloat(orderItem.price) * orderItem.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-gray-300">Amount Paid / Due</span>
                    <span className="text-lg font-bold text-amber-500 font-heading">
                      {menuData.currency || '₹'}{parseFloat(activeOrder.total_price).toFixed(2)}
                    </span>
                  </div>

                  {activeOrder.status === 'pending' && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancellingOrder}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:text-red-300 rounded-xl text-xs font-bold transition mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {cancellingOrder ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Cancelling Order...
                        </>
                      ) : (
                        'Cancel Order'
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      localStorage.removeItem(`active_order_token_${restaurantId}`);
                      setActiveOrderToken(null);
                      setActiveOrder(null);
                    }}
                    className="w-full py-3 bg-[#1d1f2b] hover:bg-[#252839] border border-[#2c2f42] text-gray-300 hover:text-white rounded-xl text-xs font-bold transition mt-2"
                  >
                    Place Another Order
                  </button>
                </div>
              ) : (
                /* CART CHECKOUT STATE */
                <div className="space-y-6">
                  {orderError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl text-center">
                      {orderError}
                    </div>
                  )}

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {Object.values(cart).map(({ item, quantity }) => (
                      <div key={item.id} className="bg-[#1d1f2b] border border-[#2c2f42] p-3 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-gray-200 truncate">{item.name}</h4>
                          <p className="text-[10px] text-amber-500 font-heading mt-0.5">
                            {menuData.currency || '₹'}{parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center bg-[#161720] border border-[#2c2f42] rounded-lg overflow-hidden shrink-0">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-500 hover:bg-[#1d1f2b] transition"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-semibold text-gray-200 min-w-[16px] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-500 hover:bg-[#1d1f2b] transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Table Code
                      </label>
                      {tableParam ? (
                        <div className="px-4 py-3 bg-[#1d1f2b] border border-amber-500/20 rounded-xl text-sm text-amber-500 font-extrabold flex items-center justify-between">
                          <span>Table {tableParam}</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Locked via QR
                          </span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Enter Table Number"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1d1f2b] border border-[#2c2f42] focus:border-amber-500 rounded-xl text-sm text-gray-200 outline-none transition"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1d1f2b] border border-[#2c2f42] focus:border-amber-500 rounded-xl text-sm text-gray-200 outline-none transition"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-bold text-gray-300">Total Price</span>
                      <span className="text-lg font-bold text-amber-500 font-heading">
                        {menuData.currency || '₹'}
                        {Object.values(cart).reduce((a, b) => a + b.quantity * parseFloat(b.item.price), 0).toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-[#0f1015] font-extrabold rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-sm"
                    >
                      {placingOrder ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-[#0f1015]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Placing Order...
                        </>
                      ) : (
                        'Confirm & Place Order'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicMenuPage;
