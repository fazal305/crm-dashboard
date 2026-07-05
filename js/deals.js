// js/deals.js
let editingDealId = null;

function loadDealFormOptions() {
    const workspace = loadWorkspace();

    $("#dealCustomer").html(`
    <option value="">Select customer</option>
    ${workspace.customers.map((customer) => `
      <option value="${escapeHtml(customer.id)}">${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}</option>
    `).join("")}
  `);

    $("#dealCompany, #filterDealCompany").html(`
    <option value="">${$("#dealCompany").length ? "Select company" : "All companies"}</option>
    ${workspace.companies.map((company) => `
      <option value="${escapeHtml(company.id)}">${escapeHtml(company.name)}</option>
    `).join("")}
  `);

    $("#filterDealCompany").prepend(`<option value="">All companies</option>`);
    $("#filterDealCompany option").eq(1).remove();

    $("#dealOwner, #filterDealOwner").each(function () {
        const isFilter = this.id === "filterDealOwner";
        $(this).html(`
      <option value="">${isFilter ? "All owners" : "Select owner"}</option>
      ${CRM_OWNERS.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join("")}
    `);
    });

    $("#dealStage, #filterDealStage").each(function () {
        const isFilter = this.id === "filterDealStage";
        $(this).html(`
      <option value="">${isFilter ? "All stages" : "Select stage"}</option>
      ${CRM_STAGES.map((stage) => `<option value="${escapeHtml(stage)}">${escapeHtml(stage)}</option>`).join("")}
    `);
    });

    $("#dealStage").val(loadWorkspace().settings.defaultStage || "New");
}

function getDealFormData() {
    return {
        title: $("#dealTitle").val().trim(),
        customerId: $("#dealCustomer").val(),
        companyId: $("#dealCompany").val(),
        owner: $("#dealOwner").val(),
        stage: $("#dealStage").val(),
        value: Number($("#dealValue").val()),
        probability: Number($("#dealProbability").val()),
        expectedCloseDate: $("#dealExpectedCloseDate").val()
    };
}

function clearDealForm() {
    editingDealId = null;
    $("#dealForm")[0].reset();
    $("#dealStage").val(loadWorkspace().settings.defaultStage || "New");
    $("#dealFormTitle").text("Add deal");
    $("#dealSubmitLabel").text("Create deal");
    $("#cancelDealEdit").addClass("d-none");
}

function createDeal() {
    const workspace = loadWorkspace();
    const data = getDealFormData();

    if (!data.title || !data.customerId || !data.companyId || !data.owner || !data.stage || !data.value || !data.expectedCloseDate) {
        showStatus("Please fill title, customer, company, owner, stage, value, and expected close date.", "warning");
        return;
    }

    data.probability = Math.min(100, Math.max(0, data.probability || 0));

    if (editingDealId) {
        const deal = workspace.deals.find((item) => item.id === editingDealId);
        if (!deal) return;

        Object.assign(deal, data, { updatedAt: getTodayDate() });
        saveWorkspace(workspace);
        addActivityLog("Deals", "Updated deal", `Updated deal ${data.title}`);
        showStatus("Deal updated.", "success");
    } else {
        const deal = {
            id: generateId("deal"),
            ...data,
            createdAt: getTodayDate(),
            updatedAt: getTodayDate()
        };

        workspace.deals.unshift(deal);
        saveWorkspace(workspace);
        addActivityLog("Deals", "Created deal", `Created deal ${data.title}`);
        showStatus("Deal created.", "success");
    }

    clearDealForm();
    renderDeals();
}

