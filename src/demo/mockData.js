export const DEMO_SAMPLE_BUSINESS = {
  id: "demo-business-001", business_id: "demo-business-001",
  name: "Demo General Stores", business_name: "Demo General Stores",
  category: "Retail and trade", business_type: "Small business",
  business_scale: "small", workspace_mode: "simple",
  location: "Mombasa", county: "Mombasa", currency: "KES",
  verification_status: "verified", status: "active",
  created_at: "2026-01-10T08:00:00.000Z",
  logo_url: "", access_role: "owner", is_owner: true,
};

export const DEMO_SHOP = {
  business: DEMO_SAMPLE_BUSINESS,
  dashboard: {
    currency: "KES",
    metrics: {
      sales_total: 128500, orders: 38, pending_orders: 5,
      completed_orders: 33, customers: 26, products: 42,
      active_products: 38, low_stock: 3, expenses_total: 74200,
      net_estimate: 54300,
    },
    today: { sales: 8400, orders: 4 },
    top_products: [
      { id: "demo-product-1", name: "Maize flour 2 kg", units_sold: 26, revenue: 3900, stock_quantity: 11 },
      { id: "demo-product-2", name: "Cooking oil 1 L", units_sold: 19, revenue: 4750, stock_quantity: 7 },
      { id: "demo-product-3", name: "Laundry soap", units_sold: 17, revenue: 1700, stock_quantity: 4 },
    ],
    low_stock_products: [
      { id: "demo-product-3", name: "Laundry soap", stock_quantity: 4, low_stock_threshold: 8 },
      { id: "demo-product-4", name: "Tea leaves 500 g", stock_quantity: 2, low_stock_threshold: 5 },
    ],
    recent_orders: [
      { id: "demo-order-101", order_number: "DEMO-101", customer_name: "Amina", total: 2450, status: "processing", created_at: "2026-11-03T08:30:00.000Z" },
      { id: "demo-order-102", order_number: "DEMO-102", customer_name: "Peter", total: 1300, status: "pending", created_at: "2026-11-03T09:15:00.000Z" },
    ],
    recent_sales: [
      { id: "demo-sale-201", reference: "DEMO-SALE-201", amount: 8400, created_at: "2026-11-03T10:05:00.000Z" },
    ],
  },
  products: [
    { id: "demo-product-1", name: "Maize flour 2 kg", sku: "DM-001", stock_quantity: 11, price: 150, low_stock_threshold: 8 },
    { id: "demo-product-2", name: "Cooking oil 1 L", sku: "DM-002", stock_quantity: 7, price: 250, low_stock_threshold: 8 },
    { id: "demo-product-3", name: "Laundry soap", sku: "DM-003", stock_quantity: 4, price: 100, low_stock_threshold: 8 },
  ],
  customers: [
    { id: "demo-customer-1", name: "Amina Hassan", phone: "0700 000 101", orders_count: 4, total_spent: 8200 },
    { id: "demo-customer-2", name: "Peter Mwangi", phone: "0700 000 102", orders_count: 2, total_spent: 3650 },
  ],
  finance: {
    currency: "KES", income_total: 128500, expenses_total: 74200, net_estimate: 54300,
    transactions: [
      { id: "demo-finance-1", reference: "DEMO-RCPT-101", type: "sale", description: "Counter sales", amount: 8400, status: "completed", created_at: "2026-11-03T10:05:00.000Z" },
      { id: "demo-finance-2", reference: "DEMO-EXP-102", type: "expense", description: "Stock purchase", amount: 12500, status: "completed", created_at: "2026-11-02T13:20:00.000Z" },
    ],
    expenses: [
      { id: "demo-expense-1", category: "Stock", description: "Restock", amount: 12500, status: "paid" },
      { id: "demo-expense-2", category: "Transport", description: "Delivery fuel", amount: 4200, status: "paid" },
    ],
  },
  website: {
    published: true, title: "Demo General Stores",
    description: "A sample storefront for the guided demo.",
    services: ["Retail orders", "Local delivery"],
  },
};

