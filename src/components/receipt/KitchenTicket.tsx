import { Order } from '@/types';

interface KitchenTicketProps {
  order: Order;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getElapsedMinutes(dateStr: string | Date): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
}

function Divider() {
  return <div className="kt-divider">- - - - - - - - - - - - - - - - - - - - -</div>;
}

export default function KitchenTicket({ order }: KitchenTicketProps) {
  const elapsed = getElapsedMinutes(order.createdAt || new Date());
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <style>{`
        .kt-wrapper {
          display: flex;
          justify-content: center;
          padding: 16px;
        }
        .kt-paper {
          width: 302px;
          background: #fff;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #1a1a1a;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          border-radius: 2px;
          overflow: hidden;
        }
        .kt-header {
          text-align: center;
          padding: 12px;
          background: #1a1a1a;
          color: #fff;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 3px;
        }
        .kt-body {
          padding: 8px 12px;
        }
        .kt-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .kt-label {
          color: #6b7280;
        }
        .kt-value {
          font-weight: bold;
        }
        .kt-items-header {
          font-weight: bold;
          font-size: 12px;
          padding: 4px 0 2px;
          border-bottom: 2px solid #1a1a1a;
          margin-bottom: 4px;
          margin-top: 4px;
        }
        .kt-item {
          padding: 6px 0;
          border-bottom: 1px dashed #e5e7eb;
          font-size: 12px;
        }
        .kt-item:last-child {
          border-bottom: none;
        }
        .kt-item-main {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .kt-item-qty {
          font-weight: bold;
          font-size: 14px;
          min-width: 28px;
        }
        .kt-item-name {
          font-weight: bold;
          font-size: 13px;
        }
        .kt-item-note {
          font-size: 10px;
          color: #dc2626;
          font-weight: bold;
          padding: 2px 0 0 34px;
          letter-spacing: 0.5px;
        }
        .kt-footer {
          padding: 8px 12px 12px;
          border-top: 2px solid #1a1a1a;
          text-align: center;
        }
        .kt-footer-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding: 1px 0;
        }
        .kt-elapsed {
          margin-top: 6px;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          padding: 4px 0;
          border: 2px solid #1a1a1a;
          border-radius: 4px;
        }
        .kt-urgent {
          border-color: #dc2626;
          color: #dc2626;
        }
        .kt-divider {
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
          line-height: 1;
          overflow: hidden;
          white-space: nowrap;
          margin: 4px 0;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          .kt-paper,
          .kt-paper * {
            visibility: visible !important;
          }
          .kt-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            box-shadow: none;
            border-radius: 0;
            font-size: 11pt;
          }
          .kt-wrapper {
            padding: 0;
            display: block;
          }
        }
      `}</style>

      <div className="kt-wrapper">
        <div className="kt-paper">
          {/* Header */}
          <div className="kt-header">
            KITCHEN TICKET
          </div>

          {/* Body */}
          <div className="kt-body">
            {/* Order Info */}
            <div className="kt-row">
              <span className="kt-label">Order #</span>
              <span className="kt-value">{order.orderNumber || order.id?.slice(0, 8)}</span>
            </div>
            {order.table?.number && (
              <div className="kt-row">
                <span className="kt-label">Table</span>
                <span className="kt-value">#{order.table.number}</span>
              </div>
            )}
            {order.isTakeaway && (
              <div className="kt-row">
                <span className="kt-label">Type</span>
                <span className="kt-value" style={{ color: '#dc2626' }}>TAKEAWAY</span>
              </div>
            )}
            <div className="kt-row">
              <span className="kt-label">Time</span>
              <span>{formatTime(order.createdAt || new Date())}</span>
            </div>
            <div className="kt-row">
              <span className="kt-label">Date</span>
              <span>{formatDate(order.createdAt || new Date())}</span>
            </div>

            <Divider />

            {/* Items */}
            <div className="kt-items-header">
              ITEMS ({totalItems})
            </div>
            {order.items.map((item, index) => (
              <div key={index} className="kt-item">
                <div className="kt-item-main">
                  <span className="kt-item-qty">{item.quantity}x</span>
                  <span className="kt-item-name">{item.name}</span>
                </div>
                {item.note && (
                  <div className="kt-item-note">{`>> ${item.note} <<`}</div>
                )}
              </div>
            ))}

            {/* Footer */}
            <div className="kt-footer">
              <div className="kt-footer-row">
                <span className="kt-label">Total Items</span>
                <span className="kt-value">{totalItems}</span>
              </div>
              {order.cashierName && (
                <div className="kt-footer-row">
                  <span className="kt-label">Cashier</span>
                  <span>{order.cashierName}</span>
                </div>
              )}

              <div className={`kt-elapsed ${elapsed > 15 ? 'kt-urgent' : ''}`}>
                {elapsed > 15 ? '!! URGENT !! ' : ''}
                Elapsed: {formatElapsed(elapsed)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
