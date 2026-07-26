import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useRestaurant from '../hooks/useRestaurant';
import qrApi from '../api/qr';
import { useAuth } from '../context/AuthContext';

const QRCodePage = () => {
  const {
    restaurant,
    loading: restaurantLoading,
    fetchRestaurant,
  } = useRestaurant();

  const [tableNumber, setTableNumber] = useState(1);
  const [qrData, setQrData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const subscription = user?.subscription;
  const isSubscriptionActive = subscription?.status === 'active' && 
    (subscription?.days_remaining > 0 || subscription?.days_remaining === null);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const generateQR = async (restaurantId, number) => {
    if (!restaurantId) return;
    try {
      setGenerating(true);
      setError('');
      const data = await qrApi.generateQR(restaurantId, number);
      setQrData(data);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError(err.response?.data?.error || 'Failed to generate QR Code. Please check backend settings.');
    } finally {
      setGenerating(false);
    }
  };

  const handleTableChange = (e) => {

    const value = e.target.value;
    setTableNumber(value);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (restaurant) {
      generateQR(restaurant.id, tableNumber);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const absoluteQrUrl = qrData?.qr_code_url?.startsWith('http')
      ? qrData.qr_code_url
      : `${apiBaseUrl}${qrData?.qr_code_url}`;

    const customerUrl = qrData?.table_number
      ? `${window.location.origin}/menu/${restaurant?.id || ''}?table=${qrData.table_number}`
      : qrData?.qr_code_url 
      ? `${window.location.origin}/menu/${restaurant?.id || ''}`
      : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - Table ${qrData?.table_number}</title>
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
              margin-bottom: 5px;
              color: #d97706;
            }
            p.sub {
              font-size: 14px;
              color: #4b5563;
              margin-top: 0;
              margin-bottom: 30px;
            }
            .qr-wrapper {
              margin: 20px 0;
            }
            .qr-image {
              width: 250px;
              height: 250px;
              border: 1px solid #e5e7eb;
              padding: 10px;
              border-radius: 10px;
            }
            .table-info {
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0 10px 0;
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
            <p class="sub">Scan to view our digital menu</p>
            <div class="qr-wrapper">
              <img class="qr-image" src="${absoluteQrUrl}" alt="QR Code" />
            </div>
            <div class="table-info">Table ${qrData?.table_number || tableNumber}</div>
            <div class="url-info">${customerUrl}</div>
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

  const currentMenuUrl = restaurant
    ? (qrData?.table_number
      ? `${window.location.origin}/menu/${restaurant.id}?table=${qrData.table_number}`
      : `${window.location.origin}/menu/${restaurant.id}`)
    : '';

  const handleCopyLink = () => {
    if (!restaurant) return;
    navigator.clipboard.writeText(currentMenuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const displayQrUrl = qrData?.qr_code_url?.startsWith('http')
    ? qrData.qr_code_url
    : `${apiBaseUrl}${qrData?.qr_code_url}`;

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
    <div className="flex-1 max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight font-heading text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
          QR Code Generator
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Generate high-resolution QR codes to link physical tables to your custom digital menu.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#161720] border border-[#262837] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-bold font-heading text-gray-200 mb-4">Table Selection</h2>
            
            <form onSubmit={handleGenerate} className="space-y-4">
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
                    className={`flex-1 px-4 py-3 bg-[#1d1f2b] border ${!isSubscriptionActive ? 'border-transparent text-gray-500 cursor-not-allowed opacity-60' : 'border-[#2c2f42] focus:border-amber-500'} rounded-xl text-gray-200 outline-none transition`}
                  />
                  <div className="flex flex-col justify-between">
                    <button
                      type="button"
                      disabled={!isSubscriptionActive}
                      onClick={() => {
                        const next = Math.max(1, (parseInt(tableNumber, 10) || 1) + 1);
                        setTableNumber(next);
                        generateQR(restaurant.id, next);
                      }}
                      className="px-2.5 py-1 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] rounded-md text-gray-400 hover:text-gray-200 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={!isSubscriptionActive}
                      onClick={() => {
                        const next = Math.max(1, (parseInt(tableNumber, 10) || 1) - 1);
                        setTableNumber(next);
                        generateQR(restaurant.id, next);
                      }}
                      className="px-2.5 py-1 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] rounded-md text-gray-400 hover:text-gray-200 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating || !isSubscriptionActive}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-[#0f1015] font-semibold rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#0f1015]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
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
            <h2 className="text-lg font-bold font-heading text-gray-200 mb-3">Copy Menu Link</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Manually share this direct URL with customers, or copy it to use on social media and flyers.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={currentMenuUrl}
                className="flex-1 px-4 py-2.5 bg-[#1d1f2b] border border-[#2c2f42] rounded-xl text-xs text-gray-400 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
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
          <div className="bg-[#161720] border border-[#262837] rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
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
                  <p className="text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-4">
                    Scan for Digital Menu
                  </p>
                  <div className="w-[200px] h-[200px] bg-white border border-gray-100 p-2 rounded-lg inline-flex items-center justify-center">
                    <img
                      src={displayQrUrl}
                      alt={`Table ${qrData.table_number} QR Code`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[#0f1015] font-bold font-heading text-lg mt-3 uppercase tracking-wider">
                    Table {qrData.table_number}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-8 justify-center w-full max-w-sm">
                  <button
                    onClick={handlePrint}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-[#1d1f2b] hover:bg-[#27293d] border border-[#2c2f42] text-gray-200 hover:text-white font-semibold rounded-xl text-sm transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print QR Code
                  </button>

                  <a
                    href={displayQrUrl}
                    download={`table_${qrData.table_number}_qr.png`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-amber-500/10 hover:bg-amber-500 hover:text-[#0f1015] border border-amber-500/25 hover:border-transparent text-amber-400 font-semibold rounded-xl text-sm transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PNG
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="h-12 w-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>No QR Code loaded. Select a table and click Generate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
