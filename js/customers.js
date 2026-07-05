// js/customers.js
let editingCustomerId = null;

function loadCustomerFormOptions() {
    const workspace = loadWorkspace();

    $("#customerCompany").html(`
    <option value="">Unassigned</option>
    ${workspace.companies.map((company) => `
      <option value="${escapeHtml(company.id)}">${escapeHtml(company.name)}</option>
    `).join("")}
  `);

    $("#filterCompany").html(`
    <option value="">All companies</option>
    ${workspace.companies.map((company) => `
      <option value="${escapeHtml(company.id)}">${escapeHtml(company.name)}</option>
    `).join("")}
  `);

    $("#customerOwner, #filterOwner").each(function () {
        const isFilter = this.id === "filterOwner";
        $(this).html(`
      <option value="">${isFilter ? "All owners" : "Select owner"}</option>
      ${CRM_OWNERS.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join("")}
    `);
    });
}

function getCustomerFormData() {
    return {
        firstName: $("#customerFirstName").val().trim(),
        lastName: $("#customerLastName").val().trim(),
        email: $("#customerEmail").val().trim(),
        phone: $("#customerPhone").val().trim(),
        companyId: $("#customerCompany").val(),
        owner: $("#customerOwner").val(),
        status: $("#customerStatus").val()
    };
}

function clearCustomerForm() {
    editingCustomerId = null;
    $("#customerForm")[0].reset();
    $("#customerFormTitle").text("Add customer");
    $("#customerSubmitLabel").text("Create customer");
    $("#cancelCustomerEdit").addClass("d-none");
}

function createCustomer() {
    const workspace = loadWorkspace();
    const data = getCustomerFormData();

    if (!data.firstName || !data.lastName || !data.email || !data.owner || !data.status) {
        showStatus("Please fill first name, last name, email, owner, and status.", "warning");
        return;
    }

    if (editingCustomerId) {
        const customer = workspace.customers.find((item) => item.id === editingCustomerId);
        if (!customer) return;

        Object.assign(customer, data, { updatedAt: getTodayDate() });
        saveWorkspace(workspace);
        addActivityLog("Customers", "Updated customer", `Updated customer ${data.firstName} ${data.lastName}`);
        showStatus("Customer updated.", "success");
    } else {
        const customer = {
            id: generateId("customer"),
            ...data,
            createdAt: getTodayDate(),
            updatedAt: getTodayDate()
        };

        workspace.customers.unshift(customer);
        saveWorkspace(workspace);
        addActivityLog("Customers", "Created customer", `Created customer ${data.firstName} ${data.lastName}`);
        showStatus("Customer created.", "success");
    }

    clearCustomerForm();
    loadCustomerFormOptions();
    renderCustomers();
}

function editCustomer(id) {
    const workspace = loadWorkspace();
    const customer = workspace.customers.find((item) => item.id === id);

    if (!customer) {
        showStatus("Customer not found.", "danger");
        return;
    }

    editingCustomerId = id;
    $("#customerFirstName").val(customer.firstName);
    $("#customerLastName").val(customer.lastName);
    $("#customerEmail").val(customer.email);
    $("#customerPhone").val(customer.phone);
    $("#customerCompany").val(customer.companyId);
    $("#customerOwner").val(customer.owner);
    $("#customerStatus").val(customer.status);
    $("#customerFormTitle").text("Edit customer");
    $("#customerSubmitLabel").text("Save changes");
    $("#cancelCustomerEdit").removeClass("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteCustomer(id) {
    const workspace = loadWorkspace();
    const customer = workspace.customers.find((item) => item.id === id);

    if (!customer) return;

    const isUsedByDeal = workspace.deals.some((deal) => deal.customerId === id);
    if (isUsedByDeal) {
        showStatus("This customer is linked to a deal. Reassign or delete the deal first.", "warning");
        return;
    }

    workspace.customers = workspace.customers.filter((item) => item.id !== id);

    workspace.activities = workspace.activities.map((activity) => {
        if (activity.relatedType === "Customer" && activity.relatedId === id) {
            return { ...activity, relatedId: "", updatedAt: getTodayDate() };
        }
        return activity;
    });

    saveWorkspace(workspace);
    addActivityLog("Customers", "Deleted customer", `Deleted customer ${customer.firstName} ${customer.lastName}`);
    showStatus("Customer deleted.", "success");
    renderCustomers();
}

function filterCustomers() {
    const workspace = loadWorkspace();
    const search = $("#customerSearch").val().toLowerCase().trim();
    const status = $("#filterStatus").val();
    const companyId = $("#filterCompany").val();
    const owner = $("#filterOwner").val();

    return workspace.customers.filter((customer) => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        const companyName = getCompanyName(workspace, customer.companyId).toLowerCase();

        const matchesSearch = !search ||
            fullName.includes(search) ||
            customer.email.toLowerCase().includes(search) ||
            customer.phone.toLowerCase().includes(search) ||
            companyName.includes(search);

        const matchesStatus = !status || customer.status === status;
        const matchesCompany = !companyId || customer.companyId === companyId;
        const matchesOwner = !owner || customer.owner === owner;

        return matchesSearch && matchesStatus && matchesCompany && matchesOwner;
    });
}

