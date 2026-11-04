const DEMO_DATE = "2026-11-04";
const DEMO_STAMP = "2026-11-04T08:00:00.000Z";
const demoId = (kind, number) => "demo-" + kind + "-" + String(number).padStart(3, "0");

const STUDENT_FIRST_NAMES = [
  "Amani", "Baraka", "Chao", "Deka", "Eliud", "Farida", "Gideon", "Halima",
  "Imani", "Jabali", "Kamau", "Lina", "Malaika", "Nuru", "Omari", "Pendo",
  "Qadira", "Rashid", "Safiya", "Taji", "Upendo", "Wanjiku", "Yusuf", "Zawadi",
];
const STUDENT_LAST_NAMES = [
  "Abdalla", "Adhiambo", "Ali", "Barasa", "Chebet", "Hassan", "Juma", "Kamau",
  "Kilonzo", "Maina", "Mashauri", "Mumo", "Mwangi", "Njoroge", "Ochieng", "Otieno",
  "Said", "Wekesa", "Wambui", "Yusuf",
];
const SUBJECTS = ["English", "Kiswahili", "Mathematics", "Integrated Science", "Social Studies", "CRE", "Agriculture", "Creative Arts"];
const GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
const STREAMS = ["East", "West"];
const CLASS_IDS = Array.from({ length: 12 }, (_, i) => demoId("class", i + 1));
const DEMO_CLASSES = Array.from({ length: 12 }, (_, i) => ({
  id: CLASS_IDS[i], class_id: CLASS_IDS[i], name: GRADES[i % GRADES.length] + " " + STREAMS[Math.floor(i / GRADES.length)],
  class_name: GRADES[i % GRADES.length] + " " + STREAMS[Math.floor(i / GRADES.length)],
  grade: GRADES[i % GRADES.length], stream: STREAMS[Math.floor(i / GRADES.length)],
  academic_year: 2026, capacity: 35, teacher_id: demoId("staff", i + 1),
  student_count: i < 8 ? 27 : 26, status: "active", is_demo: true,
}));
export const DEMO_STUDENTS = Array.from({ length: 320 }, (_, i) => {
  const first = STUDENT_FIRST_NAMES[i % STUDENT_FIRST_NAMES.length];
  const last = STUDENT_LAST_NAMES[(i * 7 + Math.floor(i / STUDENT_FIRST_NAMES.length)) % STUDENT_LAST_NAMES.length];
  const classIndex = i % DEMO_CLASSES.length;
  return {
    id: demoId("student", i + 1), student_id: demoId("student", i + 1),
    admission_number: "JDS/26/" + String(i + 1).padStart(4, "0"),
    full_name: first + " " + last, first_name: first, last_name: last,
    gender: i % 2 ? "Female" : "Male", date_of_birth: (2010 + (i % 8)) + "-0" + ((i % 9) + 1) + "-" + String((i % 27) + 1).padStart(2, "0"),
    class_id: CLASS_IDS[classIndex], class_name: DEMO_CLASSES[classIndex].class_name,
    grade: DEMO_CLASSES[classIndex].grade, stream: DEMO_CLASSES[classIndex].stream,
    guardian_name: STUDENT_FIRST_NAMES[(i + 5) % STUDENT_FIRST_NAMES.length] + " " + STUDENT_LAST_NAMES[(i + 9) % STUDENT_LAST_NAMES.length],
    guardian_phone: "0700" + String(100000 + i).slice(-6),
    guardian_email: "guardian" + (i + 1) + "@example.test",
    admission_date: "2026-01-" + String((i % 28) + 1).padStart(2, "0"),
    status: i % 31 === 0 ? "inactive" : "active",
    fee_balance: [0, 0, 2500, 5000, 7500][i % 5],
    is_demo: true,
  };
});
export const DEMO_STAFF = Array.from({ length: 18 }, (_, i) => {
  const roles = ["Principal", "Deputy Principal", "Bursar", "Registrar", "Teacher", "Teacher", "Teacher", "Teacher", "Teacher", "Teacher", "Teacher", "Teacher", "Teacher", "Teacher", "Librarian", "Storekeeper", "Support Staff", "Support Staff"];
  const first = STUDENT_FIRST_NAMES[(i + 3) % STUDENT_FIRST_NAMES.length];
  const last = STUDENT_LAST_NAMES[(i * 3 + 2) % STUDENT_LAST_NAMES.length];
  return {
    id: demoId("staff", i + 1), user_id: demoId("staff-user", i + 1),
    full_name: first + " " + last, name: first + " " + last,
    staff_number: "JDS/STAFF/" + String(i + 1).padStart(3, "0"),
    role: roles[i], designation: roles[i], email: "staff" + (i + 1) + "@example.test",
    phone: "0711" + String(200000 + i).slice(-6),
    employment_status: "active", joined_on: "2024-01-08", is_demo: true,
  };
});
export const DEMO_LESSONS = SUBJECTS.flatMap((subject, i) => DEMO_CLASSES.slice(0, 6).map((klass, j) => ({
  id: demoId("lesson", i * 6 + j + 1), title: subject + " — " + klass.class_name,
  subject, class_id: klass.id, class_name: klass.class_name,
  teacher_id: DEMO_STAFF[4 + ((i + j) % 10)].id, lesson_date: DEMO_DATE,
  topic: ["Foundations", "Guided practice", "Application", "Revision"][((i + j) % 4)],
  duration_minutes: 40, status: "planned", is_demo: true,
})));
export const DEMO_ASSIGNMENTS = SUBJECTS.slice(0, 6).map((subject, i) => ({
  id: demoId("assignment", i + 1), title: subject + " practice task",
  subject, class_id: DEMO_CLASSES[i].id, class_name: DEMO_CLASSES[i].class_name,
  due_date: "2026-11-" + String(8 + i).padStart(2, "0"),
  status: i % 2 ? "published" : "draft", submissions_count: 18 + i,
  total_students: 27, is_demo: true,
}));
export const DEMO_ATTENDANCE = DEMO_STUDENTS.slice(0, 90).map((student, i) => ({
  id: demoId("attendance", i + 1), student_id: student.id,
  student_name: student.full_name, admission_number: student.admission_number,
  class_id: student.class_id, class_name: student.class_name,
  attendance_date: DEMO_DATE, date: DEMO_DATE,
  status: i % 17 === 0 ? "absent" : i % 23 === 0 ? "late" : "present",
  marked_by: DEMO_STAFF[4 + (i % 10)].full_name, is_demo: true,
}));
export const DEMO_ASSESSMENTS = DEMO_STUDENTS.slice(0, 96).map((student, i) => ({
  id: demoId("assessment", i + 1), student_id: student.id,
  student_name: student.full_name, admission_number: student.admission_number,
  class_id: student.class_id, class_name: student.class_name,
  subject: SUBJECTS[i % SUBJECTS.length], assessment_name: "Term 3 Continuous Assessment",
  score: 48 + ((i * 13) % 51), out_of: 100, grade: ["A", "B", "B", "C", "C", "D"][i % 6],
  assessment_date: "2026-10-" + String((i % 28) + 1).padStart(2, "0"), is_demo: true,
}));
export const DEMO_FEES = DEMO_STUDENTS.slice(0, 120).map((student, i) => ({
  id: demoId("fee", i + 1), student_id: student.id,
  student_name: student.full_name, admission_number: student.admission_number,
  class_name: student.class_name, term: "Term 3", academic_year: 2026,
  amount_due: 18000, amount_paid: [18000, 15000, 12000, 9000, 6000][i % 5],
  balance: [0, 3000, 6000, 9000, 12000][i % 5],
  status: i % 5 === 0 ? "paid" : i % 5 === 1 ? "part_paid" : "outstanding",
  votehead: "Tuition and learning materials", currency: "KES", is_demo: true,
}));
export const DEMO_TIMETABLE = DEMO_CLASSES.slice(0, 6).flatMap((klass, i) => SUBJECTS.slice(0, 5).map((subject, j) => ({
  id: demoId("timetable", i * 5 + j + 1), class_id: klass.id, class_name: klass.class_name,
  day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][j],
  start_time: String(8 + (j % 3)).padStart(2, "0") + ":00", end_time: String(8 + (j % 3)).padStart(2, "0") + ":40",
  subject, teacher_id: DEMO_STAFF[4 + ((i + j) % 10)].id, room: "Room " + (i + 1), is_demo: true,
})));
export const DEMO_CBC_PROJECTS = [
  { id: demoId("project", 1), title: "Kitchen garden and nutrition", class_name: "Grade 5 East", learning_area: "Agriculture", status: "in_progress", progress: 70, due_date: "2026-11-20", is_demo: true },
  { id: demoId("project", 2), title: "Coastal water conservation", class_name: "Grade 6 West", learning_area: "Integrated Science", status: "in_progress", progress: 45, due_date: "2026-11-25", is_demo: true },
  { id: demoId("project", 3), title: "Community oral history", class_name: "Grade 4 East", learning_area: "Social Studies", status: "completed", progress: 100, due_date: "2026-10-28", is_demo: true },
];
export const DEMO_SCHOOL_EVENTS = [
  { id: demoId("event", 1), title: "End of term assessment week", event_date: "2026-11-09", category: "Academic", status: "scheduled", is_demo: true },
  { id: demoId("event", 2), title: "Parents and guardians meeting", event_date: "2026-11-14", category: "Community", status: "scheduled", is_demo: true },
  { id: demoId("event", 3), title: "School closing day", event_date: "2026-11-27", category: "Calendar", status: "scheduled", is_demo: true },
];
export const DEMO_SCHOOL_LIBRARY = [
  { id: demoId("book", 1), title: "The River Between", author: "Sample author record", category: "Literature", copies_total: 12, copies_available: 8, is_demo: true },
  { id: demoId("book", 2), title: "Basic Mathematics", author: "Sample author record", category: "Mathematics", copies_total: 20, copies_available: 13, is_demo: true },
  { id: demoId("book", 3), title: "Integrated Science Workbook", author: "Sample author record", category: "Science", copies_total: 16, copies_available: 11, is_demo: true },
];

