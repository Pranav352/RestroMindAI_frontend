import React, { useState, useEffect } from 'react';

const WalkoutModal = ({ order, isOpen, onClose, onConfirmVoid, loading, currency = '₹' }) => {
  const [reason, setReason] = useState('Guest Walkout / Dine & Dash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      setReason('Guest Walkout / Dine & Dash');
      setCustomerPhone(order.customer_phone || '');
      setCopiedLink(false);
      setPhoneError('');
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const totalPrice = parseFloat(order.total_price || 0);

  const getWhatsAppPayLink = () => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const itemsList = (order.items || [])
      .map(i => `${i.quantity}x ${i.menu_item_name}`)
      .join(', ');
      
    const text = `Hello ${order.customer_name || 'Valued Guest'}! 👋\n\nYour bill for Order #${order.id} at Table ${order.table_number || 'N/A'} of ${currency}${totalPrice.toFixed(2)} (${itemsList}) remains unpaid.\n\nPlease clear your balance at your earliest convenience using UPI payment link.\nThank you!`;
    
    return `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`;
  };

  const handleWhatsAppClick = () => {
    if (!customerPhone) {
      setPhoneError('Please enter a customer phone number to send WhatsApp payment link.');
      return;
    }
    setPhoneError('');
    window.open(getWhatsAppPayLink(), '_blank');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    onConfirmVoid(reason, customerPhone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161720] border border-red-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-gray-200">
        
        {/* Header */}
        <div className="p-6 border-b border-[#262837] flex justify-between items-center bg-[#1c1418]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-xl font-bold">
              🚫
            </div>
            <div>
              <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider">
                Table Release & Void Order
              </span>
              <h3 className="text-xl font-black text-white font-heading mt-0.5">
                Order #{order.id} — Table {order.table_number || 'N/A'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-[#262837] text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-6">
          {/* Summary Box */}
          <div className="bg-[#12131a] border border-[#232635] rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-semibold">Guest Name</p>
              <p className="text-base font-extrabold text-white font-heading">
                {order.customer_name || 'Walk-in Guest'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-semibold">Unpaid Amount</p>
              <p className="text-2xl font-black text-red-400 font-heading">
                {currency}{totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Select Cancellation / Void Reason
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { id: 'Guest Walkout / Dine & Dash', label: '🏃 Guest Walkout / Dine & Dash', desc: 'Guest left table without clearing bill' },
                { id: 'Food Quality / Wrong Item', label: '🍲 Food Quality / Order Dispute', desc: 'Items returned or cancelled due to error' },
                { id: 'Customer Cancelled Before Prep', label: '⏱️ Customer Cancelled', desc: 'Guest changed mind before items were cooked' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={`p-3.5 rounded-2xl border text-left transition duration-200 flex flex-col ${
                    reason === r.id
                      ? 'bg-red-500/10 border-red-500 text-red-300 shadow-lg shadow-red-500/10'
                      : 'bg-[#1e202e]/60 border-[#2c2f42] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="text-sm font-extrabold font-heading">{r.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Recovery WhatsApp Tool */}
          <div className="bg-[#121420] border border-emerald-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <span>📲</span> Digital Payment Link Recovery
              </span>
              {copiedLink && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  WhatsApp Opened!
                </span>
              )}
            </div>

            <div>
              <label className="text-[11px] text-gray-400 font-semibold block mb-1">
                Customer WhatsApp Phone Number:
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-[#1a1c29] border border-[#2b2e42] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0f1015] font-extrabold text-xs rounded-xl transition shadow flex items-center gap-1.5"
                >
                  <span>📲</span> Send Link
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Sends automated UPI pay request to guest via WhatsApp before voiding table.
              </p>
              {phoneError && (
                <p className="text-xs text-red-400 font-bold mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {phoneError}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#1e202e] hover:bg-[#282b3d] text-gray-300 font-bold text-sm rounded-2xl transition border border-[#2c2f42]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                <>
                  <span>🚫</span> Confirm Void & Release Table
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalkoutModal;
