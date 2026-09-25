import React from 'react';

const KotPrintModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#161720] border border-[#262837] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden font-sans text-gray-200 flex flex-col max-h-[90vh]">
        
        {/* Header (Hidden on print) */}
        <div className="p-5 border-b border-[#262837] flex justify-between items-center bg-[#1a1b26] print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖨️</span>
            <h3 className="text-base font-bold text-white font-heading">Kitchen Order Ticket (KOT)</h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-[#262837] text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Printable Ticket Container */}
        <div className="p-6 bg-white text-black font-mono text-xs space-y-4 overflow-y-auto flex-1 print:p-0 print:m-0 print:overflow-visible" id="kot-ticket-content">
          <div className="text-center border-b border-black pb-2 space-y-1">
            <h2 className="text-lg font-black tracking-widest uppercase">KITCHEN ORDER TICKET</h2>
            <p className="text-xs font-bold">Table: {order.table_number || 'Takeaway'}</p>
            <p className="text-[10px]">Order #{order.id} | {formattedDate}</p>
            {order.customer_name && <p className="text-[10px]">Guest: {order.customer_name}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-bold border-b border-dashed border-black pb-1 uppercase text-[11px]">
              <span>QTY  ITEM</span>
              <span>ROUND</span>
            </div>

            {(order.items || []).map((item) => (
              <div key={item.id} className="py-1 border-b border-gray-200 text-xs">
                <div className="flex justify-between font-bold">
                  <span>
                    <strong className="text-sm mr-1">{item.quantity}x</strong> {item.menu_item_name}
                  </span>
                  <span>R{item.round || 1}</span>
                </div>
                {item.notes && (
                  <div className="text-[11px] font-bold text-red-600 mt-0.5 pl-4">
                    👉 NOTE: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-black text-center text-[10px] uppercase font-bold">
            *** END OF KOT TICKET ***
          </div>
        </div>

        {/* Action Controls (Hidden on print) */}
        <div className="p-5 border-t border-[#262837] flex gap-3 bg-[#1a1b26] print:hidden shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#1e202e] hover:bg-[#252839] text-gray-300 rounded-xl font-bold text-xs transition border border-[#2c2f42]"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0f1015] rounded-xl font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-2"
          >
            <span>🖨️</span> Print KOT Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default KotPrintModal;
