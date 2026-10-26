export interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  price: number;
  costPrice: number;
  image?: string;
  barcode?: string;
  categoryId: string;
  category?: MenuCategory;
  available: boolean;
  prepTimeMin?: number;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  sortOrder: number;
  active: boolean;
  _count?: { items: number };
}

export interface Ingredient {
  id: string;
  name: string;
  nameAr: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  number: number;
  name?: string;
  capacity: number;
  zone?: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: Order;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  table?: Table;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountTotal: number;
  total: number;
  paymentMethod?: PaymentMethod;
  note?: string;
  cashierId?: string;
  cashierName?: string;
  isTakeaway: boolean;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  note?: string;
  status: ItemStatus;
  createdAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  discount: number;
  note?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  mustChangePassword?: boolean;
}

export interface Settings {
  storeName: string;
  storeNameAr: string;
  logo?: string;
  currency: string;
  taxRate: number;
  receiptFooter: string;
  receiptFooterAr: string;
  storeAddress?: string;
  storePhone?: string;
  lowStockThreshold: number;
  autoPrint?: boolean;
  paperSize?: '80mm' | '58mm';
  nif?: string;
  nis?: string;
  rc?: string;
  nfl?: string;
}

export interface DailyReport {
  id: string;
  date: string;
  totalSales: number;
  totalOrders: number;
  cashTotal: number;
  cardTotal: number;
  taxTotal: number;
  discountTotal: number;
  cancelledOrders: number;
  itemsSold: number;
  topItems?: string;
  closedBy?: string;
  closedAt?: string;
  totalExpenses?: number;
  profit?: number;
  expensesList?: Expense[];
}

export interface AuditEntry {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  notes?: string;
  date: string;
  createdBy?: string;
  createdAt: string;
}

export type Role = 'admin' | 'manager' | 'cashier';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled' | 'refunded';
export type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type PageView = 'pos' | 'menu' | 'tables' | 'sales' | 'reports' | 'users' | 'settings' | 'ingredients';
