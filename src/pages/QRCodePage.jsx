import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useRestaurant from '../hooks/useRestaurant';
import qrApi from '../api/qr';
import { useAuth } from '../context/AuthContext';
import { getCustomerMenuUrl, getQrCodeImageUrl } from '../config/env';

const SECTION_OPTIONS = [
  'Main Area',
  'Patio',
  'Bar',
  'Rooftop',
  'VIP Dining',
  'Takeout / Counter',
];

const QRCodePage = () => {
  const {
    restaurant,
    loading: restaurantLoading,
    fetchRestaurant,
  } = useRestaurant();

  const [tableNumber, setTableNumber] = useState(1);
  const [section, setSection] = useState('Main Area');
  const [customLabel, setCustomLabel] = useState('');
  const [activeSectionFilter, setActiveSectionFilter] = useState('All');

  const [tablesList, setTablesList] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Multi-Select & Bulk Delete State
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Backend Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalTablesCount, setTotalTablesCount] = useState(0);

  // Bulk Generator State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStart, setBulkStart] = useState(1);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkSection, setBulkSection] = useState('Main Area');

  const { user } = useAuth();
  const subscription = user?.subscription;
  const isSubscriptionActive = subscription?.status === 'active' && 
    (subscription?.days_remaining > 0 || subscription?.days_remaining === null);

  const isFreeTrial = !subscription?.plan || subscription?.plan === 'free_trial';
  const quotaUsage = user?.quota_usage;
  const maxTablesAllowed = quotaUsage?.max_tables_limit !== undefined ? quotaUsage.max_tables_limit : 5;
  const currentTablesUsed = totalTablesCount;
  const isQuotaLimitReached = isFreeTrial && (currentTablesUsed >= maxTablesAllowed);

  const selectedNum = parseInt(tableNumber, 10);
  const isExistingTableSelected = !isNaN(selectedNum) && tablesList.some((t) => t.table_number === selectedNum);
  const isCreatingNewTableOverLimit = isQuotaLimitReached && !isExistingTableSelected;

  const fetchTables = useCallback(async (overridePage, overridePageSize, overrideSection) => {
    try {
      setLoadingTables(true);
      const pageToFetch = overridePage !== undefined ? overridePage : currentPage;
      const sizeToFetch = overridePageSize !== undefined ? overridePageSize : pageSize;
      const sectionToFetch = overrideSection !== undefined ? overrideSection : activeSectionFilter;

      const params = {};
      if (sizeToFetch === 'all') {
        params.page_size = 1000;
      } else {
        params.page = pageToFetch;
        params.page_size = sizeToFetch;
      }

      if (sectionToFetch && sectionToFetch !== 'All') {
        params.section = sectionToFetch;
      }

      const data = await qrApi.getTables(params);
      const list = Array.isArray(data) ? data : (data?.results || []);
      const count = Array.isArray(data) ? data.length : (data?.count !== undefined ? data.count : list.length);

      setTablesList(list);
      setTotalTablesCount(count);

      if (list && list.length > 0) {
        setQrData((prev) => prev || list[0]);
        setTableNumber((prev) => (prev ? prev : list[0].table_number));
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoadingTables(false);
    }
  }, [currentPage, pageSize, activeSectionFilter]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  useEffect(() => {
    if (restaurant) {
      fetchTables();
    }
  }, [restaurant, fetchTables]);

  const generateQR = async (restaurantId, number, sec, lbl) => {
    if (!restaurantId) return;
    try {
      setGenerating(true);
      setError('');
      const data = await qrApi.generateQR(restaurantId, number, sec, lbl);
      if (data) {
        setQrData(data);
      }
      try {
        await fetchTables();
      } catch (tableErr) {
        console.warn('Post-generation table list refresh warning:', tableErr);
      }
    } catch (err) {
      console.error('Error generating QR code:', err);
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        err.message ||
        'Failed to generate QR Code. Please check backend settings.';
      setError(serverMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    try {
      setBulkGenerating(true);
      setError('');
      const data = await qrApi.bulkGenerateQR(restaurant.id, bulkStart, bulkCount, bulkSection);
      if (data && data.length > 0) {
        setQrData(data[0]);
      }
      setShowBulkModal(false);
      try {
        await fetchTables();
      } catch (tableErr) {
        console.warn('Post-bulk generation table list refresh warning:', tableErr);
      }
    } catch (err) {
      console.error('Error bulk generating QR codes:', err);
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        err.message ||
        'Failed bulk QR generation.';
      setError(serverMsg);
    } finally {
      setBulkGenerating(false);
    }
  };

  // Custom Delete Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    type: 'single', // 'single' | 'bulk'
    targetTable: null,
    count: 0,
  });
  const [deletingTable, setDeletingTable] = useState(false);

  const triggerDeleteTable = (table) => {
    setDeleteModalConfig({
      isOpen: true,
      type: 'single',
      targetTable: table,
      count: 1,
    });
  };

  const triggerBulkDeleteSelected = () => {
    if (selectedTableIds.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      type: 'bulk',
      targetTable: null,
      count: selectedTableIds.length,
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteModalConfig.type === 'single') {
      const tableId = deleteModalConfig.targetTable?.id;
      if (!tableId) return;

      try {
        setDeletingTable(true);
        setError('');
        await qrApi.deleteTable(tableId);
        if (qrData && qrData.id === tableId) {
          setQrData(null);
        }
        setSelectedTableIds((prev) => prev.filter((id) => id !== tableId));
        setDeleteModalConfig({ isOpen: false, type: 'single', targetTable: null, count: 0 });
        await fetchTables();
      } catch (err) {
        console.error('Error deleting table:', err);
        setError('Failed to delete table.');
      } finally {
        setDeletingTable(false);
      }
    } else if (deleteModalConfig.type === 'bulk') {
      if (selectedTableIds.length === 0) return;

      try {
        setDeletingBulk(true);
        setError('');
        await qrApi.bulkDeleteTables(selectedTableIds);

        if (qrData && selectedTableIds.includes(qrData.id)) {
          setQrData(null);
        }
        setSelectedTableIds([]);
        setDeleteModalConfig({ isOpen: false, type: 'bulk', targetTable: null, count: 0 });
        await fetchTables();
      } catch (err) {
        console.error('Error bulk deleting tables:', err);
        setError('Failed to delete selected tables. Please try again.');
      } finally {
        setDeletingBulk(false);
      }
    }
  };

  const toggleSelectTable = (tableId) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredTables.map((t) => t.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedTableIds.includes(id));

    if (allSelected) {
      // Deselect all filtered tables
      setSelectedTableIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered tables
      setSelectedTableIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handlePrintSelected = async () => {
    const targetList = tablesList.filter((t) => selectedTableIds.includes(t.id));
    if (targetList.length === 0) return;

    const tableQrItems = await Promise.all(
      targetList.map(async (t) => {
        const url = getCustomerMenuUrl(restaurant?.id, t.table_number);
        const qrUrl = getQrCodeImageUrl(t.qr_code_url || t.qr_code, url);
        await preloadImage(qrUrl);
        return { ...t, customerUrl: url, qrUrl };
      })
    );

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Selected QR Codes - ${restaurant?.name}</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; padding: 20px; color: #0f1015; }
            h1 { text-align: center; color: #d97706; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; max-width: 900px; margin: 0 auto; }
            .card { border: 2px dashed #d97706; border-radius: 16px; padding: 24px; text-align: center; background-color: #fff; page-break-inside: avoid; }
            .card h2 { font-size: 20px; margin: 0 0 2px 0; color: #d97706; }
            .card p.sec { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin: 0 0 16px 0; }
            .qr-image { width: 170px; height: 170px; border: 1px solid #e5e7eb; padding: 8px; border-radius: 8px; }
            .table-badge { font-size: 16px; font-weight: bold; margin-top: 12px; text-transform: uppercase; }
            @media print { body { padding: 0; } .card { border-style: solid; } }
          </style>
        </head>
        <body>
          <h1>${restaurant?.name || 'RestroMind AI'} - Selected Table QR Cards (${targetList.length})</h1>
          <div class="grid">
            ${tableQrItems.map((t) => `
              <div class="card">
                <h2>${restaurant?.name}</h2>
                <p class="sec">${t.section || 'Main Area'}</p>
                <img class="qr-image" src="${t.qrUrl}" alt="Table ${t.table_number} QR Code" />
                <div class="table-badge">${t.label || `Table ${t.table_number}`}</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleTableChange = (e) => {
    const val = e.target.value;
    setTableNumber(val);
    setError('');
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      const existing = tablesList.find((t) => t.table_number === num);
      if (existing) {
        setQrData(existing);
        if (existing.section) setSection(existing.section);
        setCustomLabel(existing.label || '');
      }
    }
  };

  const handleArrowTableChange = (delta) => {
    setError('');
    const currentNum = parseInt(tableNumber, 10) || 1;
    const nextNum = Math.max(1, currentNum + delta);
    setTableNumber(nextNum);

    const existing = tablesList.find((t) => t.table_number === nextNum);
    if (existing) {
      setQrData(existing);
      if (existing.section) setSection(existing.section);
      setCustomLabel(existing.label || '');
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (restaurant) {
      const num = parseInt(tableNumber, 10) || 1;
      generateQR(restaurant.id, num, section, customLabel);
    }
  };

  // Preload image helper
  const preloadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(src);
      img.src = src;
    });
  };

  // CORS Download helper for PNG & SVG
  const handleDownloadFile = async (fileUrl, filename) => {
    try {
      const response = await fetch(fileUrl, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Direct download fallback:', err);
      window.open(fileUrl, '_blank');
    }
  };

  const handlePrint = async (targetQrData = qrData) => {
    if (!targetQrData) return;
    const customerUrl = getCustomerMenuUrl(restaurant?.id, targetQrData.table_number);
    const absoluteQrUrl = getQrCodeImageUrl(targetQrData.qr_code_url || targetQrData.qr_code, customerUrl);

    await preloadImage(absoluteQrUrl);

    const displayTitle = targetQrData.label || `Table ${targetQrData.table_number}`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${displayTitle}</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
              text-align: center;
              padding: 40px;
              color: #0f1015;
            }
            .container {
              border: 3px double #d97706;
              border-radius: 20px;
              padding: 40px;
              max-width: 400px;
              margin: 0 auto;
              background-color: #fff;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 28px;
              margin-bottom: 2px;
              color: #d97706;
            }
            .section-tag {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #6b7280;
              font-weight: 700;
              margin-bottom: 20px;
            }
            .qr-wrapper {
              margin: 20px 0;
            }
            .qr-image {
              width: 240px;
              height: 240px;
              border: 1px solid #e5e7eb;
              padding: 10px;
              border-radius: 10px;
              object-fit: contain;
            }
            .table-info {
              font-size: 20px;
              font-weight: bold;
              margin: 15px 0 5px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .url-info {
              font-size: 11px;
              color: #6b7280;
              word-break: break-all;
              max-width: 320px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${restaurant?.name || 'RestroMind AI'}</h1>
            <div class="section-tag">${targetQrData.section || 'Main Area'}</div>
            <div class="qr-wrapper">
              <img class="qr-image" src="${absoluteQrUrl}" alt="QR Code" />
            </div>
            <div class="table-info">${displayTitle}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAll = async () => {
    const targetList = filteredTables;
    if (targetList.length === 0) return;
    
    const tableQrItems = await Promise.all(
      targetList.map(async (t) => {
        const url = getCustomerMenuUrl(restaurant?.id, t.table_number);
        const qrUrl = getQrCodeImageUrl(t.qr_code_url || t.qr_code, url);
        await preloadImage(qrUrl);
        return { ...t, customerUrl: url, qrUrl };
      })
    );

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk Print QR Codes - ${restaurant?.name}</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
              padding: 20px;
              color: #0f1015;
            }
            h1 {
              text-align: center;
              color: #d97706;
              margin-bottom: 20px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 25px;
              max-width: 900px;
              margin: 0 auto;
            }
            .card {
              border: 2px dashed #d97706;
              border-radius: 16px;
              padding: 24px;
              text-align: center;
              background-color: #fff;
              page-break-inside: avoid;
            }
            .card h2 {
              font-size: 20px;
              margin: 0 0 2px 0;
              color: #d97706;
            }
            .card p.sec {
              font-size: 10px;
              font-weight: bold;
              color: #6b7280;
              text-transform: uppercase;
              margin: 0 0 16px 0;
            }
            .qr-image {
              width: 170px;
              height: 170px;
              border: 1px solid #e5e7eb;
              padding: 8px;
              border-radius: 8px;
            }
            .table-badge {
              font-size: 16px;
              font-weight: bold;
              margin-top: 12px;
              text-transform: uppercase;
            }
            @media print {
              body { padding: 0; }
              .card { border-style: solid; }
            }
          </style>
        </head>
        <body>
          <h1>${restaurant?.name || 'RestroMind AI'} - Table QR Cards</h1>
          <div class="grid">
            ${tableQrItems.map((t) => `
              <div class="card">
                <h2>${restaurant?.name}</h2>
                <p class="sec">${t.section || 'Main Area'}</p>
                <img class="qr-image" src="${t.qrUrl}" alt="Table ${t.table_number} QR Code" />
                <div class="table-badge">${t.label || `Table ${t.table_number}`}</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const currentMenuUrl = getCustomerMenuUrl(restaurant?.id, qrData?.table_number || tableNumber);

  const handleCopyLink = (targetUrl = currentMenuUrl) => {
    if (!restaurant) return;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayQrUrl = qrData
    ? getQrCodeImageUrl(qrData.qr_code_url || qrData.qr_code, currentMenuUrl)
    : '';

  const displaySvgUrl = qrData?.qr_code_svg_url
    ? getQrCodeImageUrl(qrData.qr_code_svg_url)
    : '';

  // Extract unique sections
  const sectionsList = useMemo(() => {
    const secs = new Set(['All']);
    SECTION_OPTIONS.forEach((sec) => secs.add(sec));
    tablesList.forEach((t) => {
      if (t.section) secs.add(t.section);
    });
    return Array.from(secs);
  }, [tablesList]);

  // Filtered tables by section
  const filteredTables = useMemo(() => {
    if (activeSectionFilter === 'All') return tablesList;
    return tablesList.filter((t) => t.section === activeSectionFilter);
  }, [tablesList, activeSectionFilter]);

  // Calculate total pages for backend pagination
  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    const size = parseInt(pageSize, 10) || 5;
    return Math.max(1, Math.ceil(totalTablesCount / size));
  }, [totalTablesCount, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    const val = e.target.value;
    setPageSize(val === 'all' ? 'all' : parseInt(val, 10));
    setCurrentPage(1);
  };

  const handleSectionFilterChange = (sec) => {
    setActiveSectionFilter(sec);
    setCurrentPage(1);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-semibold border border-amber-500/20 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Order Pending
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold border border-orange-500/20 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
            Preparing
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full font-semibold border border-blue-500/20 whitespace-nowrap shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Served
          </span>
        );
      default:
        return null;
    }
  };

  if (restaurantLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <svg className="animate-spin h-10 w-10 text-amber-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-medium">Loading your profile & QR configuration...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#161720] border border-[#262837] rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-600"></div>
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-6 border border-amber-500/20">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-heading text-gray-100">Restaurant Profile Required</h2>
          <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            You must create a restaurant profile before generating digital menus and QR codes. Let's set that up now!
          </p>
          <div className="mt-8">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-[#0f1015] font-semibold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Setup Profile
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
            QR Code & Table Management
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Configure restaurant sections, table labels, high-res PNG & SVG vector QR codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={!isSubscriptionActive}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500 hover:text-[#0f1015] border border-amber-500/25 hover:border-transparent text-amber-400 font-semibold rounded-xl text-xs transition duration-300 flex items-center gap-2 shadow-lg shadow-amber-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Bulk Generate QRs
          </button>

          {tablesList.length > 0 && (
            <button
              onClick={handlePrintAll}
              className="px-4 py-2.5 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] text-gray-200 hover:text-white font-semibold rounded-xl text-xs transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Grid ({filteredTables.length})
            </button>
          )}
        </div>
      </div>

      {!isSubscriptionActive && subscription && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-2 mb-6">
          <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            {subscription.status === 'pending'
              ? 'Your account is pending admin approval. QR Code generation is disabled in read-only mode.'
              : 'Your trial period has ended or has been paused. QR Code generation is disabled in read-only mode.'}
          </span>
        </div>
      )}



      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#161720] border border-[#262837] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-bold font-heading text-gray-200">Table Generator & Config</h2>
              <span className={`self-start sm:self-auto text-[11px] px-3 py-1 rounded-full font-bold border transition ${
                isQuotaLimitReached
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {isFreeTrial
                  ? `Free Trial: ${currentTablesUsed} / ${maxTablesAllowed} Used`
                  : `Pro Plan: ${currentTablesUsed} Tables Active`}
              </span>
            </div>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Section / Area
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  disabled={!isSubscriptionActive}
                  className="w-full px-4 py-2.5 bg-[#1d1f2b] border border-[#2c2f42] focus:border-amber-500 rounded-xl text-sm text-gray-200 outline-none transition mb-3"
                >
                  {SECTION_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Table Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={tableNumber}
                    onChange={handleTableChange}
                    disabled={!isSubscriptionActive}
                    placeholder="Enter table number"
                    className={`flex-1 px-4 py-3 bg-[#1d1f2b] border ${
                      isCreatingNewTableOverLimit
                        ? 'border-red-500/50 focus:border-red-500'
                        : !isSubscriptionActive
                        ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60'
                        : 'border-[#2c2f42] focus:border-amber-500'
                    } rounded-xl text-gray-200 outline-none transition`}
                  />
                  <div className="flex flex-col justify-between">
                    <button
                      type="button"
                      disabled={!isSubscriptionActive}
                      onClick={() => handleArrowTableChange(1)}
                      className="px-2.5 py-1 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] rounded-md text-gray-400 hover:text-gray-200 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Next / Incremental Table"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={!isSubscriptionActive}
                      onClick={() => handleArrowTableChange(-1)}
                      className="px-2.5 py-1 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] rounded-md text-gray-400 hover:text-gray-200 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Previous / Decremental Table"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {isCreatingNewTableOverLimit && (
                  <div className="mt-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2.5 animate-fadeIn">
                    <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <span className="font-bold">Quota Full ({currentTablesUsed}/{maxTablesAllowed} Used)</span>
                      <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                        Cannot create new Table {tableNumber}. You have used all {maxTablesAllowed} tables in your plan limit. Delete an existing table or upgrade your subscription.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Custom Display Label (Optional)
                </label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Patio-4, VIP-2"
                  disabled={!isSubscriptionActive}
                  className="w-full px-4 py-2.5 bg-[#1d1f2b] border border-[#2c2f42] focus:border-amber-500 rounded-xl text-xs text-gray-200 outline-none transition"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs px-3.5 py-2.5 rounded-xl text-left flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={generating || !isSubscriptionActive || isCreatingNewTableOverLimit}
                className={`w-full py-3 font-semibold rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg disabled:cursor-not-allowed ${
                  isCreatingNewTableOverLimit
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 opacity-70 shadow-none'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-[#0f1015] shadow-amber-500/10 disabled:opacity-50'
                }`}
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#0f1015]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : isCreatingNewTableOverLimit ? (
                  <>
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Quota Limit Reached ({currentTablesUsed}/{maxTablesAllowed})
                  </>
                ) : isExistingTableSelected ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                    </svg>
                    Update QR Code (Table {tableNumber})
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                    </svg>
                    Generate QR Code
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-[#161720] border border-[#262837] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-bold font-heading text-gray-200 mb-3">Copy Direct Menu Link</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Share this table menu URL with customers or use on marketing flyers.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={currentMenuUrl}
                className="flex-1 px-4 py-2.5 bg-[#1d1f2b] border border-[#2c2f42] rounded-xl text-xs text-gray-400 outline-none truncate"
              />
              <button
                onClick={() => handleCopyLink(currentMenuUrl)}
                className={`px-4 rounded-xl text-xs font-semibold border transition ${
                  copied 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500 hover:text-[#0f1015]'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Right QR Code Display Card */}
        <div className="lg:col-span-7">
          <div className="bg-[#161720] border border-[#262837] rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center relative overflow-hidden min-h-[440px]">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 w-full text-center">
                {error}
              </div>
            )}

            {generating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="animate-spin h-10 w-10 text-amber-500 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm font-medium text-gray-400">Updating QR Code image...</p>
              </div>
            ) : qrData ? (
              <div className="text-center w-full flex flex-col items-center">
                {/* Print Layout Outer Border styling */}
                <div className="bg-white p-6 rounded-2xl shadow-2xl border-4 border-amber-500/20 inline-block">
                  <h3 className="text-[#0f1015] font-extrabold text-xl font-heading tracking-tight mb-0.5">
                    {restaurant.name}
                  </h3>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                    {qrData.section || 'Main Area'}
                  </p>
                  <div className="w-[200px] h-[200px] bg-white border border-gray-100 p-2 rounded-lg inline-flex items-center justify-center">
                    <img
                      src={displayQrUrl}
                      alt={`Table ${qrData.table_number} QR Code`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[#0f1015] font-bold font-heading text-lg mt-3 uppercase tracking-wider">
                    {qrData.label || `Table ${qrData.table_number}`}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 mt-8 justify-center w-full max-w-md">
                  <button
                    onClick={() => handlePrint(qrData)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] text-gray-200 hover:text-white font-semibold rounded-xl text-xs transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>

                  <button
                    onClick={() => handleDownloadFile(displayQrUrl, `table_${qrData.table_number}_qr.png`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-amber-500/10 hover:bg-amber-500 hover:text-[#0f1015] border border-amber-500/25 hover:border-transparent text-amber-400 font-semibold rounded-xl text-xs transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    PNG
                  </button>

                  {displaySvgUrl && (
                    <button
                      onClick={() => handleDownloadFile(displaySvgUrl, `table_${qrData.table_number}_qr.svg`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-orange-500/10 hover:bg-orange-500 hover:text-[#0f1015] border border-orange-500/25 hover:border-transparent text-orange-400 font-semibold rounded-xl text-xs transition"
                      title="Download Vector SVG for Print Shops"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      SVG (Vector)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="h-12 w-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>No QR Code loaded. Select a table or generate one.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configured Tables Section & Live Status Grid */}
      <div className="bg-[#161720] border border-[#262837] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Header Title Row & Section Filter Row */}
        <div className="border-b border-[#252838] pb-4 mb-6 space-y-4">
          {/* Top Line: Title & Select All Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold font-heading text-gray-100 flex items-center gap-2">
                Configured Restaurant Tables
                <span className="text-xs px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-semibold border border-amber-500/20">
                  {totalTablesCount} Total
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Select checkboxes to bulk delete or print multiple QR codes. Single delete trash icons remain on each card.
              </p>
            </div>

            {/* Select All / Deselect All Action */}
            {filteredTables.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3.5 py-2 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] text-xs font-semibold text-gray-300 hover:text-white rounded-xl transition flex items-center gap-2 shadow-sm self-start sm:self-auto shrink-0"
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    filteredTables.every((t) => selectedTableIds.includes(t.id))
                      ? 'bg-amber-500 border-amber-500 text-[#0f1015]'
                      : 'border-gray-500 bg-[#161720]'
                  }`}
                >
                  {filteredTables.every((t) => selectedTableIds.includes(t.id)) && (
                    <svg className="w-3 h-3 text-[#0f1015] stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {filteredTables.every((t) => selectedTableIds.includes(t.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            )}
          </div>

          {/* Dedicated Full-width Section Filter Bar ('All' is First) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-xs font-semibold text-gray-400 shrink-0 mr-1">Section:</span>
            {sectionsList.map((sec) => (
              <button
                key={sec}
                onClick={() => handleSectionFilterChange(sec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  activeSectionFilter === sec
                    ? 'bg-amber-500 text-[#0f1015] border-amber-500 shadow-md shadow-amber-500/10 font-bold'
                    : 'bg-[#1d1f2b] text-gray-400 border-[#2c2f42] hover:text-gray-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Items Bulk Action Bar */}
        {selectedTableIds.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-[#1d1f2b] border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                {selectedTableIds.length}
              </span>
              <div>
                <h4 className="text-sm font-bold text-gray-100">
                  {selectedTableIds.length} Table{selectedTableIds.length > 1 ? 's' : ''} Selected
                </h4>
                <p className="text-[11px] text-gray-400">
                  Perform bulk operations on selected table QR codes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handlePrintSelected}
                className="px-3.5 py-2 bg-[#27293d] hover:bg-[#32354e] border border-[#3b3e5b] text-gray-200 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Selected ({selectedTableIds.length})
              </button>

              <button
                type="button"
                onClick={triggerBulkDeleteSelected}
                disabled={deletingBulk}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingBulk ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({selectedTableIds.length})
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedTableIds([])}
                className="px-3 py-2 bg-[#1d1f2b] hover:bg-[#27293d] text-gray-400 hover:text-gray-200 text-xs font-semibold rounded-xl border border-[#2c2f42] transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {loadingTables ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Loading configured table QR codes...
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="h-10 w-10 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">No tables found in "{activeSectionFilter}".</p>
          </div>
        ) : (
          /* Scrollable Container with Custom Dark Scrollbar */
          <div className="max-h-[560px] overflow-y-auto pr-1.5 custom-scrollbar">
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #161720;
                border-radius: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #2c2f42;
                border-radius: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #d97706;
              }
            `}</style>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredTables.map((t) => {
                const url = getCustomerMenuUrl(restaurant.id, t.table_number);
                const imgUrl = getQrCodeImageUrl(t.qr_code_url || t.qr_code, url);
                const isPreviewSelected = qrData && qrData.id === t.id;
                const isMultiSelected = selectedTableIds.includes(t.id);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setQrData(t);
                      setTableNumber(t.table_number);
                      setSection(t.section || 'Main Area');
                      setCustomLabel(t.label || '');
                    }}
                    className={`cursor-pointer bg-[#1d1f2b] p-4 rounded-2xl border transition duration-300 flex flex-col items-center relative group ${
                      isMultiSelected
                        ? 'border-red-500/60 bg-[#25202d] ring-2 ring-red-500/30 shadow-lg shadow-red-500/10'
                        : isPreviewSelected
                        ? 'border-amber-500 bg-[#242738] shadow-lg shadow-amber-500/10'
                        : 'border-[#2c2f42] hover:border-gray-500'
                    }`}
                  >
                    {/* Card Top Row: Left Custom Checkbox | Right Status Badge + Single Delete */}
                    <div className="w-full flex items-center justify-between mb-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectTable(t.id);
                        }}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          isMultiSelected
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-500 text-[#0f1015] shadow-md shadow-amber-500/20'
                            : 'border-gray-500/80 bg-[#161720]/90 hover:border-amber-500/60'
                        }`}
                        title="Select Table"
                      >
                        {isMultiSelected && (
                          <svg className="w-2.5 h-2.5 text-[#0f1015] stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {renderStatusBadge(t.active_order_status)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerDeleteTable(t);
                          }}
                          className="p-1 bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-md transition"
                          title="Delete Single Table"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Full-width Section Title (Never Truncates) */}
                    <span className="text-[10px] font-extrabold text-amber-400/90 uppercase tracking-widest text-center truncate w-full mb-2">
                      {t.section || 'Main Area'}
                    </span>

                    {/* High Visibility QR Image Container */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white p-2 rounded-2xl border border-gray-200/80 shadow-md mb-2.5 flex items-center justify-center">
                      <img
                        src={imgUrl}
                        alt={`Table ${t.table_number}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <span className="text-xs font-bold text-gray-200 font-heading truncate max-w-full">
                      {t.label || `Table ${t.table_number}`}
                    </span>

                    <div className="flex gap-1 mt-2.5 w-full">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(t);
                        }}
                        className="flex-1 py-1 text-[10px] bg-[#292c3f] hover:bg-[#343850] text-gray-300 rounded font-semibold transition text-center"
                      >
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(imgUrl, `table_${t.table_number}_qr.png`);
                        }}
                        className="flex-1 py-1 text-[10px] bg-amber-500/10 hover:bg-amber-500 hover:text-[#0f1015] text-amber-400 rounded font-semibold transition text-center"
                      >
                        PNG
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Control Bar (Right-Aligned) */}
        {totalTablesCount > 0 && (
          <div className="mt-6 pt-4 border-t border-[#252838] flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Left: Table Summary Badge */}
            <div className="text-gray-400 font-medium">
              Total Tables: <span className="text-amber-400 font-bold">{totalTablesCount}</span>
            </div>

            {/* Right: Entire Control Bar Group Right Aligned */}
            <div className="flex items-center gap-3.5 ml-auto flex-wrap">
              <span className="text-gray-400">
                Showing{' '}
                <strong className="text-gray-200 font-semibold">
                  {pageSize === 'all'
                    ? `1–${totalTablesCount}`
                    : `${Math.min((currentPage - 1) * pageSize + 1, totalTablesCount)}–${Math.min(currentPage * pageSize, totalTablesCount)}`}
                </strong>{' '}
                of <strong className="text-gray-200 font-semibold">{totalTablesCount}</strong> tables
              </span>

              <div className="h-4 w-[1px] bg-[#2d3042]"></div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium">Per page:</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="px-3 py-1.5 bg-[#1d1f2b] border border-[#2c2f42] rounded-xl text-gray-200 text-xs outline-none focus:border-amber-500 transition cursor-pointer shadow-sm hover:border-gray-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value="all">All ({totalTablesCount})</option>
                </select>
              </div>

              {pageSize !== 'all' && totalPages > 1 && (
                <>
                  <div className="h-4 w-[1px] bg-[#2d3042]"></div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1 || loadingTables}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-3 py-1.5 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] text-gray-300 hover:text-white rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ‹ Prev
                    </button>

                    <span className="px-3 py-1.5 bg-[#161720] border border-[#262837] text-amber-400 font-bold rounded-xl text-xs">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage === totalPages || loadingTables}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-3 py-1.5 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] text-gray-300 hover:text-white rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next ›
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161720] border border-[#262837] rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold font-heading text-gray-100 mb-2">
              Bulk Table QR Generator
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Create QR codes for multiple tables in one operation.
            </p>

            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Target Section / Area
                </label>
                <select
                  value={bulkSection}
                  onChange={(e) => setBulkSection(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1d1f2b] border border-[#2c2f42] focus:border-amber-500 rounded-xl text-sm text-gray-200 outline-none transition"
                >
                  {SECTION_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Start Table Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={bulkStart}
                  onChange={(e) => setBulkStart(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1d1f2b] border border-[#2c2f42] focus:border-amber-500 rounded-xl text-gray-200 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Number of Tables to Generate (Max 50)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1d1f2b] border border-[#2c2f42] focus:border-amber-500 rounded-xl text-gray-200 outline-none transition"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#252838]">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-3 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] text-gray-400 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkGenerating}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-[#0f1015] font-semibold rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {bulkGenerating ? 'Generating...' : 'Generate QRs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {deleteModalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#161720] border border-red-500/30 hover:border-red-500/50 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Glowing Red Top Accent */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              {/* Red Trash / Warning Icon Container */}
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 border border-red-500/25 shadow-lg shadow-red-500/10">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 inline-block mb-2">
                  Confirm Permanent Delete
                </span>
                <h3 className="text-xl font-black text-gray-100 font-heading">
                  {deleteModalConfig.type === 'bulk'
                    ? `Delete ${deleteModalConfig.count} Selected Tables?`
                    : `Delete ${deleteModalConfig.targetTable?.label || `Table ${deleteModalConfig.targetTable?.table_number}`}?`}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mt-2 max-w-xs mx-auto">
                  {deleteModalConfig.type === 'bulk'
                    ? `Are you sure you want to permanently delete these ${deleteModalConfig.count} restaurant tables and their associated QR codes?`
                    : `Are you sure you want to delete this table (${deleteModalConfig.targetTable?.section || 'Main Area'}) and its associated QR code?`}
                </p>
                <div className="mt-3 p-3 bg-[#1d1f2b] border border-[#2c2f42] rounded-xl text-[11px] text-amber-400/90 text-left flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>This action cannot be undone. Customers will no longer be able to scan QR codes for deleted tables.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  disabled={deletingTable || deletingBulk}
                  onClick={() => setDeleteModalConfig({ isOpen: false, type: 'single', targetTable: null, count: 0 })}
                  className="flex-1 py-3 px-4 bg-[#1d1f2b] hover:bg-[#252839] border border-[#2c2f42] hover:border-[#3c405a] text-gray-300 font-bold rounded-xl text-xs transition duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingTable || deletingBulk}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-red-600/25 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingTable || deletingBulk ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodePage;
