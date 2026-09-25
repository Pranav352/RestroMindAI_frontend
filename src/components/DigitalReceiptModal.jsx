import React from 'react';

const DigitalReceiptModal = ({ order, restaurant, isOpen, onClose, showWhatsAppShare = true, showPrintSave = true }) => {
  if (!isOpen || !order) return null;

  const restName = restaurant?.name || 'Restaurant';
  const restAddress = restaurant?.address || 'Dine-In Restaurant';
  const restPhone = restaurant?.phone || '';
  const currency = restaurant?.currency || '₹';

  const totalPrice = parseFloat(order.total_price || 0);
  const isPaid = Boolean(order.is_paid || order.status === 'completed');
  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const itemsList = (order.items || [])
      .map(i => `• ${i.quantity}x ${i.menu_item_name} — ${currency}${(parseFloat(i.price) * i.quantity).toFixed(2)}`)
      .join('%0A');

    const text = `*${restName} — Digital Tax Invoice*%0A` +
      `*Order #:* ${order.id}%0A` +
      `*Table:* Table ${order.table_number || 'N/A'}%0A` +
      `*Date:* ${formattedDate}%0A%0A` +
      `*Items:*%0A${itemsList}%0A%0A` +
      `*Total Amount:* ${currency}${totalPrice.toFixed(2)}%0A` +
      `*Payment Status:* ${isPaid ? 'PAID ✓' : 'UNPAID'}%0A%0A` +
      `Thank you for dining with us!`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161720] border border-[#262837] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden font-sans text-gray-200 flex flex-col max-h-[90vh]">
        
        {/* Header (Hidden on Print) */}
        <div className="p-5 border-b border-[#262837] flex justify-between items-center bg-[#1a1b26] print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h3 className="text-base font-bold text-white font-heading">Digital Tax Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-[#262837] text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Invoice Card Container (Printable with Scrollable Area) */}
        <div className="p-6 bg-white text-black font-sans text-xs space-y-4 overflow-y-auto flex-1 print:p-0 print:m-0 print:overflow-visible" id="receipt-invoice-content">
          {/* Restaurant Header */}
          <div className="text-center border-b border-gray-300 pb-3 space-y-1">
            <h2 className="text-xl font-black tracking-wide uppercase font-heading">{restName}</h2>
            <p className="text-[11px] text-gray-600">{restAddress}</p>
            {restPhone && <p className="text-[11px] text-gray-600">Phone: {restPhone}</p>}
          </div>

          {/* Order Metadata */}
          <div className="flex justify-between items-start text-[11px] border-b border-gray-300 pb-2">
            <div>
              <p><strong className="uppercase">Invoice #:</strong> INV-{order.id}</p>
              <p><strong>Table:</strong> Table {order.table_number || 'N/A'}</p>
              {order.customer_name && <p><strong>Guest:</strong> {order.customer_name}</p>}
            </div>
            <div className="text-right">
              <p><strong>Date:</strong> {formattedDate}</p>
              <p className="mt-1">
                <strong>Status:</strong>{' '}
                <span className={isPaid ? 'text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-black text-[11px]' : 'text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded font-black text-[11px]'}>
                  {isPaid ? 'PAID ✓' : 'UNPAID'}
                </span>
              </p>
            </div>
          </div>

          {/* Line Items Table (Consolidated across rounds for clean billing) */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 font-bold border-b border-black pb-1 text-[11px] uppercase">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-4 text-right">Amount</span>
            </div>

            {(() => {
              // Group and consolidate line items across rounds for clean billing
              const consolidatedMap = (order.items || []).reduce((acc, item) => {
                if (item.status === 'cancelled') return acc; // Exclude cancelled dishes
                const key = `${item.menu_item_name}_${item.price}`;
                if (!acc[key]) {
                  acc[key] = {
                    name: item.menu_item_name,
                    quantity: 0,
                    price: parseFloat(item.price),
                    notes: []
                  };
                }
                acc[key].quantity += item.quantity;
                if (item.notes && !acc[key].notes.includes(item.notes)) {
                  acc[key].notes.push(item.notes);
                }
                return acc;
              }, {});

              const consolidatedList = Object.values(consolidatedMap);

              if (consolidatedList.length === 0) {
                return <p className="text-gray-500 py-2 text-center">No active items</p>;
              }

              return consolidatedList.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-xs py-1 border-b border-gray-100">
                  <span className="col-span-6 font-semibold">
                    {item.name}
                    {item.notes?.length > 0 && (
                      <span className="block text-[10px] text-red-600 font-normal">
                        Note: {item.notes.join(', ')}
                      </span>
                    )}
                  </span>
                  <span className="col-span-2 text-center font-bold">{item.quantity}</span>
                  <span className="col-span-4 text-right font-bold">
                    {currency}{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ));
            })()}
          </div>

          {/* Financial Totals */}
          <div className="pt-2 space-y-1.5 text-xs border-t border-black">
            <div className="flex justify-between text-gray-700 font-medium">
              <span>Subtotal:</span>
              <span>{currency}{totalPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm font-black pt-2 border-t border-black">
              <span>GRAND TOTAL:</span>
              <span className="text-base">{currency}{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Thank You */}
          <div className="pt-3 border-t border-dashed border-gray-300 text-center text-[10px] text-gray-500 font-semibold uppercase">
            Thank you for dining with us! Please visit again.
          </div>
        </div>

        {/* Action Controls (Hidden on Print) */}
        <div className="p-5 border-t border-[#262837] flex flex-wrap gap-3 bg-[#1a1b26] print:hidden shrink-0">
          {showWhatsAppShare && (
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
            >
              <span>💬</span> Share WhatsApp
            </button>
          )}
          {showPrintSave && (
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0f1015] rounded-xl font-extrabold text-xs transition shadow flex items-center justify-center gap-1.5"
            >
              <span>🖨️</span> Save PDF / Print
            </button>
          )}
          <button
            onClick={onClose}
            className={`${(!showWhatsAppShare && !showPrintSave) ? 'w-full' : 'px-5'} py-2.5 bg-[#1e202e] hover:bg-[#252839] text-gray-300 rounded-xl font-bold text-xs transition border border-[#2c2f42] text-center`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalReceiptModal;
