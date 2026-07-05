// js/pipeline.js
let draggedDealId = null;

function createPipelineCard(deal) {
    const workspace = loadWorkspace();

    return `
    <article class="pipeline-card" draggable="true" data-deal-id="${escapeHtml(deal.id)}">
      <div>
        <div class="pipeline-card-title">${escapeHtml(deal.title)}</div>
        <div class="pipeline-card-meta">${escapeHtml(getCustomerName(workspace, deal.customerId))}</div>
      </div>
      <div class="pipeline-card-meta">
        <i class="bi bi-buildings me-1"></i>${escapeHtml(getCompanyName(workspace, deal.companyId))}
      </div>
      <div class="pipeline-card-footer">
        <span class="badge-soft">${formatCurrency(deal.value)}</span>
        <span class="text-muted small">${Number(deal.probability)}%</span>
      </div>
      <div class="pipeline-card-meta">
        <i class="bi bi-person-badge me-1"></i>${escapeHtml(deal.owner)}
      </div>
    </article>
  `;
}

function filterPipelineDeals() {
    const workspace = loadWorkspace();
    const search = $("#pipelineSearch").val().toLowerCase().trim();
    const owner = $("#pipelineOwnerFilter").val();
    const companyId = $("#pipelineCompanyFilter").val();

    return workspace.deals.filter((deal) => {
        const customerName = getCustomerName(workspace, deal.customerId).toLowerCase();
        const companyName = getCompanyName(workspace, deal.companyId).toLowerCase();

        const matchesSearch = !search ||
            deal.title.toLowerCase().includes(search) ||
            customerName.includes(search) ||
            companyName.includes(search);

        const matchesOwner = !owner || deal.owner === owner;
        const matchesCompany = !companyId || deal.companyId === companyId;

        return matchesSearch && matchesOwner && matchesCompany;
    });
}

function renderPipelineBoard() {
    const workspace = loadWorkspace();
    const deals = filterPipelineDeals();
    const values = calculateStageValues(deals);

    $("#pipelineBoard").html(CRM_STAGES.map((stage) => {
        const stageDeals = deals.filter((deal) => deal.stage === stage);

        return `
      <section class="pipeline-column" data-stage="${escapeHtml(stage)}">
        <div class="pipeline-column-header">
          <div>
            <h2 class="pipeline-column-title">${escapeHtml(stage)}</h2>
            <div class="pipeline-column-value">${formatCurrency(values[stage])}</div>
          </div>
          <span class="badge-soft">${stageDeals.length}</span>
        </div>
        <div class="pipeline-card-list">
          ${stageDeals.length ? stageDeals.map(createPipelineCard).join("") : renderEmptyState("No deals")}
        </div>
      </section>
    `;
    }).join(""));

    enablePipelineDragAndDrop();
}

function enablePipelineDragAndDrop() {
    $(".pipeline-card").on("dragstart", handleDragStart);
    $(".pipeline-card").on("dragend", function () {
        $(this).removeClass("dragging");
        $(".pipeline-column").removeClass("drag-over");
    });

    $(".pipeline-column").on("dragover", handleDragOver);
    $(".pipeline-column").on("dragleave", function () {
        $(this).removeClass("drag-over");
    });
    $(".pipeline-column").on("drop", handleDrop);
}

function handleDragStart(event) {
    draggedDealId = $(event.currentTarget).data("deal-id");
    event.originalEvent.dataTransfer.effectAllowed = "move";
    event.originalEvent.dataTransfer.setData("text/plain", draggedDealId);
    $(event.currentTarget).addClass("dragging");
}

function handleDragOver(event) {
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = "move";
    $(event.currentTarget).addClass("drag-over");
}

function handleDrop(event) {
    event.preventDefault();
    const stage = $(event.currentTarget).data("stage");
    const dealId = event.originalEvent.dataTransfer.getData("text/plain") || draggedDealId;

    $(".pipeline-column").removeClass("drag-over");

    if (!dealId || !stage) return;

    updateDealStage(dealId, stage);
}

function updateDealStage(dealId, stage) {
    const workspace = loadWorkspace();
    const deal = workspace.deals.find((item) => item.id === dealId);

    if (!deal) {
        showStatus("Deal not found.", "danger");
        return;
    }

    if (deal.stage === stage) {
        renderPipelineBoard();
        return;
    }

    deal.stage = stage;
    deal.updatedAt = getTodayDate();

    if (stage === "Won") deal.probability = 100;
    if (stage === "Lost") deal.probability = 0;

    saveWorkspace(workspace);
    addActivityLog("Deals", "Updated stage", `Moved ${deal.title} to ${stage}`);
    showStatus(`Moved deal to ${stage}.`, "success");
    renderPipelineBoard();
}

function filterPipelineCards() {
    renderPipelineBoard();
}

function loadPipelineFilters() {
    const workspace = loadWorkspace();

    $("#pipelineOwnerFilter").html(`
    <option value="">All owners</option>
    ${CRM_OWNERS.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join("")}
  `);

    $("#pipelineCompanyFilter").html(`
    <option value="">All companies</option>
    ${workspace.companies.map((company) => `
      <option value="${escapeHtml(company.id)}">${escapeHtml(company.name)}</option>
    `).join("")}
  `);
}

function renderPipelineShell() {
    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Kanban revenue flow</div>
        <h1 class="page-title">Sales Pipeline</h1>
        <p class="page-description">
          Drag opportunities across stages and update deal state instantly with local workspace persistence.
        </p>
      </div>
      <div class="topbar-actions">
        <a class="btn btn-ghost" href="deals.html"><i class="bi bi-table me-1"></i> Deal table</a>
        <a class="btn btn-primary" href="analytics.html"><i class="bi bi-bar-chart me-1"></i> Analytics</a>
      </div>
    </div>

    <section class="panel">
      <div class="pipeline-toolbar">
        <input class="form-control" id="pipelineSearch" placeholder="Search deal, customer, company">
        <select class="form-select" id="pipelineOwnerFilter"></select>
        <select class="form-select" id="pipelineCompanyFilter"></select>
      </div>

      <div class="pipeline-board" id="pipelineBoard"></div>
    </section>
  `;

    $("#app").html(buildAppShell("pipeline", mainHtml));
}

$(function () {
    renderPipelineShell();
    applyThemeSettings();
    setActiveNav();
    loadPipelineFilters();
    renderPipelineBoard();

    $("#pipelineSearch, #pipelineOwnerFilter, #pipelineCompanyFilter").on("input change", filterPipelineCards);
});