export const DEMO_SAMPLE_BUSINESS = {
  id: "demo-business-001", business_id: "demo-business-001",
  name: "Jumuiya Demo Traders", business_name: "Jumuiya Demo Traders",
  category: "Retail and distribution", business_type: "Retail business",
  business_scale: "small", workspace_mode: "simple",
  industry_template: "retail", location: "Mombasa", county: "Mombasa", currency: "KES",
  verification_status: "demo", status: "demo", is_demo: true,
  created_at: "2026-01-10T08:00:00.000Z",
  logo_url: "", access_role: "owner", is_owner: true,
  phone: "0700000100", email: "office@example.test",
  description: "Synthetic retail and distribution business used only for RevelaCode presentations.",
};
const PRODUCT_NAMES = [
  ["Maize flour 2 kg", "DM-001", 150, 34], ["Cooking oil 1 L", "DM-002", 250, 21],
  ["Laundry soap", "DM-003", 100, 9], ["Tea leaves 500 g", "DM-004", 180, 6],
  ["Rice 2 kg", "DM-005", 320, 42], ["Sugar 1 kg", "DM-006", 170, 18],
  ["Wheat flour 2 kg", "DM-007", 165, 27], ["Bar soap", "DM-008", 85, 52],
  ["Milk 500 ml", "DM-009", 65, 38], ["Salt 1 kg", "DM-010", 55, 44],
  ["Bottled water 1 L", "DM-011", 80, 4], ["Beans 1 kg", "DM-012", 210, 31],
  ["Unga wa wimbi 1 kg", "DM-013", 190, 15], ["Tomato paste", "DM-014", 95, 23],
  ["Washing powder 1 kg", "DM-015", 220, 12], ["Maize seed 2 kg", "DM-016", 450, 17],
  ["Animal feed 10 kg", "DM-017", 780, 8], ["Exercise books pack", "DM-018", 300, 29],
  ["LED bulb", "DM-019", 160, 14], ["Cooking gas refill", "DM-020", 2800, 5],
  ["Baking flour 1 kg", "DM-021", 130, 33], ["Peanut butter", "DM-022", 260, 11],
  ["Cereal mix 500 g", "DM-023", 240, 19], ["Dishwashing liquid", "DM-024", 140, 25],
  ["Hand wash 500 ml", "DM-025", 175, 16], ["Baby porridge 1 kg", "DM-026", 310, 13],
  ["Green grams 1 kg", "DM-027", 230, 22], ["Dry pasta 500 g", "DM-028", 120, 40],
  ["Coffee 250 g", "DM-029", 290, 7], ["Sanitary pads pack", "DM-030", 130, 28],
];
export const DEMO_PRODUCTS = PRODUCT_NAMES.map((row, i) => ({
  id: demoId("product", i + 1), product_id: demoId("product", i + 1),
  name: row[0], product_name: row[0], sku: row[1], price: row[2],
  selling_price: row[2], cost_price: Math.round(row[2] * 0.72),
  stock_quantity: row[3], quantity: row[3], low_stock_threshold: 10,
  category: ["Groceries", "Household", "Agriculture", "School supplies"][i % 4],
  unit: "piece", status: "active", is_demo: true,
}));
export const DEMO_CUSTOMERS = Array.from({ length: 18 }, (_, i) => ({
  id: demoId("customer", i + 1), customer_id: demoId("customer", i + 1),
  name: STUDENT_FIRST_NAMES[(i + 2) % STUDENT_FIRST_NAMES.length] + " " + STUDENT_LAST_NAMES[(i * 2) % STUDENT_LAST_NAMES.length],
  customer_name: STUDENT_FIRST_NAMES[(i + 2) % STUDENT_FIRST_NAMES.length] + " " + STUDENT_LAST_NAMES[(i * 2) % STUDENT_LAST_NAMES.length],
  phone: "0722" + String(300000 + i).slice(-6), email: "customer" + (i + 1) + "@example.test",
  orders_count: 1 + (i % 7), total_spent: 1500 + i * 875, status: "active", is_demo: true,
}));
export const DEMO_ORDERS = Array.from({ length: 18 }, (_, i) => ({
  id: demoId("order", i + 1), order_id: demoId("order", i + 1),
  order_number: "JDT-" + String(2026) + "-" + String(i + 1).padStart(4, "0"),
  customer_id: DEMO_CUSTOMERS[i].id, customer_name: DEMO_CUSTOMERS[i].name,
  items: [{ product_id: DEMO_PRODUCTS[i].id, product_name: DEMO_PRODUCTS[i].name, quantity: 2 + (i % 4), unit_price: DEMO_PRODUCTS[i].price }],
  total: (2 + (i % 4)) * DEMO_PRODUCTS[i].price,
  status: ["completed", "processing", "pending", "ready"][i % 4],
  payment_status: i % 4 === 0 ? "paid" : "pending",
  created_at: "2026-11-" + String((i % 4) + 1).padStart(2, "0") + "T09:00:00.000Z",
  is_demo: true,
}));
export const DEMO_SALES = Array.from({ length: 40 }, (_, i) => ({
  id: demoId("sale", i + 1), sale_id: demoId("sale", i + 1),
  reference: "JDT-SALE-" + String(i + 1).padStart(4, "0"),
  amount: 850 + i * 275, currency: "KES", payment_method: ["cash", "mpesa", "bank"][i % 3],
  status: "completed", sold_by: DEMO_STAFF[i % DEMO_STAFF.length].full_name,
  created_at: "2026-11-" + String((i % 4) + 1).padStart(2, "0") + "T10:15:00.000Z",
  is_demo: true,
}));
export const DEMO_EXPENSES = Array.from({ length: 12 }, (_, i) => ({
  id: demoId("expense", i + 1), category: ["Stock", "Transport", "Utilities", "Rent", "Salaries", "Packaging"][i % 6],
  description: ["Wholesale restock", "Delivery fuel", "Electricity bill", "Premises rent", "Staff wages", "Packaging materials"][i % 6],
  amount: 1800 + i * 950, currency: "KES", status: "paid",
  expense_date: "2026-11-" + String((i % 4) + 1).padStart(2, "0"), is_demo: true,
}));
export const DEMO_BUSINESS_STAFF = DEMO_STAFF.slice(0, 8).map((staff, i) => ({
  ...staff, id: demoId("employee", i + 1), employee_number: "JDT/EMP/" + String(i + 1).padStart(3, "0"),
  department: ["Management", "Sales", "Stores", "Finance"][i % 4],
  salary_band: [28000, 24000, 22000, 35000][i % 4], attendance_status: i % 5 === 0 ? "off" : "present",
}));
export const DEMO_SERVICES = [
  { id: demoId("service", 1), name: "Local delivery", description: "Same-day local order delivery", price: 250, status: "active", is_demo: true },
  { id: demoId("service", 2), name: "Wholesale supply", description: "Bulk goods supply for institutions", price: 0, status: "active", is_demo: true },
  { id: demoId("service", 3), name: "Stock sourcing", description: "Special product sourcing on request", price: 500, status: "active", is_demo: true },
];
export const DEMO_FACTORY_BATCHES = [
  { id: demoId("batch", 1), batch_number: "JDT-BATCH-001", product: "Branded maize flour pack", planned_quantity: 500, completed_quantity: 460, wastage_quantity: 8, status: "completed", is_demo: true },
  { id: demoId("batch", 2), batch_number: "JDT-BATCH-002", product: "Retail cereal mix", planned_quantity: 300, completed_quantity: 180, wastage_quantity: 3, status: "in_progress", is_demo: true },
];
export const DEMO_SHOP = {
  business: DEMO_SAMPLE_BUSINESS,
  dashboard: {
    currency: "KES",
    metrics: {
      sales_total: 128500, orders: DEMO_ORDERS.length, pending_orders: DEMO_ORDERS.filter((x) => x.status === "pending").length,
      completed_orders: DEMO_ORDERS.filter((x) => x.status === "completed").length, customers: DEMO_CUSTOMERS.length,
      products: DEMO_PRODUCTS.length, active_products: DEMO_PRODUCTS.length,
      low_stock: DEMO_PRODUCTS.filter((x) => x.stock_quantity <= x.low_stock_threshold).length,
      expenses_total: DEMO_EXPENSES.reduce((sum, x) => sum + x.amount, 0), net_estimate: 54300,
    },
    today: { sales: 8400, orders: 4 },
    top_products: DEMO_PRODUCTS.slice(0, 5).map((x, i) => ({ id: x.id, name: x.name, units_sold: 26 - i * 3, revenue: x.price * (26 - i * 3), stock_quantity: x.stock_quantity })),
    low_stock_products: DEMO_PRODUCTS.filter((x) => x.stock_quantity <= x.low_stock_threshold),
    recent_orders: DEMO_ORDERS.slice(0, 6),
    recent_sales: DEMO_SALES.slice(0, 6),
  },
  products: DEMO_PRODUCTS, customers: DEMO_CUSTOMERS, orders: DEMO_ORDERS,
  sales: DEMO_SALES, services: DEMO_SERVICES, employees: DEMO_BUSINESS_STAFF,
  factory_batches: DEMO_FACTORY_BATCHES,
  finance: {
    currency: "KES", income_total: 128500, expenses_total: 74200, net_estimate: 54300,
    transactions: [
      ...DEMO_SALES.slice(0, 12).map((x) => ({ id: x.id, reference: x.reference, type: "sale", description: "Retail sale", amount: x.amount, status: "completed", created_at: x.created_at })),
      ...DEMO_EXPENSES.map((x) => ({ id: x.id, reference: x.id.toUpperCase(), type: "expense", description: x.description, amount: x.amount, status: x.status, created_at: DEMO_STAMP })),
    ],
    expenses: DEMO_EXPENSES,
  },
  website: {
    published: true, title: DEMO_SAMPLE_BUSINESS.name, slug: "jumuiya-demo-traders",
    description: "A sample storefront for guided product presentations.",
    services: DEMO_SERVICES.map((x) => x.name), inquiries: [
      { id: demoId("inquiry", 1), name: "Sample Institution", message: "Please share your wholesale catalogue.", status: "new", is_demo: true },
      { id: demoId("inquiry", 2), name: "Sample Customer", message: "Do you offer local delivery?", status: "replied", is_demo: true },
    ],
  },
};

