const CRM_STORAGE_KEY = "crmDashboardWorkspace";

const CRM_STAGES = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const CRM_STATUSES = ["Lead", "Prospect", "Customer", "Inactive"];
const CRM_ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Demo", "Follow-up", "Task"];
const CRM_OWNERS = ["Fazal Abbas", "Amina Shah", "Danish Malik", "Sara Iqbal"];

const defaultWorkspace = {
    settings: {
        crmName: "NightCity CRM",
        adminEmail: "admin@example.com",
        currency: "PKR",
        defaultStage: "New",
        darkMode: true,
        compactSidebar: false
    },
    customers: [],
    companies: [],
    deals: [],
    activities: [],
    activityLog: []
};

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(dateString) {
    if (!dateString) return "Not set";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value) {
    const workspace = loadWorkspace();
    const currency = workspace.settings.currency || "PKR";
    return new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency,
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function loadWorkspace() {
    const stored = localStorage.getItem(CRM_STORAGE_KEY);

    if (!stored) {
        const seeded = seedDemoData();
        saveWorkspace(seeded);
        return seeded;
    }

    try {
        const parsed = JSON.parse(stored);
        return {
            ...structuredClone(defaultWorkspace),
            ...parsed,
            settings: {
                ...defaultWorkspace.settings,
                ...(parsed.settings || {})
            },
            customers: parsed.customers || [],
            companies: parsed.companies || [],
            deals: parsed.deals || [],
            activities: parsed.activities || [],
            activityLog: parsed.activityLog || []
        };
    } catch (error) {
        console.error("Workspace could not be parsed. Resetting demo data.", error);
        const seeded = seedDemoData();
        saveWorkspace(seeded);
        return seeded;
    }
}

function saveWorkspace(workspace) {
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(workspace));
}

function resetWorkspace() {
    const workspace = seedDemoData();
    saveWorkspace(workspace);
    applyThemeSettings();
    return workspace;
}

