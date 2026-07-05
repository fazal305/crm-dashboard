// js/analytics.js
let revenueAnalyticsChart = null;
let dealsByStageChart = null;
let customersByStatusChart = null;
let activitiesByTypeChart = null;

function getDateFilteredWorkspace() {
    const workspace = loadWorkspace();
    const start = $("#analyticsStartDate").val();
    const end = $("#analyticsEndDate").val();

    if (!start && !end) return workspace;

    const inRange = function (dateString) {
        if (!dateString) return true;
        if (start && dateString < start) return false;
        if (end && dateString > end) return false;
        return true;
    };

    return {
        ...workspace,
        deals: workspace.deals.filter((deal) => inRange(deal.expectedCloseDate || deal.updatedAt || deal.createdAt)),
        customers: workspace.customers.filter((customer) => inRange(customer.createdAt)),
        activities: workspace.activities.filter((activity) => inRange(activity.dueDate))
    };
}

function renderAnalyticsCards() {
    const workspace = getDateFilteredWorkspace();

    $("#analyticsCards").html(`
    <div class="analytics-card">
      <span>Total pipeline</span>
      <strong>${formatCurrency(calculatePipelineValue(workspace.deals))}</strong>
    </div>
    <div class="analytics-card">
      <span>Won revenue</span>
      <strong class="value-positive">${formatCurrency(calculateWonValue(workspace.deals))}</strong>
    </div>
    <div class="analytics-card">
      <span>Weighted forecast</span>
      <strong>${formatCurrency(calculateForecastValue(workspace.deals))}</strong>
    </div>
    <div class="analytics-card">
      <span>Activities</span>
      <strong>${workspace.activities.length}</strong>
    </div>
  `);
}

function chartTextColor() {
    return getComputedStyle(document.body).getPropertyValue("--text").trim() || "#f7fbff";
}

function renderRevenueAnalyticsChart() {
    const workspace = getDateFilteredWorkspace();
    const ctx = document.getElementById("revenueAnalyticsChart");
    if (!ctx || typeof Chart === "undefined") return;

    const labels = CRM_STAGES;
    const values = labels.map((stage) => {
        return workspace.deals
            .filter((deal) => deal.stage === stage)
            .reduce((total, deal) => total + Number(deal.value || 0), 0);
    });

    if (revenueAnalyticsChart) revenueAnalyticsChart.destroy();

    revenueAnalyticsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Deal value",
                data: values,
                borderColor: "#22d3ee",
                backgroundColor: "rgba(34, 211, 238, 0.32)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: chartTextColor() } } },
            scales: {
                x: { ticks: { color: "#9aabc7" }, grid: { color: "rgba(154, 171, 199, 0.12)" } },
                y: {
                    ticks: { color: "#9aabc7", callback: (value) => formatCurrency(value) },
                    grid: { color: "rgba(154, 171, 199, 0.12)" }
                }
            }
        }
    });
}

function renderDealsByStageChart() {
    const workspace = getDateFilteredWorkspace();
    const ctx = document.getElementById("dealsByStageChart");
    if (!ctx || typeof Chart === "undefined") return;

    const counts = calculateStageCounts(workspace.deals);

    if (dealsByStageChart) dealsByStageChart.destroy();

    dealsByStageChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: CRM_STAGES,
            datasets: [{
                data: CRM_STAGES.map((stage) => counts[stage]),
                backgroundColor: ["#22d3ee", "#60a5fa", "#a855f7", "#facc15", "#4ade80", "#fb7185"],
                borderColor: "rgba(4, 7, 18, 0.82)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: chartTextColor() } } }
        }
    });
}

function renderCustomersByStatusChart() {
    const workspace = getDateFilteredWorkspace();
    const ctx = document.getElementById("customersByStatusChart");
    if (!ctx || typeof Chart === "undefined") return;

    const values = CRM_STATUSES.map((status) => {
        return workspace.customers.filter((customer) => customer.status === status).length;
    });

    if (customersByStatusChart) customersByStatusChart.destroy();

    customersByStatusChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: CRM_STATUSES,
            datasets: [{
                label: "Customers",
                data: values,
                backgroundColor: "rgba(168, 85, 247, 0.34)",
                borderColor: "#a855f7"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: chartTextColor() } } },
            scales: {
                x: { ticks: { color: "#9aabc7" }, grid: { color: "rgba(154, 171, 199, 0.12)" } },
                y: { ticks: { color: "#9aabc7" }, grid: { color: "rgba(154, 171, 199, 0.12)" } }
            }
        }
    });
}

function renderActivitiesByTypeChart() {
    const workspace = getDateFilteredWorkspace();
    const ctx = document.getElementById("activitiesByTypeChart");
    if (!ctx || typeof Chart === "undefined") return;

    const values = CRM_ACTIVITY_TYPES.map((type) => {
        return workspace.activities.filter((activity) => activity.type === type).length;
    });

    if (activitiesByTypeChart) activitiesByTypeChart.destroy();

    activitiesByTypeChart = new Chart(ctx, {
        type: "polarArea",
        data: {
            labels: CRM_ACTIVITY_TYPES,
            datasets: [{
                data: values,
                backgroundColor: [
                    "rgba(34, 211, 238, 0.42)",
                    "rgba(168, 85, 247, 0.42)",
                    "rgba(74, 222, 128, 0.42)",
                    "rgba(250, 204, 21, 0.42)",
                    "rgba(96, 165, 250, 0.42)",
                    "rgba(251, 113, 133, 0.42)"
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: chartTextColor() } } },
            scales: {
                r: {
                    ticks: { color: "#9aabc7", backdropColor: "transparent" },
                    grid: { color: "rgba(154, 171, 199, 0.12)" }
                }
            }
        }
    });
}

