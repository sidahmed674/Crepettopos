import { useCallback } from 'react';
import type { Order } from '../types';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useI18n } from '../i18n';
import { barcodeSvgMarkup } from '../components/ui/barcode';

function esc(s: string | undefined | null): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmt(amount: number): string {
  return amount.toFixed(2);
}

function fmtDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function payLabel(method: string | undefined, t: (k: string) => string): string {
  if (!method) return '';
  return t(`rec.pay${method.charAt(0).toUpperCase()}${method.slice(1)}`);
}

const PRINT_STYLE = `
  @media print {
    @page { margin: 0; size: __PAPERW__ auto; }
    body { font-family: 'Noto Kufi Arabic', 'Courier New', monospace; width: __PAPERW__; margin: 0; font-size: 12px; }
  }
  body {
    font-family: 'Noto Kufi Arabic', 'Courier New', monospace;
    width: __PAPERPX__;
    margin: 0 auto;
    font-size: 12px;
    color: #1a1a1a;
  }
  .page { padding: 8px; }
  .page-break { page-break-after: always; border-bottom: 2px dashed #999; margin-bottom: 8px; padding-bottom: 8px; }

  /* ── Customer Receipt ── */
  .c-header { text-align: center; margin-bottom: 12px; }
  .c-header h2 { margin: 4px 0; font-size: 18px; letter-spacing: 1px; }
  .c-header .sub { font-size: 11px; color: #666; letter-spacing: 1px; }
  .c-header p { margin: 2px 0; font-size: 11px; color: #666; }
  .c-barcode { margin: 8px auto 2px; display: flex; justify-content: center; }
  .c-barcode-caption { font-size: 10px; letter-spacing: 2px; color: #333; text-align: center; }
  .c-row { display: flex; justify-content: space-between; font-size: 11px; padding: 1px 0; }
  .c-row .label { color: #666; }
  .c-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .c-table th { border-bottom: 2px solid #333; padding: 6px 0; font-size: 11px; }
  .c-table td { border-bottom: 1px solid #eee; padding: 4px 0; font-size: 11px; }
  .c-totals { margin: 8px 0; }
  .c-totals div { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
  .c-total-line { font-weight: bold; font-size: 14px; border-top: 2px solid #333; padding-top: 4px; margin-top: 4px; }
  .c-footer { text-align: center; margin-top: 12px; font-size: 10px; color: #666; }
  .c-divider { border-top: 1px dashed #999; margin: 8px 0; }

  /* ── Kitchen Receipt ── */
  .k-header {
    text-align: center;
    background: #1a1a1a;
    color: #fff;
    padding: 10px 0;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 3px;
    margin-bottom: 8px;
  }
  .k-row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
  .k-label { color: #6b7280; }
  .k-bold { font-weight: bold; }
  .k-takeaway { color: #dc2626; font-weight: bold; }
  .k-divider { border-top: 1px dashed #999; margin: 6px 0; }
  .k-items-title { font-weight: bold; font-size: 13px; border-bottom: 2px solid #1a1a1a; padding-bottom: 3px; margin: 6px 0 4px; }
  .k-footer { border-top: 2px solid #1a1a1a; margin-top: 8px; padding-top: 6px; font-size: 11px; }
`;

type SilentPrintApi = {
  silent: (html: string, opts: { copies?: number; paperWidth?: number }) =>
    Promise<{ ok: boolean; error?: string }>;
};

function getSilentApi(): SilentPrintApi | null {
  const api = (window as unknown as { crepettooPrint?: SilentPrintApi }).crepettooPrint;
  return api && typeof api.silent === 'function' ? api : null;
}

// Prints silently through Electron (NO Windows/browser print dialog).
// Falls back to window.print() only when not running inside Electron (dev in browser).
function openPrintWindow(
  html: string,
  opts: { paperWidthMm?: number; onError?: (msg: string) => void } = {},
): void {
  const api = getSilentApi();
  if (api) {
    api.silent(html, { copies: 1, paperWidth: opts.paperWidthMm === 58 ? 58 : 80 })
      .then((res) => {
        if (!res?.ok) opts.onError?.(res?.error || 'failed');
      })
      .catch((err) => opts.onError?.(String(err?.message || err)));
    return;
  }

  let win: Window | null = null;
  try {
    win = window.open('', '_blank');
  } catch {
    win = null;
  }

  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win?.print();
      win?.focus();
    }, 400);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  const finish = () => {
    setTimeout(() => document.body.removeChild(iframe), 500);
  };
  iframe.contentWindow?.addEventListener('afterprint', finish);
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(finish, 1000);
  }, 400);
}