export const DEMO_FARMER = {
  id: demoId("farmer", 1), farmer_id: demoId("farmer", 1),
  farmer_name: "Demo Farmer Cooperative Member", full_name: "Demo Farmer Cooperative Member",
  phone: "0700000200", email: "farmer@example.test",
  county: "Kilifi", sub_county: "Kaloleni", ward: "Mariakani",
  verification_status: "demo", status: "demo", is_demo: true,
};
export const DEMO_FARMS = [
  { id: demoId("farm", 1), farm_id: demoId("farm", 1), name: "Coastal Demonstration Farm", farm_name: "Coastal Demonstration Farm", county: "Kilifi", sub_county: "Kaloleni", town: "Mariakani", size: 3.5, size_unit: "acres", primary_crop: "Maize", soil_type: "sandy_loam", irrigation_type: "rain_fed", legal_verification_status: "demo", status: "demo", is_demo: true },
  { id: demoId("farm", 2), farm_id: demoId("farm", 2), name: "Riverbend Demonstration Plot", farm_name: "Riverbend Demonstration Plot", county: "Kilifi", sub_county: "Kilifi South", town: "Mtwapa", size: 1.25, size_unit: "acres", primary_crop: "Tomatoes", soil_type: "loam", irrigation_type: "drip", legal_verification_status: "demo", status: "demo", is_demo: true },
  { id: demoId("farm", 3), farm_id: demoId("farm", 3), name: "Greenfields Demonstration Farm", farm_name: "Greenfields Demonstration Farm", county: "Makueni", sub_county: "Makueni", town: "Wote", size: 5, size_unit: "acres", primary_crop: "Beans", soil_type: "clay_loam", irrigation_type: "rain_fed", legal_verification_status: "demo", status: "demo", is_demo: true },
];
export const DEMO_FARM_CROPS = [
  { id: demoId("crop", 1), crop_name: "Maize", variety: "DH04", farm_id: DEMO_FARMS[0].id, area: 2, area_unit: "acres", planting_date: "2026-03-15", expected_harvest_date: "2026-11-20", growth_stage: "maturity", status: "active", is_demo: true },
  { id: demoId("crop", 2), crop_name: "Cowpeas", variety: "M66", farm_id: DEMO_FARMS[0].id, area: 1.5, area_unit: "acres", planting_date: "2026-04-02", expected_harvest_date: "2026-11-15", growth_stage: "flowering", status: "active", is_demo: true },
  { id: demoId("crop", 3), crop_name: "Tomatoes", variety: "Anna F1", farm_id: DEMO_FARMS[1].id, area: 0.75, area_unit: "acres", planting_date: "2026-09-01", expected_harvest_date: "2026-12-10", growth_stage: "fruiting", status: "active", is_demo: true },
  { id: demoId("crop", 4), crop_name: "Beans", variety: "Rosecoco", farm_id: DEMO_FARMS[2].id, area: 2, area_unit: "acres", planting_date: "2026-08-12", expected_harvest_date: "2026-12-01", growth_stage: "vegetative", status: "active", is_demo: true },
];
export const DEMO_FARM_ACTIVITIES = [
  { id: demoId("farm-activity", 1), farm_id: DEMO_FARMS[0].id, activity_type: "Land preparation", notes: "Field prepared and planting rows marked.", activity_date: "2026-03-10", is_demo: true },
  { id: demoId("farm-activity", 2), farm_id: DEMO_FARMS[0].id, activity_type: "Planting", notes: "Maize and cowpeas planted in separate plots.", activity_date: "2026-03-15", is_demo: true },
  { id: demoId("farm-activity", 3), farm_id: DEMO_FARMS[1].id, activity_type: "Irrigation", notes: "Drip irrigation inspection completed.", activity_date: "2026-11-02", is_demo: true },
  { id: demoId("farm-activity", 4), farm_id: DEMO_FARMS[2].id, activity_type: "Weeding", notes: "Manual weeding and crop scouting.", activity_date: "2026-10-28", is_demo: true },
];
export const DEMO_HARVESTS = [
  { id: demoId("harvest", 1), farm_id: DEMO_FARMS[0].id, crop_id: DEMO_FARM_CROPS[0].id, crop_name: "Maize", harvest_date: "2025-11-20", quantity: 1250, unit: "kg", quality_grade: "A", destination: "Local market", is_demo: true },
  { id: demoId("harvest", 2), farm_id: DEMO_FARMS[1].id, crop_id: DEMO_FARM_CROPS[2].id, crop_name: "Tomatoes", harvest_date: "2026-07-12", quantity: 420, unit: "kg", quality_grade: "B", destination: "Mtwapa market", is_demo: true },
];
export const DEMO_SOIL_TESTS = [
  { id: demoId("soil-test", 1), farm_id: DEMO_FARMS[0].id, test_date: "2026-09-10", ph: 6.4, nitrogen: "medium", phosphorus: "medium", potassium: "high", method: "Sample laboratory result", is_demo: true },
  { id: demoId("soil-test", 2), farm_id: DEMO_FARMS[1].id, test_date: "2026-09-18", ph: 6.1, nitrogen: "low", phosphorus: "medium", potassium: "medium", method: "Sample laboratory result", is_demo: true },
];
export const DEMO_FARM_ALERTS = [
  { id: demoId("farm-alert", 1), farm_id: DEMO_FARMS[0].id, title: "Review maize maturity", severity: "info", read: false, is_demo: true },
  { id: demoId("farm-alert", 2), farm_id: DEMO_FARMS[1].id, title: "Inspect tomato leaf health", severity: "medium", read: false, is_demo: true },
  { id: demoId("farm-alert", 3), farm_id: DEMO_FARMS[2].id, title: "Plan next irrigation window", severity: "low", read: true, is_demo: true },
];
export const DEMO_FARM_RECOMMENDATIONS = [
  { id: demoId("recommendation", 1), farm_id: DEMO_FARMS[0].id, title: "Scout maize for fall armyworm", priority: "high", reason: "Routine field scouting example.", is_demo: true },
  { id: demoId("recommendation", 2), farm_id: DEMO_FARMS[1].id, title: "Maintain drip irrigation schedule", priority: "medium", reason: "Keep root-zone moisture consistent.", is_demo: true },
];
export const DEMO_MARKET = [
  { crop: "Maize", market: "Kilifi demo market", price: 55, currency: "KES", unit: "kg", trend: "stable", is_demo: true },
  { crop: "Tomatoes", market: "Mtwapa demo market", price: 82, currency: "KES", unit: "kg", trend: "rising", is_demo: true },
  { crop: "Beans", market: "Wote demo market", price: 118, currency: "KES", unit: "kg", trend: "stable", is_demo: true },
];
export const DEMO_FARM = {
  farmer: DEMO_FARMER, farms: DEMO_FARMS, crops: DEMO_FARM_CROPS,
  dashboard: {
    farms_count: DEMO_FARMS.length, verified_farms: 0, demo_farms: DEMO_FARMS.length,
    crop_count: DEMO_FARM_CROPS.length, active_crops: DEMO_FARM_CROPS.length,
    weather: { temperature: 27, condition: "Partly cloudy", humidity: 68, wind_speed: 12, is_demo: true },
    alerts: DEMO_FARM_ALERTS,
  },
  activities: DEMO_FARM_ACTIVITIES, harvests: DEMO_HARVESTS,
  soil_tests: DEMO_SOIL_TESTS, recommendations: DEMO_FARM_RECOMMENDATIONS,
  market: DEMO_MARKET,
};
export const DEMO_FARM_RIGHTS_QUEUE = [
  { id: demoId("rights-case", 1), farm_id: DEMO_FARMS[0].id, farm_name_snapshot: DEMO_FARMS[0].name, owner_name: DEMO_FARMER.farmer_name, county_snapshot: "Kilifi", town_snapshot: "Mariakani", status: "pending", submitted_at: "2026-10-29T09:00:00.000Z", is_demo: true },
  { id: demoId("rights-case", 2), farm_id: DEMO_FARMS[1].id, farm_name_snapshot: DEMO_FARMS[1].name, owner_name: DEMO_FARMER.farmer_name, county_snapshot: "Kilifi", town_snapshot: "Mtwapa", status: "more_info", submitted_at: "2026-10-30T11:30:00.000Z", is_demo: true },
];
export const DEMO_SHAMBA_SAFETY_REPORTS = [
  { id: demoId("safety-report", 1), listing_id: "demo-listing-001", title: "Sample marketplace listing review", description: "Synthetic safety report for demonstrating administrator review.", status: "open", category: "listing_accuracy", created_at: DEMO_STAMP, is_demo: true },
  { id: demoId("safety-report", 2), listing_id: "demo-listing-002", title: "Sample seller identity query", description: "Synthetic report showing the review workflow.", status: "needs_more_info", category: "seller_identity", created_at: "2026-11-02T10:00:00.000Z", is_demo: true },
];
export const DEMO_SOIL_SERVICE_REQUESTS = [
  { id: demoId("soil-service", 1), farm_id: DEMO_FARMS[0].id, farmer_name: DEMO_FARMER.farmer_name, service_type: "laboratory_soil_test", status: "pending", county: "Kilifi", is_demo: true },
];
export const DEMO_FARM_VERIFICATION_QUEUE = [
  { id: demoId("farmer-review", 1), farmer_id: "demo-farmer-pending-1", farmer_name: "Sample Farmer Pending", county: "Kilifi", verification_status: "pending", is_demo: true },
  { id: demoId("farmer-review", 2), farmer_id: "demo-farmer-info-2", farmer_name: "Sample Farmer — More Information", county: "Mombasa", verification_status: "more_info", is_demo: true },
  { id: demoId("farmer-review", 3), farmer_id: "demo-farmer-reviewed-3", farmer_name: "Sample Farmer Reviewed", county: "Makueni", verification_status: "demo", is_demo: true },
];

