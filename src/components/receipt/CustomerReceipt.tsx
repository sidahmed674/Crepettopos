import { Order, Settings } from '@/types';

interface CustomerReceiptProps {
  order: Order;
  settings: Settings;
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
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

function Divider() {
  return <div className="receipt-divider">- - - - - - - - - - - - - - - - - - - - -</div>;
}

function DoubleDivider() {
  return <div className="receipt-divider">{'═'.repeat(32)}</div>;
}

export default function CustomerReceipt({ order, settings }: CustomerReceiptProps) {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const itemsDiscount = order.items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const grandTotal = subtotal - itemsDiscount;
  const currency = settings.currency || 'DZD';
  const storeName = settings.storeNameAr || settings.storeName || 'Crepettoo';
  const storeNameEn = settings.storeName || 'Crepettoo';

  return (
    <>
      <style>{`
        .receipt-wrapper {
          display: flex;
          justify-content: center;
          padding: 16px;
        }
        .receipt-paper {
          width: 302px;
          background: #fff;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          line-height: 1.5;
          color: #1a1a1a;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          border-radius: 2px;
          overflow: hidden;
        }
        .receipt-header {
          text-align: center;
          padding: 16px 12px 8px;
          border-bottom: 2px dashed #d1d5db;
        }
        .receipt-store-name {
          font-size: 20px;
          font-weight: bold;
          letter-spacing: 2px;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        .receipt-store-sub {
          font-size: 11px;
          color: #6b7280;
          letter-spacing: 1px;
        }
        .receipt-store-info {
          font-size: 10px;
          color: #6b7280;
          margin-top: 4px;
          line-height: 1.4;
        }
        .receipt-body {
          padding: 8px 12px;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .receipt-row-between {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .receipt-order-info {
          padding: 6px 0;
        }
        .receipt-order-info .label {
          color: #6b7280;
        }
        .receipt-items-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 11px;
          padding: 4px 0 2px;
          border-bottom: 1px solid #1a1a1a;
          margin-bottom: 4px;
        }
        .receipt-item {
          margin-bottom: 6px;
          font-size: 11px;
        }
        .receipt-item-name {
          font-weight: 500;
        }
        .receipt-item-detail {
          display: flex;
          justify-content: space-between;
          color: #374151;
        }
        .receipt-item-note {
          font-size: 10px;
          color: #6b7280;
          font-style: italic;
          padding-left: 8px;
          margin-top: 1px;
        }
        .receipt-totals {
          padding: 4px 0;
        }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding: 1px 0;
          color: #374151;
        }
        .receipt-total-row.discount {
          color: #dc2626;
        }
        .receipt-grand-total {
          display: flex;
          justify-content: space-between;
          font-size: 15px;
          font-weight: bold;
          padding: 6px 0 2px;
          border-top: 2px solid #1a1a1a;
          margin-top: 4px;
        }
        .receipt-payment {
          font-size: 11px;
          padding: 4px 0;
          color: #374151;
        }
        .receipt-footer {
          text-align: center;
          padding: 8px 12px 16px;
          border-top: 2px dashed #d1d5db;
        }
        .receipt-thankyou {
          font-size: 13px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        .receipt-footer-text {
          font-size: 10px;
          color: #6b7280;
          line-height: 1.4;
        }
        .receipt-barcode {
          text-align: center;
          margin: 8px 0 4px;
          font-size: 9px;
          letter-spacing: 2px;
          color: #9ca3af;
        }
        .receipt-divider {
          font-size: 10px;
          color: #9ca3af;
          text-align: center;
          line-height: 1;
          overflow: hidden;
          white-space: nowrap;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          .receipt-paper,
          .receipt-paper * {
            visibility: visible !important;
          }
          .receipt-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            box-shadow: none;
            border-radius: 0;
            font-size: 11pt;
          }
          .receipt-wrapper {
            padding: 0;
            display: block;
          }
        }
      `}</style>

      <div className="receipt-wrapper">
        <div className="receipt-paper">
          {/* Header */}
          <div className="receipt-header">
            <div className="receipt-store-name">{storeNameEn}</div>
            {storeName !== storeNameEn && (
              <div className="receipt-store-name" style={{ fontSize: 16 }}>{storeName}</div>
            )}
            <div className="receipt-store-sub">{'★'.repeat(5)} RESTAURANT {'★'.repeat(5)}</div>
            {settings.storeAddress && (
              <div className="receipt-store-info">{settings.storeAddress}</div>
            )}
            {settings.storePhone && (
              <div className="receipt-store-info">Tel: {settings.storePhone}</div>
            )}
            {(settings.nif || settings.nis || settings.rc || settings.nfl) && (
              <div className="receipt-store-info">
                {settings.nif && <div>NIF: {settings.nif}</div>}
                {settings.nis && <div>NIS: {settings.nis}</div>}
                {settings.rc && <div>RC: {settings.rc}</div>}
                {settings.nfl && <div>NFL: {settings.nfl}</div>}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="receipt-body">
            {/* Order Info */}
            <div className="receipt-order-info">
              <div className="receipt-row-between">
                <span className="label">Order #</span>
                <span style={{ fontWeight: 'bold' }}>{order.orderNumber || order.id?.slice(0, 8)}</span>
              </div>
              {order.table?.number && (
                <div className="receipt-row-between">
                  <span className="label">Table</span>
                  <span style={{ fontWeight: 'bold' }}>{order.table.number}</span>
                </div>
              )}
              {order.isTakeaway && (
                <div className="receipt-row-between">
                  <span className="label">Type</span>
                  <span style={{ fontWeight: 'bold' }}>TAKEAWAY</span>
                </div>
              )}
              <div className="receipt-row-between">
                <span className="label">Date</span>
                <span>{formatDate(order.createdAt || new Date())}</span>
              </div>
              <div className="receipt-row-between">
                <span className="label">Time</span>
                <span>{formatTime(order.createdAt || new Date())}</span>
              </div>
              {order.cashierName && (
                <div className="receipt-row-between">
                  <span className="label">Cashier</span>
                  <span>{order.cashierName}</span>
                </div>
              )}
            </div>

            <Divider />

            {/* Items Header */}
            <div className="receipt-items-header">
              <span>Item</span>
              <span>Total</span>
            </div>

            {/* Items */}
            {order.items.map((item, index) => (
              <div key={index} className="receipt-item">
                <div className="receipt-item-detail">
                  <span className="receipt-item-name">
                    {item.quantity}x {item.name}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>
                    {formatAmount(item.unitPrice * item.quantity)}
                  </span>
                </div>
                {item.unitPrice !== (item.unitPrice * item.quantity) / item.quantity && (
                  <div className="receipt-item-detail" style={{ fontSize: 10, color: '#9ca3af' }}>
                    <span>@ {formatAmount(item.unitPrice)} each</span>
                    <span />
                  </div>
                )}
                {(item.discount || 0) > 0 && (
                  <div className="receipt-item-detail" style={{ fontSize: 10, color: '#dc2626' }}>
                    <span>Discount</span>
                    <span>-{formatAmount(item.discount)}</span>
                  </div>
                )}
                {item.note && (
                  <div className="receipt-item-note">* {item.note}</div>
                )}
              </div>
            ))}

            <Divider />

            {/* Totals */}
            <div className="receipt-totals">
              <div className="receipt-total-row">
                <span>Subtotal</span>
                <span>{formatAmount(subtotal)}</span>
              </div>
              {itemsDiscount > 0 && (
                <div className="receipt-total-row discount">
                  <span>Discount</span>
                  <span>-{formatAmount(itemsDiscount)}</span>
                </div>
              )}
              <div className="receipt-grand-total">
                <span>TOTAL</span>
                <span>{formatAmount(grandTotal)} {currency}</span>
              </div>
            </div>

            {/* Payment */}
            {order.paymentMethod && (
              <>
                <Divider />
                <div className="receipt-payment">
                  <div className="receipt-row-between">
                    <span className="label">Payment</span>
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {order.paymentMethod === 'cash' ? 'Cash' :
                       order.paymentMethod === 'card' ? 'Card' : 'Transfer'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <div className="receipt-barcode">
              | | | | | | | | | | | | | | | | | | | | |
            </div>
            <Divider />
            <div className="receipt-thankyou">Merci & Thank You!</div>
            <div className="receipt-footer-text">
              {settings.receiptFooterAr && <div>{settings.receiptFooterAr}</div>}
              {settings.receiptFooter && <div>{settings.receiptFooter}</div>}
            </div>
            <div style={{ marginTop: 6, fontSize: 9, color: '#9ca3af' }}>
              CrepettooPOS v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