export const DEMO_FARM = {
  farmer: { id: "demo-farmer-1", farmer_name: "Demo Farmer", verification_status: "verified", county: "Kilifi" },
  farms: [
    { id: "demo-farm-1", name: "Coastal Demo Farm", county: "Kilifi", town: "Mariakani", size: 3, size_unit: "acres", primary_crop: "Maize", legal_verification_status: "verified", status: "active" },
  ],
  dashboard: {
    farms_count: 1, verified_farms: 1,
    weather: { temperature: 27, condition: "Partly cloudy", humidity: 68, wind_speed: 12 },
    alerts: [{ id: "demo-farm-alert-1", title: "Demo irrigation reminder", read: false }],
  },
  activities: [{ id: "demo-activity-1", activity_type: "Irrigation", notes: "Demo field record", activity_date: "2026-11-02" }],
  market: [{ crop: "Maize", market: "Demo local market", price: 55, currency: "KES", unit: "kg" }],
};

export const DEMO_SCHOOL = {
  school: {
    id: "demo-school-1", name: "Jumuiya Demo School",
    slug: "jumuiya-demo-school", school_type: "primary",
    county: "Mombasa", town: "Mombasa", verification_status: "verified",
  },
  dashboard: {
    students_count: 320, staff_count: 18, classes_count: 12,
    attendance_rate: 94, outstanding_fees: 125000,
  },
  students: [
    { id: "demo-student-1", admission_number: "DEMO-001", full_name: "Demo Learner One", class_name: "Grade 5" },
    { id: "demo-student-2", admission_number: "DEMO-002", full_name: "Demo Learner Two", class_name: "Grade 6" },
  ],
};

export const DEMO_SCHOOL_ACCESS = {
  allowed: true,
  has_school: true,
  role: "owner",
  school: DEMO_SCHOOL.school,
  membership: { role: "owner", school: DEMO_SCHOOL.school },
  permissions: ["school.view", "school.manage", "students.view", "students.manage", "website.view", "website.manage"],
};

export const DEMO_COMMUNITY_POSTS = [
  { id: "demo-post-1", author: "Jumuiya Neighbourhood", body: "Welcome to the demo community. Share useful updates and local opportunities.", created_at: "2026-11-03T07:30:00.000Z", reactions_count: 8, comments_count: 2 },
  { id: "demo-post-2", author: "Demo Farmers Circle", body: "Farmers are sharing seasonal tips and market information here.", created_at: "2026-11-02T14:00:00.000Z", reactions_count: 5, comments_count: 1 },
];

export const DEMO_ACCOUNT = {
  profile: { id: "demo-user-1", full_name: "Demo Member", contact: "demo@example.test", role: "guest", verified: false },
  notifications: [{ id: "demo-notification-1", title: "Welcome to the demo", read: false }],
  payments: { balance: 0, currency: "KES", transactions: [] },
};