export const DEMO_SCHOOL = {
  school: {
    id: "demo-school-1", school_id: "demo-school-1", name: "Jumuiya Demonstration School",
    school_name: "Jumuiya Demonstration School", slug: "jumuiya-demonstration-school",
    school_code: "JDS-DEMO-2026", school_type: "primary", curriculum: "CBC",
    county: "Mombasa", town: "Mombasa", address: "Demo Road, Mombasa",
    phone: "0700000300", email: "office@jumuiya-demo.example.test",
    verification_status: "demo", status: "demo", is_demo: true,
    demo_notice: "DEMO SCHOOL — NOT VERIFIED. Synthetic records for presentation only.",
    academic_year: 2026, current_term: "Term 3",
  },
  dashboard: {
    students_count: DEMO_STUDENTS.length, active_students: DEMO_STUDENTS.filter((x) => x.status === "active").length,
    staff_count: DEMO_STAFF.length, classes_count: DEMO_CLASSES.length,
    attendance_rate: 94, present_today: DEMO_ATTENDANCE.filter((x) => x.status === "present").length,
    outstanding_fees: DEMO_FEES.reduce((sum, x) => sum + x.balance, 0),
    fee_collection: DEMO_FEES.reduce((sum, x) => sum + x.amount_paid, 0),
    assessments_count: DEMO_ASSESSMENTS.length, assignments_count: DEMO_ASSIGNMENTS.length,
  },
  students: DEMO_STUDENTS, classes: DEMO_CLASSES, staff: DEMO_STAFF,
  lessons: DEMO_LESSONS, assignments: DEMO_ASSIGNMENTS, attendance: DEMO_ATTENDANCE,
  assessments: DEMO_ASSESSMENTS, fees: DEMO_FEES, timetable: DEMO_TIMETABLE,
  projects: DEMO_CBC_PROJECTS, events: DEMO_SCHOOL_EVENTS, library: DEMO_SCHOOL_LIBRARY,
};
export const DEMO_SCHOOL_ACCESS = {
  allowed: true, has_school: true, role: "owner",
  school: DEMO_SCHOOL.school,
  membership: { role: "owner", school: DEMO_SCHOOL.school },
  permissions: ["school.view", "school.manage", "students.view", "students.manage", "staff.view", "staff.manage", "classes.view", "classes.manage", "finance.view", "finance.manage", "attendance.view", "assessments.view", "website.view", "website.manage"],
  demo: true, is_demo: true, verification_status: "demo",
};

