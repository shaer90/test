import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// ── Shared types ──────────────────────────────────────────────────────────────

export interface StoredOrder {
  _id: string; createdAt: string; status: string; totalPrice: number;
  cancelledBy?: 'admin' | 'user';
  items?: Array<{ id: string; name: string; nameAr: string; price: number; quantity: number; color: string }>;
  user?: { name: string; phone: string; id: string };
  address?: string; paymentMethod?: string; notes?: string;
}

export interface StoredMember {
  _id: string; name: string; username: string; phone: string;
  role: 'customer' | 'member' | 'super_admin' | 'admin';
  createdAt?: string; subscriberCode?: string; sponsorCode?: string;
  availableCommission?: number; totalCommission?: number;
  isVerified?: boolean; verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  country?: string; city?: string; ageGroup?: string;
}

export interface StoredVerification {
  id: string; userId: string; userName: string; userCode?: string;
  idType: string; idNumber: string; fullName: string; dateOfBirth: string;
  idImage?: string; status: string; submittedAt: string; rejectionReason?: string;
}

export interface Commission {
  id: string; orderId: string; productNames: string;
  orderTotal: number; rate: number; amount: number;
  type: 'self' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5';
  level: number;
  memberId: string; memberName: string;
  fromMemberId: string; fromMemberName: string;
  createdAt: string;
}

export interface Payment {
  id: string; memberId: string; memberName: string;
  amount: number; note?: string; paidAt: string; paidBy: string;
}

export interface CommissionRates {
  memberSelf: number;
  level1: number; level2: number; level3: number; level4: number; level5: number;
}

export interface CartItem {
  id: string; name: string; nameAr: string;
  price: number; count: number; color: string; quantity: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post<{ token: string; user: StoredMember }>('/auth/login', data),

  register: (data: {
    username: string; name: string; phone: string; password: string;
    role: 'customer' | 'member'; sponsorCode?: string; country?: string; city?: string;
    ageGroup?: string; reminderEnabled?: boolean; lastPeriodDate?: string;
  }) => api.post<{ token: string; user: StoredMember }>('/auth/register', data),

  updateReminder: (data: { reminderEnabled: boolean; lastPeriodDate?: string }) =>
    api.put('/auth/reminder', data),

  checkReminder: () =>
    api.get<{ due: boolean; daysSince?: number }>('/auth/reminder-check'),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<{ user: StoredMember | null }>('/auth/me'),

  checkReferral: (code: string) =>
    api.get<{ valid: boolean; sponsor: { name: string } }>(`/auth/check-referral/${code}`),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// ── Cart ──────────────────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get<{ items: CartItem[] }>('/cart'),
  sync: (items: CartItem[]) => api.put('/cart', { items }),
  clear: () => api.delete('/cart'),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: () => api.get('/products'),
  getOne: (id: string) => api.get(`/products/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersAPI = {
  create: (data: {
    items: Array<{ id: string; name: string; nameAr: string; price: number; quantity: number; color: string }>;
    totalPrice: number; address: string; paymentMethod: string; notes?: string;
    fullName: string; phone: string;
  }) => api.post('/orders', data),

  getMyOrders: () => api.get<{ orders: StoredOrder[] }>('/orders/my'),
  cancelOrder: (id: string) => api.put(`/orders/${id}/cancel`),
  // Admin
  getAll: () => api.get<{ orders: StoredOrder[] }>('/admin/orders'),
  updateStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
};

// ── Network / MLM ─────────────────────────────────────────────────────────────
export const networkAPI = {
  getMyTeam: (_memberId?: string) => api.get('/network/team'),
  getCommissionRates: () => api.get<{ rates: CommissionRates }>('/network/commission-rates'),
  getMyCommissions: (_memberId?: string) =>
    api.get<{ commissions: Commission[] }>('/network/commissions'),
  getMyPayments: (_memberId?: string) =>
    api.get<{ payments: Payment[] }>('/network/payments'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getMembers: () => api.get<{ members: StoredMember[] }>('/admin/members'),
  updateMember: (id: string, data: Partial<StoredMember>) =>
    api.put(`/admin/members/${id}`, data),
  deleteMember: (id: string) => api.delete(`/admin/members/${id}`),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/admin/members/${id}/reset-password`, { newPassword }),
  getOrders: () => api.get<{ orders: StoredOrder[] }>('/admin/orders'),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  getCommissionRates: () => api.get<{ rates: CommissionRates }>('/admin/commission-rates'),
  updateCommissionRates: (rates: CommissionRates) =>
    api.put('/admin/commission-rates', rates),
  getCommissions: (memberId?: string) =>
    api.get<{ commissions: Commission[] }>('/admin/commissions', { params: { memberId } }),
  getPayments: (memberId?: string) =>
    api.get<{ payments: Payment[] }>('/admin/payments', { params: { memberId } }),
  payMember: (memberId: string, amount: number, note?: string) =>
    api.post('/admin/pay-member', { memberId, amount, note }),
  createProduct: (data: object) => api.post('/admin/products', data),
  updateProduct: (id: string, data: object) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  getVerifications: () => api.get('/admin/verifications'),
  approveVerification: (id: string) => api.put(`/admin/verifications/${id}/approve`),
  rejectVerification: (id: string, reason?: string) =>
    api.put(`/admin/verifications/${id}/reject`, { reason }),
};

// ── Verifications ─────────────────────────────────────────────────────────────
export const verificationAPI = {
  submit: (data: object) => api.post('/verifications', data),
  getStatus: () => api.get('/verifications/status'),
};

export function sanitizeText(val: string): string {
  return val.replace(/[<>"'`]/g, '');
}

export default api;
