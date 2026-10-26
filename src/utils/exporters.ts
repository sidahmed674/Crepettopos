import type { Order, Settings } from '@/types';

const EXCEL_FONT = '29LT Bukra Bold Italic';

export async function exportSalesToExcel(orders: Order[], settings: Settings): Promise<void> {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير المبيعات', { properties: { defaultColWidth: 15 } });
    worksheet.views = [{ rightToLeft: true }];

    if (settings.logo) {
      try {
        const base64 = settings.logo.includes(',') ? settings.logo.split(',')[1] : settings.logo;
        const ext = settings.logo.includes('png') ? 'png' : 'jpeg';
        const imageId = workbook.addImage({ base64, extension: ext });
        worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 100, height: 60 } });
      } catch { /* skip logo if it fails */ }
    }

    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `تقرير مبيعات - ${settings.storeNameAr || settings.storeName}`;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' }, name: EXCEL_FONT };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;

    worksheet.getRow(2).height = 5;

    const headers = ['رقم الفاتورة', 'الطاولة', 'التاريخ والوقت', 'عدد الأصناف', 'المجموع الفرعي', 'الخصم', 'الإجمالي', 'طريقة الدفع', 'ملاحظات'];
    const headerRow = worksheet.getRow(3);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FF1E40AF' }, name: EXCEL_FONT };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FF1E40AF' } } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    headerRow.height = 30;

    const paymentMap: Record<string, string> = { cash: 'نقداً', card: 'بطاقة', transfer: 'تحويل' };

    let totalItemsCount = 0;
    let sumSubtotal = 0;
    let sumDiscount = 0;
    let sumTotal = 0;

    orders.forEach((order, idx) => {
      const row = idx + 4;
      const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);
      totalItemsCount += itemsCount;
      sumSubtotal += order.subtotal;
      sumDiscount += order.discountTotal;
      sumTotal += order.total;

      const dateStr = new Date(order.createdAt).toLocaleString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

      const rowData = [
        order.orderNumber,
        order.isTakeaway ? 'تييك أواي' : (order.table?.number ?? '-'),
        dateStr,
        itemsCount,
        order.subtotal,
        order.discountTotal,
        order.total,
        paymentMap[order.paymentMethod || ''] || order.paymentMethod || '-',
        order.note || '-',
      ];

      const dataRow = worksheet.getRow(row);
      rowData.forEach((val, colIdx) => {
        const cell = dataRow.getCell(colIdx + 1);
        cell.value = val as string | number;
        cell.font = { name: EXCEL_FONT };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
        if (colIdx >= 4 && colIdx <= 6) {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    const totalRowIdx = orders.length + 4;
    const totalRow = worksheet.getRow(totalRowIdx);
    worksheet.mergeCells(totalRowIdx, 1, totalRowIdx, 3);
    totalRow.getCell(1).value = 'الإجمالي';
    totalRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, name: EXCEL_FONT };
    totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(4).value = totalItemsCount;
    totalRow.getCell(4).font = { bold: true, name: EXCEL_FONT };
    totalRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    const totals = [sumSubtotal, sumDiscount, sumTotal];
    totals.forEach((val, i) => {
      const cell = totalRow.getCell(5 + i);
      cell.value = val;
      cell.numFmt = '#,##0.00';
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: EXCEL_FONT };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    totalRow.getCell(8).value = '-';
    totalRow.getCell(8).font = { bold: true, color: { argb: 'FFFFFFFF' }, name: EXCEL_FONT };
    totalRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    totalRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(9).value = '-';
    totalRow.getCell(9).font = { bold: true, color: { argb: 'FFFFFFFF' }, name: EXCEL_FONT };
    totalRow.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    totalRow.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.height = 30;

    for (let i = 1; i <= 9; i++) {
      let maxLen = 10;
      const col = worksheet.getColumn(i);
      col.eachCell({ includeEmpty: false }, (cell: { value: unknown }) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 4, 30);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export sales to Excel:', error);
  }
}