export const DEMO_STUDY_MATERIALS = [
  {
    id: "demo-study-1", title: "How to Read a Bible Passage in Context",
    category: "Bible Study", topic: "Scripture",
    description: "A practical sample guide to context, audience and meaning.",
    summary: "Observe the passage, understand its setting and compare related Scripture.",
    content: "# Read in context\n\n1. Read the full passage.\n2. Identify the audience and setting.\n3. Notice repeated words and the main idea.\n4. Compare related passages before drawing a conclusion.",
    reading_time: 6, is_published: true, tags: ["Bible study", "context", "reading"],
  },
  {
    id: "demo-study-2", title: "A Simple Guide to Prophecy Symbols",
    category: "Prophecy", topic: "Prophecy",
    description: "A sample introduction to studying symbols with their wider context.",
    summary: "Compare symbols with their scriptural setting and related passages.",
    content: "# Study symbols carefully\n\nRead the whole chapter, note the symbol, compare other passages and record what the text itself explains.",
    reading_time: 5, is_published: true, tags: ["Prophecy", "symbols", "Scripture"],
  },
];
export const DEMO_COMMUNITY_POSTS = [
  { id: "demo-post-1", author: "Jumuiya Neighbourhood", body: "Welcome to the demo community. Share useful updates and local opportunities.", created_at: DEMO_STAMP, reactions_count: 8, comments_count: 2, is_demo: true },
  { id: "demo-post-2", author: "Demo Farmers Circle", body: "Farmers are sharing seasonal tips and market information here.", created_at: "2026-11-03T14:00:00.000Z", reactions_count: 5, comments_count: 1, is_demo: true },
];
export const DEMO_ACCOUNT = {
  profile: { id: "demo-user-1", full_name: "Demo Member", contact: "demo@example.test", role: "guest", verified: false, is_demo: true },
  notifications: [{ id: "demo-notification-1", title: "Welcome to the demo", read: false, is_demo: true }],
  payments: { balance: 0, currency: "KES", transactions: [], demo: true },
};

