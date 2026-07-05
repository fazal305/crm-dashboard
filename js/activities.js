// js/activities.js
let editingActivityId = null;

function loadActivityFormOptions() {
    const workspace = loadWorkspace();

    $("#activityType, #filterActivityType").each(function () {
        const isFilter = this.id === "filterActivityType";
        $(this).html(`
      <option value="">${isFilter ? "All types" : "Select type"}</option>
      ${CRM_ACTIVITY_TYPES.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}
    `);
    });

    $("#activityRelatedType, #filterRelatedType").each(function () {
        const isFilter = this.id === "filterRelatedType";
        $(this).html(`
      <option value="">${isFilter ? "All related records" : "Select related type"}</option>
      <option value="Customer">Customer</option>
      <option value="Company">Company</option>
      <option value="Deal">Deal</option>
    `);
    });

    $("#filterActivityStatus").html(`
    <option value="">All statuses</option>
    <option value="Scheduled">Scheduled</option>
    <option value="Completed">Completed</option>
    <option value="Overdue">Overdue</option>
  `);

    loadRelatedOptions();
}

function loadRelatedOptions() {
    const workspace = loadWorkspace();
    const type = $("#activityRelatedType").val();

    let options = `<option value="">Select record</option>`;

    if (type === "Customer") {
        options += workspace.customers.map((customer) => `
      <option value="${escapeHtml(customer.id)}">${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}</option>
    `).join("");
    }

    if (type === "Company") {
        options += workspace.companies.map((company) => `
      <option value="${escapeHtml(company.id)}">${escapeHtml(company.name)}</option>
    `).join("");
    }

    if (type === "Deal") {
        options += workspace.deals.map((deal) => `
      <option value="${escapeHtml(deal.id)}">${escapeHtml(deal.title)}</option>
    `).join("");
    }

    $("#activityRelatedId").html(options);
}

function getActivityFormData() {
    return {
        title: $("#activityTitle").val().trim(),
        type: $("#activityType").val(),
        relatedType: $("#activityRelatedType").val(),
        relatedId: $("#activityRelatedId").val(),
        status: $("#activityStatus").val(),
        dueDate: $("#activityDueDate").val(),
        notes: $("#activityNotes").val().trim()
    };
}

function clearActivityForm() {
    editingActivityId = null;
    $("#activityForm")[0].reset();
    $("#activityStatus").val("Scheduled");
    $("#activityFormTitle").text("Add activity");
    $("#activitySubmitLabel").text("Create activity");
    $("#cancelActivityEdit").addClass("d-none");
    loadRelatedOptions();
}

function createActivity() {
    const workspace = loadWorkspace();
    const data = getActivityFormData();

    if (!data.title || !data.type || !data.relatedType || !data.relatedId || !data.status || !data.dueDate) {
        showStatus("Please fill title, type, related record, status, and due date.", "warning");
        return;
    }

    if (data.status !== "Completed" && data.dueDate < getTodayDate()) {
        data.status = "Overdue";
    }

    if (editingActivityId) {
        const activity = workspace.activities.find((item) => item.id === editingActivityId);
        if (!activity) return;

        Object.assign(activity, data, { updatedAt: getTodayDate() });
        saveWorkspace(workspace);
        addActivityLog("Activities", "Updated activity", `Updated activity ${data.title}`);
        showStatus("Activity updated.", "success");
    } else {
        const activity = {
            id: generateId("activity"),
            ...data,
            createdAt: getTodayDate(),
            updatedAt: getTodayDate()
        };

        workspace.activities.unshift(activity);
        saveWorkspace(workspace);
        addActivityLog("Activities", "Created activity", `Created activity ${data.title}`);
        showStatus("Activity created.", "success");
    }

    clearActivityForm();
    renderActivities();
}