export function getDemoPayload(url = "", method = "GET", body = null) {
  const address = String(url || "");
  const lower = address.toLowerCase();
  const verb = String(method || "GET").toUpperCase();
  const payload = body && typeof body === "string" ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : body || {};

  if (verb !== "GET" && verb !== "HEAD") {
    return {
      success: true, ok: true, demo: true,
      message: "Demo mode: this action was simulated. Nothing was saved.",
      data: { id: "demo-action-" + Date.now(), status: "simulated", ...payload },
    };
  }

  if (lower.includes("community") || lower.includes("post") || lower.includes("chat") || lower.includes("group") || lower.includes("circle")) {
    return { success: true, demo: true, posts: DEMO_COMMUNITY_POSTS, data: { posts: DEMO_COMMUNITY_POSTS, items: DEMO_COMMUNITY_POSTS } };
  }

  if (lower.includes("biashara") || lower.includes("business") || lower.includes("orders") || lower.includes("products") || lower.includes("customer")) {
    if (lower.includes("finance") || lower.includes("transaction") || lower.includes("expense") || lower.includes("cashbook") || lower.includes("invoice")) {
      return { success: true, demo: true, finance: DEMO_SHOP.finance, transactions: DEMO_SHOP.finance.transactions, expenses: DEMO_SHOP.finance.expenses, data: { finance: DEMO_SHOP.finance, transactions: DEMO_SHOP.finance.transactions } };
    }
    if (lower.includes("product") || lower.includes("stock") || lower.includes("inventory")) return { success: true, demo: true, ...DEMO_SHOP, data: { products: DEMO_SHOP.products, product: DEMO_SHOP.products[0] } };
    if (lower.includes("order")) return { success: true, demo: true, ...DEMO_SHOP, orders: DEMO_SHOP.dashboard.recent_orders, data: { orders: DEMO_SHOP.dashboard.recent_orders } };
    if (lower.includes("customer")) return { success: true, demo: true, customers: DEMO_SHOP.customers, data: { customers: DEMO_SHOP.customers } };
    if (lower.includes("website") || lower.includes("storefront")) return { success: true, demo: true, website: DEMO_SHOP.website, data: { website: DEMO_SHOP.website } };
    if (lower.includes("dashboard") || lower.includes("overview")) return { success: true, demo: true, ...DEMO_SHOP, data: DEMO_SHOP.dashboard };
    return { success: true, demo: true, ...DEMO_SHOP, data: { business: DEMO_SHOP.business } };
  }

  if (lower.includes("shamba") || lower.includes("farm") || lower.includes("weather") || lower.includes("crop") || lower.includes("market")) {
    if (lower.includes("weather")) return { success: true, demo: true, weather: DEMO_FARM.dashboard.weather, data: { weather: DEMO_FARM.dashboard.weather } };
    if (lower.includes("market")) return { success: true, demo: true, market: DEMO_FARM.market, data: { market: DEMO_FARM.market } };
    if (lower.includes("farmer")) return { success: true, demo: true, ...DEMO_FARM, data: { farmer: DEMO_FARM.farmer } };
    if (lower.includes("farm")) return { success: true, demo: true, ...DEMO_FARM, data: { farms: DEMO_FARM.farms, farm: DEMO_FARM.farms[0] } };
    return { success: true, demo: true, ...DEMO_FARM, data: DEMO_FARM.dashboard };
  }

  if (lower.includes("elimu") || lower.includes("school") || lower.includes("student") || lower.includes("class")) {
    if (lower.includes("/access") || lower.endsWith("access")) {
      return { success: true, demo: true, access: DEMO_SCHOOL_ACCESS, data: { access: DEMO_SCHOOL_ACCESS } };
    }
    if (lower.includes("student")) return { success: true, demo: true, students: DEMO_SCHOOL.students, data: { students: DEMO_SCHOOL.students } };
    if (lower.includes("dashboard")) return { success: true, demo: true, dashboard: DEMO_SCHOOL.dashboard, data: { dashboard: DEMO_SCHOOL.dashboard } };
    return { success: true, demo: true, ...DEMO_SCHOOL, data: { school: DEMO_SCHOOL.school, dashboard: DEMO_SCHOOL.dashboard } };
  }

  if (lower.includes("community") || lower.includes("post") || lower.includes("chat") || lower.includes("group")) {
    return { success: true, demo: true, posts: DEMO_COMMUNITY_POSTS, data: { posts: DEMO_COMMUNITY_POSTS, items: DEMO_COMMUNITY_POSTS } };
  }

  if (lower.includes("payment") || lower.includes("wallet") || lower.includes("transaction") || lower.includes("notification") || lower.includes("profile") || lower.includes("account")) {
    return { success: true, demo: true, ...DEMO_ACCOUNT, data: DEMO_ACCOUNT };
  }

  return { success: true, demo: true, data: { items: [], message: "Demo sample data" } };
}
