// js/dashboard.js
let dashboardRevenueChart = null;

function renderDashboardStats() {
    const workspace = loadWorkspace();
    const openDeals = workspace.deals.filter((deal) => !["Won", "Lost"].includes(deal.stage));
    const wonDeals = workspace.deals.filter((deal) => deal.stage === "Won");
    const lostDeals = workspace.deals.filter((deal) => deal.stage === "Lost");

    $("#dashboardStats").html(`
    <div class="metric-card">
      <div class="metric-label">Total customers</div>
      <div class="metric-value">${workspace.customers.length}</div>
      <div class="metric-note">Across ${workspace.companies.length} active company accounts</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Open deals</div>
      <div class="metric-value">${openDeals.length}</div>
      <div class="metric-note">${formatCurrency(calculateForecastValue(workspace.deals))} weighted forecast</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Won deals</div>
      <div class="metric-value">${wonDeals.length}</div>
      <div class="metric-note">${formatCurrency(calculateWonValue(workspace.deals))} closed revenue</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Lost deals</div>
      <div class="metric-value">${lostDeals.length}</div>
      <div class="metric-note">${formatCurrency(calculatePipelineValue(workspace.deals))} total pipeline value</div>
    </div>
  `);
}

function renderPipelineSummary() {
    const workspace = loadWorkspace();
    const counts = calculateStageCounts(workspace.deals);
    const values = calculateStageValues(workspace.deals);
    const maxValue = Math.max(...Object.values(values), 1);

    const rows = CRM_STAGES.map((stage) => {
        const percent = Math.round((values[stage] / maxValue) * 100);

        return `
      <div class="stage-row">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between gap-3">
            <strong>${escapeHtml(stage)}</strong>
            <span class="text-muted">${counts[stage]} deals</span>
          </div>
          <div class="stage-meter"><span style="width: ${percent}%"></span></div>
        </div>
        <span class="badge-soft">${formatCurrency(values[stage])}</span>
      </div>
    `;
    }).join("");

    $("#pipelineSummary").html(rows || renderEmptyState("No pipeline data yet."));
}

function renderUpcomingActivities() {
    const workspace = loadWorkspace();
    const today = getTodayDate();

    const upcoming = workspace.activities
        .filter((activity) => activity.status !== "Completed")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 6);

    if (!upcoming.length) {
        $("#upcomingActivities").html(renderEmptyState("No upcoming activities."));
        return;
    }

    $("#upcomingActivities").html(upcoming.map((activity) => {
        const isOverdue = activity.dueDate < today;
        const badgeClass = isOverdue ? "badge-overdue" : "badge-scheduled";

        return `
      <div class="activity-row">
        <div>
          <strong>${escapeHtml(activity.title)}</strong>
          <div class="text-muted small">
            ${escapeHtml(activity.type)} · ${escapeHtml(getRelatedLabel(workspace, activity.relatedType, activity.relatedId))}
          </div>
        </div>
        <span class="badge-soft ${badgeClass}">${formatDate(activity.dueDate)}</span>
      </div>
    `;
    }).join(""));
}

function renderRecentActivityLog() {
    const workspace = loadWorkspace();
    const logs = workspace.activityLog.slice(0, 7);

    if (!logs.length) {
        $("#recentActivityLog").html(renderEmptyState("No recent activity yet."));
        return;
    }

    $("#recentActivityLog").html(logs.map((log) => `
    <div class="log-row">
      <div>
        <strong>${escapeHtml(log.action)}</strong>
        <div class="text-muted small">${escapeHtml(log.detail)}</div>
      </div>
      <span class="badge-soft">${escapeHtml(log.module)}</span>
    </div>
  `).join(""));
}