function editActivity(id) {
    const workspace = loadWorkspace();
    const activity = workspace.activities.find((item) => item.id === id);

    if (!activity) {
        showStatus("Activity not found.", "danger");
        return;
    }

    editingActivityId = id;
    $("#activityTitle").val(activity.title);
    $("#activityType").val(activity.type);
    $("#activityRelatedType").val(activity.relatedType);
    loadRelatedOptions();
    $("#activityRelatedId").val(activity.relatedId);
    $("#activityStatus").val(activity.status);
    $("#activityDueDate").val(activity.dueDate);
    $("#activityNotes").val(activity.notes);
    $("#activityFormTitle").text("Edit activity");
    $("#activitySubmitLabel").text("Save changes");
    $("#cancelActivityEdit").removeClass("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteActivity(id) {
    const workspace = loadWorkspace();
    const activity = workspace.activities.find((item) => item.id === id);

    if (!activity) return;

    workspace.activities = workspace.activities.filter((item) => item.id !== id);
    saveWorkspace(workspace);
    addActivityLog("Activities", "Deleted activity", `Deleted activity ${activity.title}`);
    showStatus("Activity deleted.", "success");
    renderActivities();
}

function markActivityCompleted(id) {
    const workspace = loadWorkspace();
    const activity = workspace.activities.find((item) => item.id === id);

    if (!activity) return;

    activity.status = "Completed";
    activity.updatedAt = getTodayDate();
    saveWorkspace(workspace);
    addActivityLog("Activities", "Completed activity", `Completed activity ${activity.title}`);
    showStatus("Activity marked completed.", "success");
    renderActivities();
}

function filterActivities() {
    const workspace = loadWorkspace();
    const search = $("#activitySearch").val().toLowerCase().trim();
    const type = $("#filterActivityType").val();
    const status = $("#filterActivityStatus").val();
    const relatedType = $("#filterRelatedType").val();

    return workspace.activities.filter((activity) => {
        const relatedLabel = getRelatedLabel(workspace, activity.relatedType, activity.relatedId).toLowerCase();

        const matchesSearch = !search ||
            activity.title.toLowerCase().includes(search) ||
            activity.notes.toLowerCase().includes(search) ||
            relatedLabel.includes(search);

        const matchesType = !type || activity.type === type;
        const matchesStatus = !status || activity.status === status;
        const matchesRelatedType = !relatedType || activity.relatedType === relatedType;

        return matchesSearch && matchesType && matchesStatus && matchesRelatedType;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function renderActivityMetrics() {
    const workspace = loadWorkspace();
    const scheduled = workspace.activities.filter((activity) => activity.status === "Scheduled").length;
    const completed = workspace.activities.filter((activity) => activity.status === "Completed").length;
    const overdue = workspace.activities.filter((activity) => activity.status === "Overdue").length;

    $("#activityMetrics").html(`
    <div class="metric-card">
      <div class="metric-label">Scheduled</div>
      <div class="metric-value">${scheduled}</div>
      <div class="metric-note">Open follow-ups and tasks</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Completed</div>
      <div class="metric-value">${completed}</div>
      <div class="metric-note">Finished sales activities</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Overdue</div>
      <div class="metric-value">${overdue}</div>
      <div class="metric-note">Needs immediate attention</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total activities</div>
      <div class="metric-value">${workspace.activities.length}</div>
      <div class="metric-note">Across customers, companies, and deals</div>
    </div>
  `);
}

function renderActivities() {
    const workspace = loadWorkspace();
    const activities = filterActivities();

    renderActivityMetrics();
    $("#activityCount").text(`${activities.length} shown`);

    if (!activities.length) {
        $("#activityTimeline").html(renderEmptyState("No activities match your filters."));
        return;
    }

    $("#activityTimeline").html(activities.map((activity) => {
        const statusClass = `badge-${slugify(activity.status)}`;

        return `
      <article class="timeline-card">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h3 class="timeline-title">${escapeHtml(activity.title)}</h3>
            <div class="timeline-meta">
              ${escapeHtml(activity.type)} · ${escapeHtml(activity.relatedType)} ·
              ${escapeHtml(getRelatedLabel(workspace, activity.relatedType, activity.relatedId))}
            </div>
          </div>
          <span class="badge-soft ${statusClass}">${escapeHtml(activity.status)}</span>
        </div>

        <p class="timeline-notes">${escapeHtml(activity.notes || "No notes added.")}</p>

        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
          <span class="text-muted small"><i class="bi bi-calendar-event me-1"></i>${formatDate(activity.dueDate)}</span>
          <div class="activity-toolbar">
            ${activity.status !== "Completed" ? `
              <button class="btn btn-sm btn-outline-success complete-activity" data-id="${escapeHtml(activity.id)}">
                <i class="bi bi-check2 me-1"></i> Complete
              </button>
            ` : ""}
            <button class="btn btn-sm btn-ghost edit-activity" data-id="${escapeHtml(activity.id)}">
              <i class="bi bi-pencil me-1"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger delete-activity" data-id="${escapeHtml(activity.id)}">
              <i class="bi bi-trash me-1"></i> Delete
            </button>
          </div>
        </div>
      </article>
    `;
    }).join(""));
}

function renderActivitiesShell() {
    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Sales execution</div>
        <h1 class="page-title">Activities</h1>
        <p class="page-description">
          Schedule calls, emails, meetings, demos, follow-ups, and tasks against CRM records.
        </p>
      </div>
      <div class="topbar-actions">
        <a class="btn btn-ghost" href="calendar.html"><i class="bi bi-calendar3 me-1"></i> Calendar</a>
        <a class="btn btn-primary" href="deals.html"><i class="bi bi-cash-coin me-1"></i> Deals</a>
      </div>
    </div>

    <section class="metric-grid mb-3" id="activityMetrics"></section>

    <section class="activity-layout">
      <aside class="form-panel panel">
        <div class="form-header">
          <div>
            <h2 class="panel-title" id="activityFormTitle">Add activity</h2>
            <p class="panel-subtitle">Plan work and link it to a customer, company, or deal.</p>
          </div>
        </div>

        <form id="activityForm">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="activityTitle">Title</label>
              <input class="form-control" id="activityTitle" required>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="activityType">Type</label>
              <select class="form-select" id="activityType" required></select>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="activityStatus">Status</label>
              <select class="form-select" id="activityStatus" required>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="activityRelatedType">Related type</label>
              <select class="form-select" id="activityRelatedType" required></select>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="activityRelatedId">Related record</label>
              <select class="form-select" id="activityRelatedId" required></select>
            </div>
            <div class="col-12">
              <label class="form-label" for="activityDueDate">Due date</label>
              <input class="form-control" id="activityDueDate" type="date" required>
            </div>
            <div class="col-12">
              <label class="form-label" for="activityNotes">Notes</label>
              <textarea class="form-control" id="activityNotes" rows="4"></textarea>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 mt-4">
            <button class="btn btn-primary" type="submit">
              <i class="bi bi-save me-1"></i> <span id="activitySubmitLabel">Create activity</span>
            </button>
            <button class="btn btn-ghost d-none" id="cancelActivityEdit" type="button">Cancel</button>
          </div>
        </form>
      </aside>

      <section class="table-panel panel">
        <div class="table-header">
          <div>
            <h2 class="panel-title">Activity timeline</h2>
            <p class="panel-subtitle">Search, filter, edit, and complete scheduled work.</p>
          </div>
          <span class="badge-soft" id="activityCount">0 shown</span>
        </div>

        <div class="filter-bar">
          <input class="form-control" id="activitySearch" placeholder="Search activity, notes, related record">
          <select class="form-select" id="filterActivityType"></select>
          <select class="form-select" id="filterActivityStatus"></select>
          <select class="form-select" id="filterRelatedType"></select>
        </div>

        <div class="timeline" id="activityTimeline"></div>
      </section>
    </section>
  `;

    $("#app").html(buildAppShell("activities", mainHtml));
}

$(function () {
    renderActivitiesShell();
    applyThemeSettings();
    setActiveNav();
    loadActivityFormOptions();
    renderActivities();

    $("#activityForm").on("submit", function (event) {
        event.preventDefault();
        createActivity();
    });

    $("#activityRelatedType").on("change", loadRelatedOptions);
    $("#cancelActivityEdit").on("click", clearActivityForm);

    $("#activitySearch, #filterActivityType, #filterActivityStatus, #filterRelatedType").on("input change", renderActivities);

    $(document).on("click", ".edit-activity", function () {
        editActivity($(this).data("id"));
    });

    $(document).on("click", ".delete-activity", function () {
        deleteActivity($(this).data("id"));
    });

    $(document).on("click", ".complete-activity", function () {
        markActivityCompleted($(this).data("id"));
    });
});