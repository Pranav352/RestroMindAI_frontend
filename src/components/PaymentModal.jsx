import React, { useState, useEffect } from 'react';

const PaymentModal = ({ order, isOpen, onClose, onConfirm, loading, currency = '₹' }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitOnline, setSplitOnline] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      setPaymentMethod('cash');
      setCashTendered('');
      setTransactionRef('');
      setSplitCash('');
      setSplitOnline('');
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const totalPrice = parseFloat(order.total_price || 0);
  const cashAmount = parseFloat(cashTendered) || 0;
  const changeToReturn = cashAmount >= totalPrice ? cashAmount - totalPrice : 0;

  const splitCashAmount = parseFloat(splitCash) || 0;
  const splitOnlineAmount = parseFloat(splitOnline) || 0;
  const splitTotal = splitCashAmount + splitOnlineAmount;
  const isSplitValid = Math.abs(splitTotal - totalPrice) < 0.01;

  const handleComplete = (e) => {
    e.preventDefault();
    const finalMethod = paymentMethod === 'split' 
      ? `split (Cash: ${currency}${splitCashAmount.toFixed(2)}, Online: ${currency}${splitOnlineAmount.toFixed(2)})`
      : paymentMethod;

    onConfirm(finalMethod, {
      cashTendered: paymentMethod === 'cash' ? cashAmount : paymentMethod === 'split' ? splitCashAmount : null,
      changeToReturn: paymentMethod === 'cash' ? changeToReturn : null,
      transactionRef: ['upi', 'card', 'split'].includes(paymentMethod) ? transactionRef : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161720] border border-[#262837] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-gray-200">
        
        {/* Header */}
        <div className="p-6 border-b border-[#262837] flex justify-between items-center bg-[#1a1b26]">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Settlement & Billing</span>
            <h3 className="text-xl font-black text-white font-heading mt-0.5">Order #{order.id}</h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-[#262837] text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleComplete} className="p-6 space-y-6">
          {/* Summary Box */}
          <div className="bg-[#12131a] border border-[#232635] rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-semibold">Table Location</p>
              <p className="text-base font-extrabold text-white font-heading">
                Table {order.table_number || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-semibold">Total Payable</p>
              <p className="text-2xl font-black text-amber-500 font-heading">
                {currency}{totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Payment Method Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'cash', label: '💵 Cash', desc: 'Direct cash payment' },
                { id: 'upi', label: '📱 UPI / QR Scan', desc: 'GPay, PhonePe, Paytm' },
                { id: 'card', label: '💳 Credit / Debit Card', desc: 'POS terminal swipe/dip' },
                { id: 'split', label: '🔀 Split Payment', desc: 'Cash + Online divided' },
                { id: 'complimentary', label: '🎁 Complimentary', desc: 'Manager discount 100%' },
              ].map((method) => (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
                    paymentMethod === method.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/5'
                      : 'bg-[#1e202e]/60 border-[#2c2f42] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="font-bold text-xs font-heading">{method.label}</span>
                  <span className="text-[10px] text-gray-500 font-medium mt-1">{method.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Inputs */}
          {paymentMethod === 'cash' && (
            <div className="bg-[#12131a] border border-[#232635] p-4 rounded-2xl space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Cash Amount Tendered ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={totalPrice}
                  placeholder={`Min ${currency}${totalPrice.toFixed(2)}`}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full bg-[#1c1d29] border border-[#2c2f42] rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {cashAmount >= totalPrice && (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-[#232635]">
                  <span className="text-gray-400 font-semibold">Change to Return to Guest:</span>
                  <span className="text-base font-extrabold text-emerald-400 font-heading">
                    {currency}{changeToReturn.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'split' && (
            <div className="bg-[#12131a] border border-[#232635] p-4 rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    💵 Cash Portion ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="w-full bg-[#1c1d29] border border-[#2c2f42] rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    📱 Online/UPI Portion ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={splitOnline}
                    onChange={(e) => setSplitOnline(e.target.value)}
                    className="w-full bg-[#1c1d29] border border-[#2c2f42] rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-[#232635]">
                <span className="text-gray-400 font-semibold">Split Total vs Bill:</span>
                <span className={`font-extrabold text-xs ${isSplitValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {currency}{splitTotal.toFixed(2)} / {currency}{totalPrice.toFixed(2)} {isSplitValid ? '✓' : '(Must equal total)'}
                </span>
              </div>
            </div>
          )}

          {['upi', 'card', 'split'].includes(paymentMethod) && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Transaction / Ref Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. TXN98765432"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full bg-[#1c1d29] border border-[#2c2f42] rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#1e202e] hover:bg-[#252839] text-gray-300 border border-[#2c2f42] rounded-xl font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (paymentMethod === 'cash' && cashTendered && cashAmount < totalPrice) ||
                (paymentMethod === 'split' && !isSplitValid)
              }
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-[#0f1015] rounded-xl font-extrabold text-xs transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-[#0f1015] border-t-transparent animate-spin rounded-full"></div>
              ) : (
                'Confirm & Settle Bill ✓'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