function renderRevenueChart() {
    const workspace = loadWorkspace();
    const ctx = document.getElementById("monthlyRevenueChart");

    if (!ctx || typeof Chart === "undefined") return;

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const wonRevenue = monthLabels.map((label, index) => {
        const monthNumber = index;
        return workspace.deals
            .filter((deal) => deal.stage === "Won")
            .filter((deal) => {
                const date = new Date(`${deal.updatedAt || deal.expectedCloseDate}T00:00:00`);
                return date.getMonth() === monthNumber;
            })
            .reduce((total, deal) => total + Number(deal.value || 0), 0);
    });

    const forecastRevenue = monthLabels.map((label, index) => {
        const monthNumber = index;
        return workspace.deals
            .filter((deal) => !["Won", "Lost"].includes(deal.stage))
            .filter((deal) => {
                const date = new Date(`${deal.expectedCloseDate}T00:00:00`);
                return date.getMonth() === monthNumber;
            })
            .reduce((total, deal) => total + (Number(deal.value || 0) * Number(deal.probability || 0)) / 100, 0);
    });

    if (dashboardRevenueChart) {
        dashboardRevenueChart.destroy();
    }

    dashboardRevenueChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: "Won revenue",
                    data: wonRevenue,
                    borderColor: "#4ade80",
                    backgroundColor: "rgba(74, 222, 128, 0.14)",
                    tension: 0.38,
                    fill: true
                },
                {
                    label: "Forecast",
                    data: forecastRevenue,
                    borderColor: "#22d3ee",
                    backgroundColor: "rgba(34, 211, 238, 0.12)",
                    tension: 0.38,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: getComputedStyle(document.body).getPropertyValue("--text") }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#9aabc7" },
                    grid: { color: "rgba(154, 171, 199, 0.12)" }
                },
                y: {
                    ticks: {
                        color: "#9aabc7",
                        callback: (value) => formatCurrency(value)
                    },
                    grid: { color: "rgba(154, 171, 199, 0.12)" }
                }
            }
        }
    });
}

function renderDashboardShell() {
    const workspace = loadWorkspace();

    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Command center</div>
        <h1 class="page-title">${escapeHtml(workspace.settings.crmName)} Dashboard</h1>
        <p class="page-description">
          Monitor sales performance, pipeline health, customer activity, and upcoming work from one enterprise CRM workspace.
        </p>
      </div>
      <div class="topbar-actions">
        <a class="btn btn-primary" href="deals.html"><i class="bi bi-plus-lg me-1"></i> New deal</a>
        <a class="btn btn-ghost" href="analytics.html"><i class="bi bi-bar-chart me-1"></i> Analytics</a>
      </div>
    </div>

    <section id="dashboardStats" class="metric-grid mb-3"></section>

    <section class="dashboard-hero">
      <div class="panel chart-shell">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Revenue trend</h2>
            <p class="panel-subtitle">Won revenue and weighted forecast by month</p>
          </div>
        </div>
        <canvas id="monthlyRevenueChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Quick actions</h2>
            <p class="panel-subtitle">Jump into common CRM workflows</p>
          </div>
        </div>
        <div class="quick-actions">
          <a class="quick-action-card" href="customers.html">
            <strong><i class="bi bi-person-plus me-1"></i> Add customer</strong>
            <div class="text-muted small mt-2">Create or manage contacts.</div>
          </a>
          <a class="quick-action-card" href="companies.html">
            <strong><i class="bi bi-building-add me-1"></i> Add company</strong>
            <div class="text-muted small mt-2">Track accounts and industries.</div>
          </a>
          <a class="quick-action-card" href="activities.html">
            <strong><i class="bi bi-check2-square me-1"></i> Schedule task</strong>
            <div class="text-muted small mt-2">Plan calls, demos, and follow-ups.</div>
          </a>
          <a class="quick-action-card" href="pipeline.html">
            <strong><i class="bi bi-kanban me-1"></i> Move pipeline</strong>
            <div class="text-muted small mt-2">Drag deals through stages.</div>
          </a>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Pipeline stage summary</h2>
            <p class="panel-subtitle">Deal count and value by stage</p>
          </div>
          <a class="btn btn-sm btn-ghost" href="pipeline.html">Open board</a>
        </div>
        <div id="pipelineSummary" class="stage-list"></div>
      </div>

      <div class="section-stack">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Upcoming activities</h2>
              <p class="panel-subtitle">Scheduled work that needs attention</p>
            </div>
          </div>
          <div id="upcomingActivities" class="activity-list"></div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Recent activity log</h2>
              <p class="panel-subtitle">Latest workspace changes</p>
            </div>
          </div>
          <div id="recentActivityLog" class="log-list"></div>
        </div>
      </div>
    </section>
  `;

    $("#app").html(buildAppShell("dashboard", mainHtml));
}

$(function () {
    renderDashboardShell();
    applyThemeSettings();
    setActiveNav();
    renderDashboardStats();
    renderPipelineSummary();
    renderUpcomingActivities();
    renderRecentActivityLog();
    renderRevenueChart();
});