function seedDemoData() {
    const now = new Date();
    const today = getTodayDate();
    const dateForDay = function (dayOffset) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
        return date.toISOString().slice(0, 10);
    };

    const companies = [
        { id: "company-technova", name: "TechNova Solutions", industry: "Software", size: "51-200", website: "https://technova.example.com", city: "Karachi", createdAt: "2026-01-08", updatedAt: "2026-02-14" },
        { id: "company-raheel", name: "Raheel Traders", industry: "Retail", size: "11-50", website: "https://raheeltraders.example.com", city: "Lahore", createdAt: "2026-01-19", updatedAt: "2026-03-01" },
        { id: "company-civicconnect", name: "CivicConnect Labs", industry: "Government Tech", size: "11-50", website: "https://civicconnect.example.com", city: "Islamabad", createdAt: "2026-02-02", updatedAt: "2026-03-15" },
        { id: "company-nightcity", name: "NightCity Systems", industry: "Cybersecurity", size: "201-500", website: "https://nightcity.example.com", city: "Karachi", createdAt: "2026-02-21", updatedAt: "2026-04-02" },
        { id: "company-dataforge", name: "DataForge Studio", industry: "Analytics", size: "1-10", website: "https://dataforge.example.com", city: "Rawalpindi", createdAt: "2026-03-04", updatedAt: "2026-04-20" },
        { id: "company-pixelcraft", name: "PixelCraft Agency", industry: "Marketing", size: "11-50", website: "https://pixelcraft.example.com", city: "Karachi", createdAt: "2026-03-26", updatedAt: "2026-05-05" }
    ];

    const customers = [
        { id: "customer-ali", firstName: "Ali", lastName: "Raza", email: "ali@example.com", phone: "+92-300-1234567", companyId: "company-technova", owner: "Fazal Abbas", status: "Lead", createdAt: "2026-01-10", updatedAt: "2026-03-14" },
        { id: "customer-sana", firstName: "Sana", lastName: "Akhtar", email: "sana@example.com", phone: "+92-321-7788990", companyId: "company-raheel", owner: "Amina Shah", status: "Prospect", createdAt: "2026-01-22", updatedAt: "2026-03-17" },
        { id: "customer-moiz", firstName: "Abdul", lastName: "Moiz", email: "moiz@example.com", phone: "+92-333-4455667", companyId: "company-civicconnect", owner: "Danish Malik", status: "Customer", createdAt: "2026-02-06", updatedAt: "2026-04-02" },
        { id: "customer-ayesha", firstName: "Ayesha", lastName: "Khan", email: "ayesha@example.com", phone: "+92-302-5522110", companyId: "company-nightcity", owner: "Sara Iqbal", status: "Customer", createdAt: "2026-02-18", updatedAt: "2026-04-12" },
        { id: "customer-bilal", firstName: "Bilal", lastName: "Ahmed", email: "bilal@example.com", phone: "+92-315-9054412", companyId: "company-dataforge", owner: "Fazal Abbas", status: "Prospect", createdAt: "2026-03-03", updatedAt: "2026-05-01" },
        { id: "customer-hamza", firstName: "Hamza", lastName: "Siddiqui", email: "hamza@example.com", phone: "+92-301-8877665", companyId: "company-pixelcraft", owner: "Amina Shah", status: "Lead", createdAt: "2026-03-14", updatedAt: "2026-05-08" },
        { id: "customer-mariam", firstName: "Mariam", lastName: "Noor", email: "mariam@example.com", phone: "+92-345-1112233", companyId: "company-technova", owner: "Danish Malik", status: "Inactive", createdAt: "2026-04-01", updatedAt: "2026-05-20" },
        { id: "customer-usman", firstName: "Usman", lastName: "Tariq", email: "usman@example.com", phone: "+92-322-4433221", companyId: "company-nightcity", owner: "Sara Iqbal", status: "Customer", createdAt: "2026-04-18", updatedAt: "2026-06-02" }
    ];

    const deals = [
        { id: "deal-redesign", title: "Website redesign project", customerId: "customer-ali", companyId: "company-technova", owner: "Fazal Abbas", stage: "Proposal", value: 250000, probability: 60, expectedCloseDate: dateForDay(9), createdAt: "2026-02-02", updatedAt: "2026-06-18" },
        { id: "deal-pos", title: "Inventory POS rollout", customerId: "customer-sana", companyId: "company-raheel", owner: "Amina Shah", stage: "Negotiation", value: 620000, probability: 72, expectedCloseDate: dateForDay(14), createdAt: "2026-02-15", updatedAt: "2026-06-25" },
        { id: "deal-crm", title: "CRM implementation", customerId: "customer-moiz", companyId: "company-civicconnect", owner: "Danish Malik", stage: "Won", value: 900000, probability: 100, expectedCloseDate: dateForDay(-18), createdAt: "2026-03-01", updatedAt: "2026-06-09" },
        { id: "deal-mobile", title: "Mobile app prototype", customerId: "customer-ayesha", companyId: "company-nightcity", owner: "Sara Iqbal", stage: "Qualified", value: 180000, probability: 45, expectedCloseDate: dateForDay(22), createdAt: "2026-03-11", updatedAt: "2026-06-16" },
        { id: "deal-analytics", title: "Analytics dashboard setup", customerId: "customer-bilal", companyId: "company-dataforge", owner: "Fazal Abbas", stage: "New", value: 120000, probability: 25, expectedCloseDate: dateForDay(30), createdAt: "2026-04-04", updatedAt: "2026-06-21" },
        { id: "deal-support", title: "Support contract renewal", customerId: "customer-hamza", companyId: "company-pixelcraft", owner: "Amina Shah", stage: "Won", value: 50000, probability: 100, expectedCloseDate: dateForDay(-8), createdAt: "2026-04-17", updatedAt: "2026-06-27" },
        { id: "deal-security", title: "Security audit package", customerId: "customer-usman", companyId: "company-nightcity", owner: "Sara Iqbal", stage: "Proposal", value: 440000, probability: 58, expectedCloseDate: dateForDay(16), createdAt: "2026-05-02", updatedAt: "2026-06-22" },
        { id: "deal-data-mart", title: "Customer data mart", customerId: "customer-mariam", companyId: "company-technova", owner: "Danish Malik", stage: "Lost", value: 700000, probability: 0, expectedCloseDate: dateForDay(-20), createdAt: "2026-05-10", updatedAt: "2026-06-12" },
        { id: "deal-brand", title: "Brand campaign dashboard", customerId: "customer-hamza", companyId: "company-pixelcraft", owner: "Amina Shah", stage: "Qualified", value: 315000, probability: 50, expectedCloseDate: dateForDay(19), createdAt: "2026-05-18", updatedAt: "2026-06-26" },
        { id: "deal-cloud", title: "Cloud migration assessment", customerId: "customer-ali", companyId: "company-technova", owner: "Fazal Abbas", stage: "Negotiation", value: 830000, probability: 80, expectedCloseDate: dateForDay(12), createdAt: "2026-06-01", updatedAt: "2026-06-30" }
    ];

    const activities = [
        { id: "activity-1", title: "Follow up call", type: "Call", relatedType: "Deal", relatedId: "deal-redesign", status: "Scheduled", dueDate: dateForDay(1), notes: "Confirm revised homepage scope.", createdAt: "2026-06-22", updatedAt: "2026-06-22" },
        { id: "activity-2", title: "Send proposal deck", type: "Email", relatedType: "Deal", relatedId: "deal-pos", status: "Scheduled", dueDate: dateForDay(2), notes: "Include pricing tiers and rollout calendar.", createdAt: "2026-06-23", updatedAt: "2026-06-23" },
        { id: "activity-3", title: "Implementation review", type: "Meeting", relatedType: "Company", relatedId: "company-civicconnect", status: "Completed", dueDate: dateForDay(-4), notes: "Reviewed CRM launch outcomes.", createdAt: "2026-06-15", updatedAt: "2026-06-29" },
        { id: "activity-4", title: "Prototype demo", type: "Demo", relatedType: "Deal", relatedId: "deal-mobile", status: "Scheduled", dueDate: dateForDay(6), notes: "Show onboarding and reporting screens.", createdAt: "2026-06-21", updatedAt: "2026-06-21" },
        { id: "activity-5", title: "Renewal paperwork", type: "Task", relatedType: "Deal", relatedId: "deal-support", status: "Completed", dueDate: dateForDay(-2), notes: "Contract signed and archived.", createdAt: "2026-06-20", updatedAt: "2026-07-01" },
        { id: "activity-6", title: "Discovery call", type: "Call", relatedType: "Customer", relatedId: "customer-bilal", status: "Overdue", dueDate: dateForDay(-1), notes: "Needs analytics requirements follow-up.", createdAt: "2026-06-19", updatedAt: "2026-06-19" },
        { id: "activity-7", title: "Security checklist", type: "Task", relatedType: "Deal", relatedId: "deal-security", status: "Scheduled", dueDate: dateForDay(8), notes: "Prepare compliance questions.", createdAt: "2026-06-26", updatedAt: "2026-06-26" },
        { id: "activity-8", title: "Campaign KPI meeting", type: "Meeting", relatedType: "Deal", relatedId: "deal-brand", status: "Scheduled", dueDate: dateForDay(11), notes: "Align on lead source reporting.", createdAt: "2026-06-27", updatedAt: "2026-06-27" },
        { id: "activity-9", title: "Cloud migration workshop", type: "Demo", relatedType: "Deal", relatedId: "deal-cloud", status: "Scheduled", dueDate: dateForDay(4), notes: "Walk through migration risk map.", createdAt: "2026-06-28", updatedAt: "2026-06-28" },
        { id: "activity-10", title: "Lost deal review", type: "Follow-up", relatedType: "Deal", relatedId: "deal-data-mart", status: "Completed", dueDate: dateForDay(-12), notes: "Budget freeze noted for next quarter.", createdAt: "2026-06-10", updatedAt: "2026-06-18" },
        { id: "activity-11", title: "Owner handoff", type: "Email", relatedType: "Customer", relatedId: "customer-mariam", status: "Scheduled", dueDate: dateForDay(15), notes: "Reconnect with revised reporting offer.", createdAt: "2026-06-29", updatedAt: "2026-06-29" },
        { id: "activity-12", title: "Pipeline clean-up", type: "Task", relatedType: "Company", relatedId: "company-technova", status: "Scheduled", dueDate: today, notes: "Check open TechNova opportunities.", createdAt: "2026-07-01", updatedAt: "2026-07-01" }
    ];

    const activityLog = [
        { id: "log-1", module: "Deals", action: "Created deal", detail: "Created deal Website redesign project", createdAt: "2026-06-18" },
        { id: "log-2", module: "Deals", action: "Updated stage", detail: "Moved Inventory POS rollout to Negotiation", createdAt: "2026-06-25" },
        { id: "log-3", module: "Activities", action: "Completed activity", detail: "Completed Renewal paperwork", createdAt: "2026-07-01" },
        { id: "log-4", module: "Customers", action: "Updated customer", detail: "Updated Ayesha Khan status to Customer", createdAt: "2026-06-22" },
        { id: "log-5", module: "Companies", action: "Created company", detail: "Added PixelCraft Agency", createdAt: "2026-05-05" },
        { id: "log-6", module: "Deals", action: "Won deal", detail: "Won CRM implementation", createdAt: "2026-06-09" }
    ];

    return {
        settings: structuredClone(defaultWorkspace.settings),
        customers,
        companies,
        deals,
        activities,
        activityLog
    };
}