export const DEMO_PRESENTATION_DATA = {
  mode: "presentation", is_demo: true, persistence: "disabled",
  school: DEMO_SCHOOL, school_access: DEMO_SCHOOL_ACCESS,
  biashara: DEMO_SHOP, shamba: DEMO_FARM,
  notice: "DEMO DATA — synthetic records only; writes and payments are simulated and nothing is saved.",
};

function response(data, extra = {}) {
  return { success: true, ok: true, demo: true, is_demo: true, ...extra, data, ...extra };
}
function listResponse(key, rows, extra = {}) {
  return { success: true, ok: true, demo: true, is_demo: true, [key]: rows, items: rows, data: { [key]: rows, items: rows }, ...extra };
}
function routeKey(path) {
  return path.split("?")[0].replace(/\/+$/, "").toLowerCase();
}

export function getDemoPayload(url = "", method = "GET", body = null) {
  const address = String(url || "");
  const lower = address.toLowerCase();
  const verb = String(method || "GET").toUpperCase();
  const payload = body && typeof body === "string" ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : body || {};

  if (verb !== "GET" && verb !== "HEAD") {
    if (lower.includes("/ai") || lower.endsWith("ai")) {
      const answer = "Demo reply: use the available records to identify one priority, assign an owner and review the result. This sample answer was generated locally.";
      return { success: true, ok: true, demo: true, response: answer, data: { response: answer, hub_used: "general", model: "demo-sample" }, meta: { demo: true, provider: "demo-sample" } };
    }
    return { success: true, ok: true, demo: true, is_demo: true, message: "Demo mode: this action was simulated. Nothing was saved.", data: { id: "demo-action-simulated", status: "simulated", ...payload } };
  }

  if (lower.includes("/ai") || lower.endsWith("ai")) {
    const answer = "Demo reply: use the available records to identify one priority, assign an owner and review the result. This sample answer was generated locally.";
    return { success: true, ok: true, demo: true, response: answer, data: { response: answer, hub_used: "general", model: "demo-sample" }, meta: { demo: true, provider: "demo-sample" } };
  }

  if (lower.includes("/api/study/materials") || lower.includes("study-library") || lower.includes("faith-library")) {
    return listResponse("materials", DEMO_STUDY_MATERIALS);
  }
  if (lower.includes("/community") || lower.includes("/posts") || lower.includes("/chats") || lower.includes("/groups") || lower.includes("/circles")) {
    return listResponse("posts", DEMO_COMMUNITY_POSTS, { comments: [], groups: [{ id: "demo-circle-1", name: "Demo Farmers Circle", members_count: 14, is_demo: true }] });
  }

  if (lower.includes("/api/jumuiya/elimu") || lower.includes("/elimu/") || lower.includes("/school")) {
    const path = routeKey(lower);
    if (path.includes("/access")) return { success: true, demo: true, access: DEMO_SCHOOL_ACCESS, data: { ...DEMO_SCHOOL_ACCESS, access: DEMO_SCHOOL_ACCESS } };
    if (path.endsWith("/school") || path.endsWith("/profile")) return { success: true, demo: true, ...DEMO_SCHOOL, data: { school: DEMO_SCHOOL.school, profile: DEMO_SCHOOL.school } };
    if (path.includes("/students/")) {
      const studentId = path.split("/students/")[1].split("/")[0];
      const student = DEMO_STUDENTS.find((x) => x.id === studentId) || DEMO_STUDENTS[0];
      return { success: true, demo: true, student, data: { student } };
    }
    if (path.endsWith("/students")) return listResponse("students", DEMO_STUDENTS, { total: DEMO_STUDENTS.length, count: DEMO_STUDENTS.length });
    if (path.endsWith("/classes")) return listResponse("classes", DEMO_CLASSES);
    if (path.endsWith("/staff") || path.endsWith("/teachers")) return listResponse("staff", DEMO_STAFF);
    if (path.endsWith("/lessons")) return listResponse("lessons", DEMO_LESSONS);
    if (path.endsWith("/assignments")) return listResponse("assignments", DEMO_ASSIGNMENTS);
    if (path.endsWith("/attendance")) return listResponse("attendance", DEMO_ATTENDANCE);
    if (path.endsWith("/assessments")) return listResponse("assessments", DEMO_ASSESSMENTS);
    if (path.endsWith("/fees") || path.includes("/fee-status") || path.includes("/receipts")) return listResponse("fees", DEMO_FEES);
    if (path.includes("/timetable")) return listResponse("timetable", DEMO_TIMETABLE);
    if (path.includes("/cbc/projects")) return listResponse("projects", DEMO_CBC_PROJECTS);
    if (path.endsWith("/events") || path.endsWith("/calendar")) return listResponse("events", DEMO_SCHOOL_EVENTS);
    if (path.includes("/library")) return listResponse("books", DEMO_SCHOOL_LIBRARY);
    if (path.endsWith("/dashboard") || path.endsWith("/bootstrap")) return { success: true, demo: true, ...DEMO_SCHOOL, dashboard: DEMO_SCHOOL.dashboard, data: { ...DEMO_SCHOOL, dashboard: DEMO_SCHOOL.dashboard } };
    return { success: true, demo: true, ...DEMO_SCHOOL, data: { school: DEMO_SCHOOL.school, dashboard: DEMO_SCHOOL.dashboard } };
  }

  if (lower.includes("/api/jumuiya/shamba") || lower.includes("/shamba/") || lower.includes("/farm")) {
    const path = routeKey(lower);
    if (path.includes("/farmer/verification-queue")) return listResponse("items", DEMO_FARM_VERIFICATION_QUEUE);
    if (path.endsWith("/trust/overview")) return { success: true, demo: true, overview: { farms: DEMO_FARMS, farm_count: DEMO_FARMS.length, verified_farm_count: 0, pending_farm_count: DEMO_FARM_RIGHTS_QUEUE.length, is_demo: true }, data: { overview: { farms: DEMO_FARMS, farm_count: DEMO_FARMS.length, verified_farm_count: 0, pending_farm_count: DEMO_FARM_RIGHTS_QUEUE.length, is_demo: true } } };
    if (path.endsWith("/trust/verification-queue")) return listResponse("items", DEMO_FARM_RIGHTS_QUEUE);
    if (path.endsWith("/trust/safety-reports")) return listResponse("items", DEMO_SHAMBA_SAFETY_REPORTS);
    if (path.endsWith("/trust/soil-service-requests")) return listResponse("items", DEMO_SOIL_SERVICE_REQUESTS);
    if (path.endsWith("/farmer")) return { success: true, demo: true, farmer: DEMO_FARMER, data: { farmer: DEMO_FARMER } };
    if (path.endsWith("/dashboard")) return { success: true, demo: true, ...DEMO_FARM, data: DEMO_FARM.dashboard };
    if (path.includes("/weather")) return { success: true, demo: true, weather: DEMO_FARM.dashboard.weather, data: { weather: DEMO_FARM.dashboard.weather } };
    if (path.includes("/market")) return listResponse("market", DEMO_MARKET);
    if (path.includes("/soil-tests")) return listResponse("soil_tests", DEMO_SOIL_TESTS);
    if (path.includes("/harvests")) return listResponse("harvests", DEMO_HARVESTS);
    if (path.includes("/activities")) return listResponse("activities", DEMO_FARM_ACTIVITIES);
    if (path.includes("/recommendations")) return listResponse("recommendations", DEMO_FARM_RECOMMENDATIONS);
    if (path.includes("/alerts")) return listResponse("alerts", DEMO_FARM_ALERTS);
    if (path.includes("/crops")) return listResponse("crops", DEMO_FARM_CROPS);
    if (path.endsWith("/farms")) return listResponse("farms", DEMO_FARMS);
    if (path.includes("/insights") || path.includes("/command-center") || path.includes("/ai-context")) return { success: true, demo: true, insights: { summary: "Sample farm insights for presentation.", crop_health: "Review field observations weekly.", is_demo: true }, data: { farm: DEMO_FARMS[0], crops: DEMO_FARM_CROPS, recommendations: DEMO_FARM_RECOMMENDATIONS } };
    return { success: true, demo: true, ...DEMO_FARM, data: DEMO_FARM.dashboard };
  }

  if (lower.includes("/api/jumuiya/biashara") || lower.includes("/biashara/") || lower.includes("/business")) {
    const path = routeKey(lower);
    if (path.endsWith("/business")) return { success: true, demo: true, business: DEMO_SAMPLE_BUSINESS, data: { business: DEMO_SAMPLE_BUSINESS } };
    if (path.includes("/inventory/low-stock")) return listResponse("products", DEMO_SHOP.dashboard.low_stock_products);
    if (path.includes("/inventory/history")) return listResponse("history", DEMO_SHOP.finance.transactions);
    if (path.includes("/products") || path.includes("/inventory")) return listResponse("products", DEMO_PRODUCTS);
    if (path.includes("/services")) return listResponse("services", DEMO_SERVICES);
    if (path.includes("/orders")) return listResponse("orders", DEMO_ORDERS);
    if (path.includes("/customers")) return listResponse("customers", DEMO_CUSTOMERS);
    if (path.includes("/sales")) return listResponse("sales", DEMO_SALES);
    if (path.includes("/expenses") || path.includes("/finance") || path.includes("/cashbook") || path.includes("/transactions") || path.includes("/invoices")) return { success: true, demo: true, ...DEMO_SHOP.finance, data: { ...DEMO_SHOP.finance } };
    if (path.includes("/website")) return { success: true, demo: true, website: DEMO_SHOP.website, inquiries: DEMO_SHOP.website.inquiries, data: { website: DEMO_SHOP.website, inquiries: DEMO_SHOP.website.inquiries } };
    if (path.includes("/dashboard") || path.includes("/analytics") || path.includes("/intelligence")) return { success: true, demo: true, ...DEMO_SHOP, data: DEMO_SHOP.dashboard };
    if (path.includes("/factory") || path.includes("/production")) return listResponse("batches", DEMO_FACTORY_BATCHES);
    if (path.includes("/hr") || path.includes("/team") || path.includes("/employees")) return listResponse("employees", DEMO_BUSINESS_STAFF);
    return { success: true, demo: true, ...DEMO_SHOP, data: { business: DEMO_SAMPLE_BUSINESS } };
  }

  if (lower.includes("/payment") || lower.includes("/wallet") || lower.includes("/notification") || lower.includes("/profile") || lower.includes("/account")) {
    return { success: true, demo: true, ...DEMO_ACCOUNT, data: DEMO_ACCOUNT };
  }
  return { success: true, demo: true, is_demo: true, data: { items: [], message: "Demo sample data" } };
}
