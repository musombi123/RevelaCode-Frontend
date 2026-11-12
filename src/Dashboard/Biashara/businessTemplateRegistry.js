export const BIASHARA_TEMPLATES = Object.freeze({
  general: {
    key: "general",
    label: "General business",
    description: "A flexible workspace for day-to-day operations.",
    routes: ["sales", "orders", "products", "customers", "finance", "team", "website", "automations", "sync", "biashara-analytics"],
  },
  retail_shop: {
    key: "retail_shop",
    label: "Retail shop",
    description: "Sales, catalogue, customers, stock and supplier operations.",
    routes: ["sales", "orders", "products", "customers", "finance", "team", "website", "automations", "sync", "biashara-analytics"],
  },
  hardware: {
    key: "hardware",
    label: "Hardware",
    description: "Product and material catalogue, quotations, inventory and procurement.",
    routes: ["sales", "orders", "products", "customers", "services", "finance", "team", "website", "automations", "sync", "biashara-analytics"],
  },
  factory: {
    key: "factory",
    label: "Factory and manufacturing",
    description: "Production batches, materials, quality checks and machine operations.",
    routes: ["sales", "orders", "products", "factory", "customers", "finance", "hr", "team", "website", "automations", "sync", "biashara-analytics"],
  },
  salon: {
    key: "salon",
    label: "Salon and service business",
    description: "Services, customer records, sales and business operations.",
    routes: ["sales", "orders", "services", "customers", "products", "finance", "hr", "team", "website", "automations", "sync", "biashara-analytics"],
  },
  professional_services: {
    key: "professional_services",
    label: "Professional services",
    description: "Customer work, invoices, projects and service delivery.",
    routes: ["sales", "orders", "services", "customers", "finance", "hr", "team", "website", "automations", "sync", "biashara-analytics"],
  },
  school: {
    key: "school",
    label: "School business",
    description: "A school-operated business workspace. It remains in Biashara.",
    routes: ["sales", "orders", "products", "customers", "finance", "hr", "team", "website", "automations", "sync", "biashara-analytics"],
  },
});

export const BIASHARA_TEMPLATE_OPTIONS = Object.freeze(
  Object.values(BIASHARA_TEMPLATES).map(({ key, label }) => ({ value: key, label }))
);

export function getBiasharaTemplate(value) {
  const key = String(value || "general").trim().toLowerCase();
  return BIASHARA_TEMPLATES[key] || BIASHARA_TEMPLATES.general;
}

export function getBiasharaTemplateRoutes(value) {
  return [...getBiasharaTemplate(value).routes];
}
