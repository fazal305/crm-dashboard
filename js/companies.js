// js/companies.js
let editingCompanyId = null;

const CRM_INDUSTRIES = ["Software", "Retail", "Government Tech", "Cybersecurity", "Analytics", "Marketing", "Finance", "Healthcare"];
const CRM_COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

function calculateCompanyDealValue(companyId) {
    const workspace = loadWorkspace();

    return workspace.deals
        .filter((deal) => deal.companyId === companyId)
        .filter((deal) => deal.stage !== "Lost")
        .reduce((total, deal) => total + Number(deal.value || 0), 0);
}

function loadCompanyFormOptions() {
    $("#companyIndustry, #filterIndustry").each(function () {
        const isFilter = this.id === "filterIndustry";
        $(this).html(`
      <option value="">${isFilter ? "All industries" : "Select industry"}</option>
      ${CRM_INDUSTRIES.map((industry) => `<option value="${escapeHtml(industry)}">${escapeHtml(industry)}</option>`).join("")}
    `);
    });

    $("#companySize, #filterSize").each(function () {
        const isFilter = this.id === "filterSize";
        $(this).html(`
      <option value="">${isFilter ? "All sizes" : "Select size"}</option>
      ${CRM_COMPANY_SIZES.map((size) => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`).join("")}
    `);
    });
}

function getCompanyFormData() {
    return {
        name: $("#companyName").val().trim(),
        industry: $("#companyIndustry").val(),
        size: $("#companySize").val(),
        website: $("#companyWebsite").val().trim(),
        city: $("#companyCity").val().trim()
    };
}

function clearCompanyForm() {
    editingCompanyId = null;
    $("#companyForm")[0].reset();
    $("#companyFormTitle").text("Add company");
    $("#companySubmitLabel").text("Create company");
    $("#cancelCompanyEdit").addClass("d-none");
}

function createCompany() {
    const workspace = loadWorkspace();
    const data = getCompanyFormData();

    if (!data.name || !data.industry || !data.size || !data.city) {
        showStatus("Please fill company name, industry, size, and city.", "warning");
        return;
    }

    if (editingCompanyId) {
        const company = workspace.companies.find((item) => item.id === editingCompanyId);
        if (!company) return;

        Object.assign(company, data, { updatedAt: getTodayDate() });
        saveWorkspace(workspace);
        addActivityLog("Companies", "Updated company", `Updated company ${data.name}`);
        showStatus("Company updated.", "success");
    } else {
        const company = {
            id: generateId("company"),
            ...data,
            createdAt: getTodayDate(),
            updatedAt: getTodayDate()
        };

        workspace.companies.unshift(company);
        saveWorkspace(workspace);
        addActivityLog("Companies", "Created company", `Created company ${data.name}`);
        showStatus("Company created.", "success");
    }

    clearCompanyForm();
    renderCompanies();
}

function editCompany(id) {
    const workspace = loadWorkspace();
    const company = workspace.companies.find((item) => item.id === id);

    if (!company) {
        showStatus("Company not found.", "danger");
        return;
    }

    editingCompanyId = id;
    $("#companyName").val(company.name);
    $("#companyIndustry").val(company.industry);
    $("#companySize").val(company.size);
    $("#companyWebsite").val(company.website);
    $("#companyCity").val(company.city);
    $("#companyFormTitle").text("Edit company");
    $("#companySubmitLabel").text("Save changes");
    $("#cancelCompanyEdit").removeClass("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteCompany(id) {
    const workspace = loadWorkspace();
    const company = workspace.companies.find((item) => item.id === id);

    if (!company) return;

    const linkedCustomers = workspace.customers.some((customer) => customer.companyId === id);
    const linkedDeals = workspace.deals.some((deal) => deal.companyId === id);

    if (linkedCustomers || linkedDeals) {
        showStatus("This company is linked to customers or deals. Reassign them first.", "warning");
        return;
    }

    workspace.companies = workspace.companies.filter((item) => item.id !== id);

    workspace.activities = workspace.activities.map((activity) => {
        if (activity.relatedType === "Company" && activity.relatedId === id) {
            return { ...activity, relatedId: "", updatedAt: getTodayDate() };
        }
        return activity;
    });

    saveWorkspace(workspace);
    addActivityLog("Companies", "Deleted company", `Deleted company ${company.name}`);
    showStatus("Company deleted.", "success");
    renderCompanies();
}

function filterCompanies() {
    const workspace = loadWorkspace();
    const search = $("#companySearch").val().toLowerCase().trim();
    const industry = $("#filterIndustry").val();
    const size = $("#filterSize").val();

    return workspace.companies.filter((company) => {
        const matchesSearch = !search ||
            company.name.toLowerCase().includes(search) ||
            company.city.toLowerCase().includes(search) ||
            company.website.toLowerCase().includes(search);

        const matchesIndustry = !industry || company.industry === industry;
        const matchesSize = !size || company.size === size;

        return matchesSearch && matchesIndustry && matchesSize;
    });
}

function renderCompanyInsights() {
    const workspace = loadWorkspace();
    const totalValue = workspace.companies.reduce((sum, company) => sum + calculateCompanyDealValue(company.id), 0);
    const topCompany = [...workspace.companies]
        .sort((a, b) => calculateCompanyDealValue(b.id) - calculateCompanyDealValue(a.id))[0];

    $("#companyInsights").html(`
    <div class="company-insight-card">
      <span>Total companies</span>
      <strong>${workspace.companies.length}</strong>
    </div>
    <div class="company-insight-card">
      <span>Open account value</span>
      <strong>${formatCurrency(totalValue)}</strong>
    </div>
    <div class="company-insight-card">
      <span>Top account</span>
      <strong>${topCompany ? escapeHtml(topCompany.name) : "None"}</strong>
    </div>
  `);
}

function renderCompanies() {
    const workspace = loadWorkspace();
    const companies = filterCompanies();

    renderCompanyInsights();
    $("#companyCount").text(`${companies.length} shown`);

    if (!companies.length) {
        $("#companiesTableBody").html(`
      <tr>
        <td colspan="8">${renderEmptyState("No companies match your filters.")}</td>
      </tr>
    `);
        return;
    }

    $("#companiesTableBody").html(companies.map((company) => {
        const relatedCustomers = workspace.customers.filter((customer) => customer.companyId === company.id).length;
        const dealValue = calculateCompanyDealValue(company.id);

        return `
      <tr>
        <td>
          <div class="company-name">${escapeHtml(company.name)}</div>
          <div class="company-city">${escapeHtml(company.city)}</div>
        </td>
        <td><span class="badge-soft">${escapeHtml(company.industry)}</span></td>
        <td>${escapeHtml(company.size)}</td>
        <td>
          ${company.website
                ? `<a class="website-link" href="${escapeHtml(company.website)}" target="_blank" rel="noreferrer">${escapeHtml(company.website)}</a>`
                : "Not set"}
        </td>
        <td>${escapeHtml(company.city)}</td>
        <td>${relatedCustomers}</td>
        <td class="deal-value">${formatCurrency(dealValue)}</td>
        <td>
          <div class="action-row">
            <button class="btn btn-sm btn-ghost icon-btn edit-company" data-id="${escapeHtml(company.id)}" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger icon-btn delete-company" data-id="${escapeHtml(company.id)}" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join(""));
}

function renderCompaniesShell() {
    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Account management</div>
        <h1 class="page-title">Companies</h1>
        <p class="page-description">
          Track company accounts, industries, account size, customer relationships, and open deal value.
        </p>
      </div>
      <div class="topbar-actions">
        <a class="btn btn-ghost" href="customers.html"><i class="bi bi-people me-1"></i> Customers</a>
        <a class="btn btn-primary" href="deals.html"><i class="bi bi-plus-lg me-1"></i> New deal</a>
      </div>
    </div>

    <section class="company-card-grid" id="companyInsights"></section>

    <section class="company-layout">
      <aside class="form-panel panel">
        <div class="form-header">
          <div>
            <h2 class="panel-title" id="companyFormTitle">Add company</h2>
            <p class="panel-subtitle">Create accounts and classify them by industry and size.</p>
          </div>
        </div>

        <form id="companyForm">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="companyName">Company name</label>
              <input class="form-control" id="companyName" required>
            </div>
            <div class="col-12">
              <label class="form-label" for="companyIndustry">Industry</label>
              <select class="form-select" id="companyIndustry" required></select>
            </div>
            <div class="col-12">
              <label class="form-label" for="companySize">Company size</label>
              <select class="form-select" id="companySize" required></select>
            </div>
            <div class="col-12">
              <label class="form-label" for="companyWebsite">Website</label>
              <input class="form-control" id="companyWebsite" placeholder="https://example.com">
            </div>
            <div class="col-12">
              <label class="form-label" for="companyCity">City</label>
              <input class="form-control" id="companyCity" required>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 mt-4">
            <button class="btn btn-primary" type="submit">
              <i class="bi bi-save me-1"></i> <span id="companySubmitLabel">Create company</span>
            </button>
            <button class="btn btn-ghost d-none" id="cancelCompanyEdit" type="button">Cancel</button>
          </div>
        </form>
      </aside>

      <section class="table-panel panel">
        <div class="table-header">
          <div>
            <h2 class="panel-title">Company records</h2>
            <p class="panel-subtitle">Search companies and inspect related customer count.</p>
          </div>
          <span class="badge-soft" id="companyCount">0 shown</span>
        </div>

        <div class="filter-bar">
          <input class="form-control" id="companySearch" placeholder="Search company, city, website">
          <select class="form-select" id="filterIndustry"></select>
          <select class="form-select" id="filterSize"></select>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th>Size</th>
                <th>Website</th>
                <th>City</th>
                <th>Customers</th>
                <th>Deal value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="companiesTableBody"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

    $("#app").html(buildAppShell("companies", mainHtml));
}

$(function () {
    renderCompaniesShell();
    applyThemeSettings();
    setActiveNav();
    loadCompanyFormOptions();
    renderCompanies();

    $("#companyForm").on("submit", function (event) {
        event.preventDefault();
        createCompany();
    });

    $("#cancelCompanyEdit").on("click", clearCompanyForm);

    $("#companySearch, #filterIndustry, #filterSize").on("input change", renderCompanies);

    $(document).on("click", ".edit-company", function () {
        editCompany($(this).data("id"));
    });

    $(document).on("click", ".delete-company", function () {
        deleteCompany($(this).data("id"));
    });
});