function renderTopCompaniesTable() {
    const workspace = getDateFilteredWorkspace();

    const rows = workspace.companies.map((company) => {
        const value = workspace.deals
            .filter((deal) => deal.companyId === company.id)
            .reduce((total, deal) => total + Number(deal.value || 0), 0);

        return {
            company,
            value,
            deals: workspace.deals.filter((deal) => deal.companyId === company.id).length
        };
    }).sort((a, b) => b.value - a.value).slice(0, 6);

    if (!rows.length) {
        $("#topCompaniesTableBody").html(`
      <tr><td colspan="4">${renderEmptyState("No company analytics available.")}</td></tr>
    `);
        return;
    }

    $("#topCompaniesTableBody").html(rows.map((row, index) => `
    <tr>
      <td><span class="top-company-rank">${index + 1}</span></td>
      <td>
        <strong>${escapeHtml(row.company.name)}</strong>
        <div class="text-muted small">${escapeHtml(row.company.industry)}</div>
      </td>
      <td>${row.deals}</td>
      <td class="deal-value">${formatCurrency(row.value)}</td>
    </tr>
  `).join(""));
}

function renderAllAnalytics() {
    renderAnalyticsCards();
    renderRevenueAnalyticsChart();
    renderDealsByStageChart();
    renderCustomersByStatusChart();
    renderActivitiesByTypeChart();
    renderTopCompaniesTable();
}

function exportAnalyticsReport() {
    const workspace = getDateFilteredWorkspace();
    const report = {
        exportedAt: new Date().toISOString(),
        filters: {
            startDate: $("#analyticsStartDate").val(),
            endDate: $("#analyticsEndDate").val()
        },
        summary: {
            totalPipeline: calculatePipelineValue(workspace.deals),
            wonRevenue: calculateWonValue(workspace.deals),
            forecast: calculateForecastValue(workspace.deals),
            dealsByStage: calculateStageCounts(workspace.deals),
            stageValues: calculateStageValues(workspace.deals),
            customers: workspace.customers.length,
            activities: workspace.activities.length
        },
        topCompanies: workspace.companies.map((company) => ({
            id: company.id,
            name: company.name,
            dealValue: workspace.deals
                .filter((deal) => deal.companyId === company.id)
                .reduce((total, deal) => total + Number(deal.value || 0), 0)
        }))
    };

    downloadJson(`crm-analytics-report-${getTodayDate()}.json`, report);
    showStatus("Analytics report exported.", "success");
}

function renderAnalyticsShell() {
    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Sales intelligence</div>
        <h1 class="page-title">Analytics</h1>
        <p class="page-description">
          Explore sales performance, forecast value, stage distribution, customer mix, and activity composition.
        </p>
      </div>
      <div class="topbar-actions">
        <button class="btn btn-primary" id="exportAnalytics" type="button">
          <i class="bi bi-download me-1"></i> Export report
        </button>
      </div>
    </div>

    <section class="panel mb-3">
      <div class="analytics-filter-bar">
        <input class="form-control" id="analyticsStartDate" type="date" aria-label="Start date">
        <input class="form-control" id="analyticsEndDate" type="date" aria-label="End date">
        <button class="btn btn-ghost" id="clearAnalyticsFilters" type="button">
          <i class="bi bi-x-circle me-1"></i> Clear
        </button>
      </div>
    </section>

    <section class="analytics-grid" id="analyticsCards"></section>

    <section class="analytics-layout">
      <div class="analytics-chart-grid">
        <div class="chart-panel panel chart-shell">
          <div class="chart-header">
            <div>
              <h2 class="panel-title">Revenue by stage</h2>
              <p class="panel-subtitle">Deal value grouped by pipeline stage.</p>
            </div>
          </div>
          <canvas id="revenueAnalyticsChart"></canvas>
        </div>

        <div class="chart-panel panel chart-shell">
          <div class="chart-header">
            <div>
              <h2 class="panel-title">Deals by stage</h2>
              <p class="panel-subtitle">Opportunity count distribution.</p>
            </div>
          </div>
          <canvas id="dealsByStageChart"></canvas>
        </div>

        <div class="chart-panel panel chart-shell">
          <div class="chart-header">
            <div>
              <h2 class="panel-title">Customers by status</h2>
              <p class="panel-subtitle">Lead and customer lifecycle mix.</p>
            </div>
          </div>
          <canvas id="customersByStatusChart"></canvas>
        </div>

        <div class="chart-panel panel chart-shell">
          <div class="chart-header">
            <div>
              <h2 class="panel-title">Activities by type</h2>
              <p class="panel-subtitle">Sales activity composition.</p>
            </div>
          </div>
          <canvas id="activitiesByTypeChart"></canvas>
        </div>
      </div>

      <aside class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Top companies</h2>
            <p class="panel-subtitle">Ranked by deal value in current filter range.</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Company</th>
                <th>Deals</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody id="topCompaniesTableBody"></tbody>
          </table>
        </div>
      </aside>
    </section>
  `;

    $("#app").html(buildAppShell("analytics", mainHtml));
}

$(function () {
    renderAnalyticsShell();
    applyThemeSettings();
    setActiveNav();
    renderAllAnalytics();

    $("#analyticsStartDate, #analyticsEndDate").on("change", renderAllAnalytics);

    $("#clearAnalyticsFilters").on("click", function () {
        $("#analyticsStartDate, #analyticsEndDate").val("");
        renderAllAnalytics();
    });

    $("#exportAnalytics").on("click", exportAnalyticsReport);
});