function renderCustomerStatusCards(customers) {
    const counts = CRM_STATUSES.reduce((acc, status) => {
        acc[status] = customers.filter((customer) => customer.status === status).length;
        return acc;
    }, {});

    $("#customerStatusStrip").html(CRM_STATUSES.map((status) => `
    <div class="status-mini-card">
      <span class="text-muted">${escapeHtml(status)}</span>
      <strong>${counts[status]}</strong>
    </div>
  `).join(""));
}

function renderCustomers() {
    const workspace = loadWorkspace();
    const customers = filterCustomers();

    renderCustomerStatusCards(workspace.customers);

    $("#customerCount").text(`${customers.length} shown`);

    if (!customers.length) {
        $("#customersTableBody").html(`
      <tr>
        <td colspan="8">${renderEmptyState("No customers match your filters.")}</td>
      </tr>
    `);
        return;
    }

    $("#customersTableBody").html(customers.map((customer) => {
        const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
        const statusClass = `badge-${slugify(customer.status)}`;

        return `
      <tr>
        <td>
          <div class="customer-name-cell">
            <span class="customer-avatar">${escapeHtml(initials)}</span>
            <div>
              <div class="fw-bold">${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}</div>
              <div class="customer-meta">${escapeHtml(customer.id)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(customer.email)}</td>
        <td>${escapeHtml(customer.phone || "Not set")}</td>
        <td>${escapeHtml(getCompanyName(workspace, customer.companyId))}</td>
        <td><span class="badge-soft ${statusClass}">${escapeHtml(customer.status)}</span></td>
        <td>${escapeHtml(customer.owner)}</td>
        <td>${formatDate(customer.createdAt)}</td>
        <td>
          <div class="action-row">
            <button class="btn btn-sm btn-ghost icon-btn edit-customer" data-id="${escapeHtml(customer.id)}" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger icon-btn delete-customer" data-id="${escapeHtml(customer.id)}" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join(""));
}

function renderCustomersShell() {
    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Contact database</div>
        <h1 class="page-title">Customers</h1>
        <p class="page-description">
          Manage leads, prospects, active customers, owners, account assignments, and lifecycle status.
        </p>
      </div>
      <div class="topbar-actions">
        <a class="btn btn-ghost" href="companies.html"><i class="bi bi-buildings me-1"></i> Companies</a>
        <a class="btn btn-primary" href="deals.html"><i class="bi bi-cash-coin me-1"></i> Deals</a>
      </div>
    </div>

    <section class="customer-status-strip" id="customerStatusStrip"></section>

    <section class="customer-layout">
      <aside class="form-panel panel">
        <div class="form-header">
          <div>
            <h2 class="panel-title" id="customerFormTitle">Add customer</h2>
            <p class="panel-subtitle">Create contacts and assign them to accounts.</p>
          </div>
        </div>

        <form id="customerForm">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="customerFirstName">First name</label>
              <input class="form-control" id="customerFirstName" required>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="customerLastName">Last name</label>
              <input class="form-control" id="customerLastName" required>
            </div>
            <div class="col-12">
              <label class="form-label" for="customerEmail">Email</label>
              <input class="form-control" id="customerEmail" type="email" required>
            </div>
            <div class="col-12">
              <label class="form-label" for="customerPhone">Phone</label>
              <input class="form-control" id="customerPhone">
            </div>
            <div class="col-12">
              <label class="form-label" for="customerCompany">Company</label>
              <select class="form-select" id="customerCompany"></select>
            </div>
            <div class="col-12">
              <label class="form-label" for="customerOwner">Deal owner</label>
              <select class="form-select" id="customerOwner" required></select>
            </div>
            <div class="col-12">
              <label class="form-label" for="customerStatus">Status</label>
              <select class="form-select" id="customerStatus" required>
                <option value="Lead">Lead</option>
                <option value="Prospect">Prospect</option>
                <option value="Customer">Customer</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 mt-4">
            <button class="btn btn-primary" type="submit">
              <i class="bi bi-save me-1"></i> <span id="customerSubmitLabel">Create customer</span>
            </button>
            <button class="btn btn-ghost d-none" id="cancelCustomerEdit" type="button">Cancel</button>
          </div>
        </form>
      </aside>

      <section class="table-panel panel">
        <div class="table-header">
          <div>
            <h2 class="panel-title">Customer records</h2>
            <p class="panel-subtitle">Search and filter the CRM contact list.</p>
          </div>
          <span class="badge-soft" id="customerCount">0 shown</span>
        </div>

        <div class="filter-bar">
          <input class="form-control" id="customerSearch" placeholder="Search customers, email, phone, company">
          <select class="form-select" id="filterStatus">
            <option value="">All statuses</option>
            <option value="Lead">Lead</option>
            <option value="Prospect">Prospect</option>
            <option value="Customer">Customer</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select class="form-select" id="filterCompany"></select>
          <select class="form-select" id="filterOwner"></select>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="customersTableBody"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

    $("#app").html(buildAppShell("customers", mainHtml));
}

$(function () {
    renderCustomersShell();
    applyThemeSettings();
    setActiveNav();
    loadCustomerFormOptions();
    renderCustomers();

    $("#customerForm").on("submit", function (event) {
        event.preventDefault();
        createCustomer();
    });

    $("#cancelCustomerEdit").on("click", clearCustomerForm);

    $("#customerSearch, #filterStatus, #filterCompany, #filterOwner").on("input change", renderCustomers);

    $(document).on("click", ".edit-customer", function () {
        editCustomer($(this).data("id"));
    });

    $(document).on("click", ".delete-customer", function () {
        deleteCustomer($(this).data("id"));
    });
});