function addActivityLog(module, action, detail) {
    const workspace = loadWorkspace();
    workspace.activityLog.unshift({
        id: generateId("log"),
        module,
        action,
        detail,
        createdAt: getTodayDate()
    });
    workspace.activityLog = workspace.activityLog.slice(0, 60);
    saveWorkspace(workspace);
}

function getCustomerName(workspace, customerId) {
    const customer = workspace.customers.find((item) => item.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : "Unassigned";
}

function getCompanyName(workspace, companyId) {
    const company = workspace.companies.find((item) => item.id === companyId);
    return company ? company.name : "Unassigned";
}

function getDealTitle(workspace, dealId) {
    const deal = workspace.deals.find((item) => item.id === dealId);
    return deal ? deal.title : "Unassigned";
}

function calculatePipelineValue(deals) {
    return deals
        .filter((deal) => deal.stage !== "Lost")
        .reduce((total, deal) => total + Number(deal.value || 0), 0);
}

function calculateWonValue(deals) {
    return deals
        .filter((deal) => deal.stage === "Won")
        .reduce((total, deal) => total + Number(deal.value || 0), 0);
}

function calculateForecastValue(deals) {
    return deals
        .filter((deal) => !["Won", "Lost"].includes(deal.stage))
        .reduce((total, deal) => total + (Number(deal.value || 0) * Number(deal.probability || 0)) / 100, 0);
}

function calculateStageCounts(deals) {
    return CRM_STAGES.reduce((counts, stage) => {
        counts[stage] = deals.filter((deal) => deal.stage === stage).length;
        return counts;
    }, {});
}

function calculateStageValues(deals) {
    return CRM_STAGES.reduce((values, stage) => {
        values[stage] = deals
            .filter((deal) => deal.stage === stage)
            .reduce((total, deal) => total + Number(deal.value || 0), 0);
        return values;
    }, {});
}

function renderSidebar(activePage) {
    const workspace = loadWorkspace();
    const navItems = [
        ["index.html", "Dashboard", "bi-grid-1x2-fill", "dashboard"],
        ["customers.html", "Customers", "bi-people-fill", "customers"],
        ["companies.html", "Companies", "bi-buildings-fill", "companies"],
        ["deals.html", "Deals", "bi-cash-coin", "deals"],
        ["activities.html", "Activities", "bi-check2-square", "activities"],
        ["calendar.html", "Calendar", "bi-calendar3", "calendar"],
        ["pipeline.html", "Pipeline", "bi-kanban-fill", "pipeline"],
        ["analytics.html", "Analytics", "bi-bar-chart-fill", "analytics"],
        ["settings.html", "Settings", "bi-gear-fill", "settings"]
    ];

    const links = navItems.map(([href, label, icon, key]) => `
    <a class="nav-link ${activePage === key ? "active" : ""}" href="${href}" data-page="${key}">
      <span class="nav-icon"><i class="bi ${icon}"></i></span>
      <span class="nav-label">${label}</span>
    </a>
  `).join("");

    return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-mark">NC</span>
        <span class="brand-text">
          <span class="brand-title">${escapeHtml(workspace.settings.crmName)}</span>
          <span class="brand-subtitle">Enterprise sales workspace</span>
        </span>
      </div>
      <nav class="sidebar-nav">${links}</nav>
      <div class="sidebar-footer">
        <strong>Local workspace</strong><br>
        Browser-only CRM data saved in localStorage.
      </div>
    </aside>
  `;
}

function setActiveNav() {
    const pageName = window.location.pathname.split("/").pop() || "index.html";
    $(".nav-link").removeClass("active");
    $(`.nav-link[href="${pageName}"]`).addClass("active");
}

function showStatus(message, type) {
    $(".status-toast").remove();

    const toast = $(`
    <div class="status-toast ${escapeHtml(type || "success")}">
      ${escapeHtml(message)}
    </div>
  `);

    $("body").append(toast);
    setTimeout(() => toast.fadeOut(180, function () {
        $(this).remove();
    }), 2600);
}

function renderEmptyState(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function copyText(text, message) {
    if (!navigator.clipboard) {
        showStatus("Clipboard API is not available in this browser.", "warning");
        return;
    }

    navigator.clipboard.writeText(text).then(
        () => showStatus(message || "Copied to clipboard.", "success"),
        () => showStatus("Could not copy text.", "danger")
    );
}

function applyThemeSettings() {
    const workspace = loadWorkspace();
    $("body").toggleClass("light-mode", !workspace.settings.darkMode);
    $("body").toggleClass("compact-sidebar", Boolean(workspace.settings.compactSidebar));
}

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getRelatedLabel(workspace, relatedType, relatedId) {
    if (relatedType === "Customer") return getCustomerName(workspace, relatedId);
    if (relatedType === "Company") return getCompanyName(workspace, relatedId);
    if (relatedType === "Deal") return getDealTitle(workspace, relatedId);
    return "Unassigned";
}

function buildAppShell(activePage, mainHtml) {
    return `
    <div class="app-shell">
      ${renderSidebar(activePage)}
      <main class="main-content">
        ${mainHtml}
      </main>
    </div>
  `;
}

function bindSharedUi() {
    $(document).on("click", ".mobile-nav-toggle", function () {
        $("body").toggleClass("nav-open");
    });

    $(document).on("click", ".sidebar .nav-link", function () {
        $("body").removeClass("nav-open");
    });
}

$(function () {
    loadWorkspace();
    applyThemeSettings();
    bindSharedUi();
    setActiveNav();
});