export function usePrint() {
  const settings = useSettingsStore((s) => s.settings);
  const { t, lang } = useI18n();

  const paperW = settings.paperSize === '58mm' ? '58mm' : '80mm';
  const paperPx = paperW === '58mm' ? '219px' : '302px';
  const paperWidthMm = paperW === '58mm' ? 58 : 80;
  const style = PRINT_STYLE.split('__PAPERW__').join(paperW).split('__PAPERPX__').join(paperPx);
  const dirAttrs = `dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}"`;

  const printError = useCallback((msg: string) => {
    import('react-hot-toast').then(({ default: toast }) => {
      toast.error(`${t('pos.printFailed')}: ${msg}`);
    });
  }, [t]);

  const customerPage = useCallback((order: Order, withBreak: boolean): string => {
    const orderLabel = order.orderNumber || order.id?.slice(0, 8) || '';
    const customerItemsRows = order.items
      .map(
        (item) => `
        <tr>
          <td style="text-align:right;padding:4px 0;font-size:11px">${esc(item.name)}</td>
          <td style="text-align:center;padding:4px 0;font-size:11px">${item.quantity}</td>
          <td style="text-align:left;padding:4px 0;font-size:11px">${fmt(item.unitPrice)}</td>
          <td style="text-align:left;padding:4px 0;font-size:11px">${fmt(item.unitPrice * item.quantity - (item.discount || 0))}</td>
        </tr>`
      )
      .join('');

    const subtotal = order.subtotal ?? order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const discountTotal = order.discountTotal ?? 0;
    const total = order.total ?? subtotal - discountTotal;

    return `
      <div class="page${withBreak ? ' page-break' : ''}">
        <div class="c-header">
          ${settings.logo ? `<img src="${esc(settings.logo)}" alt="logo" style="max-height:50px;margin-bottom:8px" />` : ''}
          <h2>${esc(settings.storeName || 'Crepettoo')}</h2>
          ${settings.storeNameAr ? `<div class="sub">${esc(settings.storeNameAr)}</div>` : ''}
          ${settings.storeAddress ? `<p>${esc(settings.storeAddress)}</p>` : ''}
          ${settings.storePhone ? `<p>${t('rec.phone')}: ${esc(settings.storePhone)}</p>` : ''}
          ${settings.nif ? `<p style="font-size:10px">NIF: ${esc(settings.nif)}${settings.nis ? ` | NIS: ${esc(settings.nis)}` : ''}</p>` : ''}
          ${settings.rc ? `<p style="font-size:10px">RC: ${esc(settings.rc)}${settings.nfl ? ` | NFL: ${esc(settings.nfl)}` : ''}</p>` : ''}
          <div class="c-row"><span class="label">${t('rec.orderNo')}</span><span style="font-weight:bold">${esc(orderLabel)}</span></div>
          ${order.table?.number ? `<div class="c-row"><span class="label">${t('rec.table')}</span><span style="font-weight:bold">#${order.table.number}</span></div>` : ''}
          ${order.isTakeaway ? `<div class="c-row"><span class="label">${t('rec.takeaway')}</span></div>` : ''}
          <div class="c-row"><span class="label">${t('rec.date')}</span><span>${fmtDate(order.createdAt || new Date())}</span></div>
          ${order.cashierName ? `<div class="c-row"><span class="label">${t('rec.cashier')}</span><span>${esc(order.cashierName)}</span></div>` : ''}
          <div class="c-row"><span class="label">${t('rec.paymentMethod')}</span><span style="font-weight:bold">${esc(payLabel(order.paymentMethod, t))}</span></div>
          <div class="c-barcode">${barcodeSvgMarkup(orderLabel, 34)}</div>
          <div class="c-barcode-caption">${esc(orderLabel)}</div>
        </div>
        <div class="c-divider"></div>
        <table class="c-table">
          <thead>
            <tr>
              <th style="text-align:right">${t('rec.product')}</th>
              <th style="text-align:center">${t('rec.qty')}</th>
              <th style="text-align:left">${t('rec.price')}</th>
              <th style="text-align:left">${t('rec.total')}</th>
            </tr>
          </thead>
          <tbody>${customerItemsRows}</tbody>
        </table>
        <div class="c-divider"></div>
        <div class="c-totals">
          <div><span>${t('rec.subtotal')}</span><span>${fmt(subtotal)}</span></div>
          ${discountTotal > 0 ? `<div><span>${t('rec.discount')}</span><span>-${fmt(discountTotal)}</span></div>` : ''}
          <div class="c-total-line"><span>${t('rec.total')}</span><span>${fmt(total)} ${settings.currency || 'DZD'}</span></div>
        </div>
        ${order.note ? `<p style="font-size:11px">${t('rec.note')}: ${esc(order.note)}</p>` : ''}
        <div class="c-divider"></div>
        <div class="c-footer">${esc(settings.receiptFooter || '')}</div>
        ${settings.receiptFooterAr ? `<div class="c-footer" style="margin-top:4px">${esc(settings.receiptFooterAr)}</div>` : ''}
      </div>`;
  }, [settings, t]);

  const kitchenPage = useCallback((order: Order): string => {
    const orderLabel = order.orderNumber || order.id?.slice(0, 8) || '';
    const kitchenItemsRows = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:4px 0;font-size:12px;font-weight:bold;white-space:nowrap">${item.quantity}x</td>
          <td style="padding:4px 0;font-size:12px">${esc(item.name)}</td>
        </tr>
        ${item.note ? `<tr><td></td><td style="padding:0 0 4px;font-size:10px;color:#dc2626;font-weight:bold">* ${esc(item.note)}</td></tr>` : ''}`
      )
      .join('');

    const timeStr = new Date(order.createdAt || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const totalKitchenItems = order.items.reduce((s, i) => s + i.quantity, 0);

    return `
      <div class="page">
        <div class="k-header">KITCHEN</div>
        <div class="k-row"><span class="k-label">Order #</span><span class="k-bold">${orderLabel}</span></div>
        ${order.table?.number ? `<div class="k-row"><span class="k-label">Table</span><span class="k-bold">#${order.table.number}</span></div>` : ''}
        ${order.isTakeaway ? `<div class="k-row"><span class="k-label">Type</span><span class="k-takeaway">TAKEAWAY</span></div>` : ''}
        <div class="k-row"><span class="k-label">Time</span><span>${timeStr}</span></div>
        <div class="k-divider"></div>
        <div class="k-items-title">ITEMS</div>
        <table style="width:100%;border-collapse:collapse">${kitchenItemsRows}</table>
        <div class="k-footer">
          <div class="k-row"><span class="k-label">Total Items</span><span class="k-bold">${totalKitchenItems}</span></div>
        </div>
      </div>`;
  }, []);

  const wrap = useCallback((title: string, body: string): string => {
    return `
    <!DOCTYPE html>
    <html ${dirAttrs} lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <title>${esc(title)}</title>
      <style>${style}</style>
    </head>
    <body>
      ${body}
    </body>
    </html>`;
  }, [dirAttrs, lang, style]);

  // Legacy combined print (customer + kitchen pages): used for takeaway only.
  const printReceipt = useCallback((order: Order) => {
    const orderLabel = order.orderNumber || order.id?.slice(0, 8) || '';
    openPrintWindow(wrap(`${t('rec.invoice')} ${orderLabel}`,
      customerPage(order, true) + kitchenPage(order)), { paperWidthMm, onError: printError });
  }, [t, wrap, customerPage, kitchenPage, paperWidthMm, printError]);

  // Kitchen ticket only. copies = number of copies in ONE print job.
  const printKitchen = useCallback((order: Order, copies: number = 1) => {
    const orderLabel = order.orderNumber || order.id?.slice(0, 8) || '';
    let pages = '';
    for (let i = 0; i < copies; i++) {
      pages += (i > 0 ? '<div class="page-break"></div>' : '') + kitchenPage(order);
    }
    openPrintWindow(wrap(`KITCHEN ${orderLabel}`, pages), { paperWidthMm, onError: printError });
  }, [wrap, kitchenPage, paperWidthMm, printError]);

  // Customer invoice only. copies = number of copies in ONE print job.
  const printCustomer = useCallback((order: Order, copies: number = 1) => {
    const orderLabel = order.orderNumber || order.id?.slice(0, 8) || '';
    let pages = '';
    for (let i = 0; i < copies; i++) {
      pages += customerPage(order, i < copies - 1);
    }
    openPrintWindow(wrap(`${t('rec.invoice')} ${orderLabel}`, pages), { paperWidthMm, onError: printError });
  }, [t, wrap, customerPage, paperWidthMm, printError]);

  return { printReceipt, printKitchen, printCustomer };
}