function editDeal(id) {
    const workspace = loadWorkspace();
    const deal = workspace.deals.find((item) => item.id === id);

    if (!deal) {
        showStatus("Deal not found.", "danger");
        return;
    }

    editingDealId = id;
    $("#dealTitle").val(deal.title);
    $("#dealCustomer").val(deal.customerId);
    $("#dealCompany").val(deal.companyId);
    $("#dealOwner").val(deal.owner);
    $("#dealStage").val(deal.stage);
    $("#dealValue").val(deal.value);
    $("#dealProbability").val(deal.probability);
    $("#dealExpectedCloseDate").val(deal.expectedCloseDate);
    $("#dealFormTitle").text("Edit deal");
    $("#dealSubmitLabel").text("Save changes");
    $("#cancelDealEdit").removeClass("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteDeal(id) {
    const workspace = loadWorkspace();
    const deal = workspace.deals.find((item) => item.id === id);

    if (!deal) return;

    workspace.deals = workspace.deals.filter((item) => item.id !== id);
    workspace.activities = workspace.activities.map((activity) => {
        if (activity.relatedType === "Deal" && activity.relatedId === id) {
            return { ...activity, relatedId: "", updatedAt: getTodayDate() };
        }
        return activity;
    });

    saveWorkspace(workspace);
    addActivityLog("Deals", "Deleted deal", `Deleted deal ${deal.title}`);
    showStatus("Deal deleted.", "success");
    renderDeals();
}

function filterDeals() {
    const workspace = loadWorkspace();
    const search = $("#dealSearch").val().toLowerCase().trim();
    const stage = $("#filterDealStage").val();
    const owner = $("#filterDealOwner").val();
    const companyId = $("#filterDealCompany").val();

    return workspace.deals.filter((deal) => {
        const customerName = getCustomerName(workspace, deal.customerId).toLowerCase();
        const companyName = getCompanyName(workspace, deal.companyId).toLowerCase();

        const matchesSearch = !search ||
            deal.title.toLowerCase().includes(search) ||
            customerName.includes(search) ||
            companyName.includes(search);

        const matchesStage = !stage || deal.stage === stage;
        const matchesOwner = !owner || deal.owner === owner;
        const matchesCompany = !companyId || deal.companyId === companyId;

        return matchesSearch && matchesStage && matchesOwner && matchesCompany;
    });
}

function renderDealSummary() {
    const workspace = loadWorkspace();

    $("#dealSummaryStrip").html(`
    <div class="deal-summary-card">
      <span class="text-muted">Open pipeline</span>
      <strong class="d-block mt-1">${formatCurrency(calculatePipelineValue(workspace.deals))}</strong>
    </div>
    <div class="deal-summary-card">
      <span class="text-muted">Won revenue</span>
      <strong class="d-block mt-1 value-positive">${formatCurrency(calculateWonValue(workspace.deals))}</strong>
    </div>
    <div class="deal-summary-card">
      <span class="text-muted">Forecast</span>
      <strong class="d-block mt-1">${formatCurrency(calculateForecastValue(workspace.deals))}</strong>
    </div>
  `);
}

function renderDeals() {
    const workspace = loadWorkspace();
    const deals = filterDeals();

    renderDealSummary();
    $("#dealCount").text(`${deals.length} shown`);

    if (!deals.length) {
        $("#dealsTableBody").html(`
      <tr>
        <td colspan="9">${renderEmptyState("No deals match your filters.")}</td>
      </tr>
    `);
        return;
    }

    $("#dealsTableBody").html(deals.map((deal) => {
        const stageClass = `badge-${slugify(deal.stage)}`;

        return `
      <tr>
        <td>
          <div class="deal-title-cell">${escapeHtml(deal.title)}</div>
          <div class="deal-subtitle">${escapeHtml(deal.id)}</div>
        </td>
        <td>${escapeHtml(getCustomerName(workspace, deal.customerId))}</td>
        <td>${escapeHtml(getCompanyName(workspace, deal.companyId))}</td>
        <td>${escapeHtml(deal.owner)}</td>
        <td><span class="badge-soft ${stageClass}">${escapeHtml(deal.stage)}</span></td>
        <td class="deal-value">${formatCurrency(deal.value)}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="probability-track"><span style="width: ${Number(deal.probability)}%"></span></div>
            <span>${Number(deal.probability)}%</span>
          </div>
        </td>
        <td>${formatDate(deal.expectedCloseDate)}</td>
        <td>
          <div class="action-row">
            <button class="btn btn-sm btn-ghost icon-btn edit-deal" data-id="${escapeHtml(deal.id)}" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger icon-btn delete-deal" data-id="${escapeHtml(deal.id)}" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join(""));
}

function renderDealsShell() {
    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Revenue engine</div>
        <h1 class="page-title">Deals</h1>
        <p class="page-description">
          Create opportunities, assign owners, track probability, expected close dates, and stage progress.
        </p>
      </div>
      <div class="topbar-actions">
        <a class="btn btn-ghost" href="pipeline.html"><i class="bi bi-kanban me-1"></i> Pipeline board</a>
        <a class="btn btn-primary" href="activities.html"><i class="bi bi-calendar-plus me-1"></i> Schedule activity</a>
      </div>
    </div>

    <section class="deal-summary-strip" id="dealSummaryStrip"></section>

    <section class="deal-layout">
      <aside class="form-panel panel">
        <div class="form-header">
          <div>
            <h2 class="panel-title" id="dealFormTitle">Add deal</h2>
            <p class="panel-subtitle">Track value, probability, and pipeline ownership.</p>
          </div>
        </div>

        <form id="dealForm">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="dealTitle">Deal title</label>
              <input class="form-control" id="dealTitle" required>
            </div>
            <div class="col-12">
              <label class="form-label" for="dealCustomer">Customer</label>
              <select class="form-select" id="dealCustomer" required></select>
            </div>
            <div class="col-12">
              <label class="form-label" for="dealCompany">Company</label>
              <select class="form-select" id="dealCompany" required></select>
            </div>
            <div class="col-12">
              <label class="form-label" for="dealOwner">Owner</label>
              <select class="form-select" id="dealOwner" required></select>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="dealStage">Stage</label>
              <select class="form-select" id="dealStage" required></select>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="dealProbability">Probability</label>
              <input class="form-control" id="dealProbability" type="number" min="0" max="100" value="25">
            </div>
            <div class="col-md-6">
              <label class="form-label" for="dealValue">Value</label>
              <input class="form-control" id="dealValue" type="number" min="0" required>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="dealExpectedCloseDate">Expected close</label>
              <input class="form-control" id="dealExpectedCloseDate" type="date" required>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 mt-4">
            <button class="btn btn-primary" type="submit">
              <i class="bi bi-save me-1"></i> <span id="dealSubmitLabel">Create deal</span>
            </button>
            <button class="btn btn-ghost d-none" id="cancelDealEdit" type="button">Cancel</button>
          </div>
        </form>
      </aside>

      <section class="table-panel panel">
        <div class="table-header">
          <div>
            <h2 class="panel-title">Deal records</h2>
            <p class="panel-subtitle">Search and filter opportunities by stage, owner, and account.</p>
          </div>
          <span class="badge-soft" id="dealCount">0 shown</span>
        </div>

        <div class="filter-bar">
          <input class="form-control" id="dealSearch" placeholder="Search deal, customer, company">
          <select class="form-select" id="filterDealStage"></select>
          <select class="form-select" id="filterDealOwner"></select>
          <select class="form-select" id="filterDealCompany"></select>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Customer</th>
                <th>Company</th>
                <th>Owner</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Probability</th>
                <th>Expected close</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="dealsTableBody"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

    $("#app").html(buildAppShell("deals", mainHtml));
}

$(function () {
    renderDealsShell();
    applyThemeSettings();
    setActiveNav();
    loadDealFormOptions();
    renderDeals();

    $("#dealForm").on("submit", function (event) {
        event.preventDefault();
        createDeal();
    });

    $("#cancelDealEdit").on("click", clearDealForm);

    $("#dealSearch, #filterDealStage, #filterDealOwner, #filterDealCompany").on("input change", renderDeals);

    $(document).on("click", ".edit-deal", function () {
        editDeal($(this).data("id"));
    });

    $(document).on("click", ".delete-deal", function () {
        deleteDeal($(this).data("id"));
    });
});