// js/calendar.js
let calendarDate = new Date();
let selectedCalendarDate = getTodayDate();

function getMonthDateString(year, month, day) {
    return new Date(year, month, day).toISOString().slice(0, 10);
}

function getActivitiesForDate(date) {
    const workspace = loadWorkspace();
    const type = $("#calendarTypeFilter").val();

    return workspace.activities
        .filter((activity) => activity.dueDate === date)
        .filter((activity) => !type || activity.type === type)
        .sort((a, b) => a.status.localeCompare(b.status));
}

function renderSelectedDateActivities(date) {
    const workspace = loadWorkspace();
    const activities = getActivitiesForDate(date);

    $("#selectedDateLabel").text(formatDate(date));

    if (!activities.length) {
        $("#selectedDateActivities").html(renderEmptyState("No activities scheduled for this date."));
        return;
    }

    $("#selectedDateActivities").html(activities.map((activity) => {
        const statusClass = `badge-${slugify(activity.status)}`;
        const isOverdue = activity.status !== "Completed" && activity.dueDate < getTodayDate();

        return `
      <article class="timeline-card ${isOverdue ? "border-danger" : ""}">
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
        <div class="activity-toolbar mt-3">
          ${activity.status !== "Completed" ? `
            <button class="btn btn-sm btn-outline-success complete-calendar-activity" data-id="${escapeHtml(activity.id)}">
              <i class="bi bi-check2 me-1"></i> Complete
            </button>
          ` : ""}
        </div>
      </article>
    `;
    }).join(""));
}

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = getTodayDate();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();

    $("#calendarMonthLabel").text(calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }));

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let html = weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("");

    for (let i = startDay - 1; i >= 0; i -= 1) {
        html += `
      <button class="calendar-day muted" type="button" disabled>
        <span class="day-number">${previousMonthDays - i}</span>
      </button>
    `;
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = getMonthDateString(year, month, day);
        const activities = getActivitiesForDate(date);
        const isToday = date === today;
        const isSelected = date === selectedCalendarDate;

        html += `
      <button class="calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" type="button" data-date="${date}">
        <span class="day-number">${day}</span>
        ${activities.slice(0, 3).map((activity) => {
            const isOverdue = activity.status !== "Completed" && activity.dueDate < today;
            return `<span class="day-pill ${isOverdue ? "overdue" : ""}">${escapeHtml(activity.title)}</span>`;
        }).join("")}
        ${activities.length > 3 ? `<span class="day-pill">+${activities.length - 3} more</span>` : ""}
      </button>
    `;
    }

    const totalCells = startDay + daysInMonth;
    const nextCells = (7 - (totalCells % 7)) % 7;

    for (let day = 1; day <= nextCells; day += 1) {
        html += `
      <button class="calendar-day muted" type="button" disabled>
        <span class="day-number">${day}</span>
      </button>
    `;
    }

    $("#calendarGrid").html(html);
    renderSelectedDateActivities(selectedCalendarDate);
}

function createCalendarActivity() {
    const workspace = loadWorkspace();
    const title = $("#calendarActivityTitle").val().trim();
    const type = $("#calendarActivityType").val();
    const notes = $("#calendarActivityNotes").val().trim();

    if (!title || !type || !selectedCalendarDate) {
        showStatus("Please fill activity title and type.", "warning");
        return;
    }

    const activity = {
        id: generateId("activity"),
        title,
        type,
        relatedType: "Company",
        relatedId: workspace.companies[0]?.id || "",
        status: selectedCalendarDate < getTodayDate() ? "Overdue" : "Scheduled",
        dueDate: selectedCalendarDate,
        notes,
        createdAt: getTodayDate(),
        updatedAt: getTodayDate()
    };

    workspace.activities.unshift(activity);
    saveWorkspace(workspace);
    addActivityLog("Activities", "Created activity", `Created calendar activity ${title}`);
    $("#calendarActivityForm")[0].reset();
    showStatus("Calendar activity created.", "success");
    renderCalendar();
}

function markCalendarActivityCompleted(id) {
    const workspace = loadWorkspace();
    const activity = workspace.activities.find((item) => item.id === id);

    if (!activity) return;

    activity.status = "Completed";
    activity.updatedAt = getTodayDate();
    saveWorkspace(workspace);
    addActivityLog("Activities", "Completed activity", `Completed activity ${activity.title}`);
    showStatus("Activity completed.", "success");
    renderCalendar();
}

function filterCalendarActivities() {
    renderCalendar();
}

function loadCalendarTypeOptions() {
    $("#calendarTypeFilter, #calendarActivityType").each(function () {
        const isFilter = this.id === "calendarTypeFilter";
        $(this).html(`
      <option value="">${isFilter ? "All activity types" : "Select type"}</option>
      ${CRM_ACTIVITY_TYPES.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}
    `);
    });
}

function renderCalendarShell() {
    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Planning workspace</div>
        <h1 class="page-title">Calendar</h1>
        <p class="page-description">
          View scheduled sales activities by month, inspect daily work, and add lightweight calendar tasks.
        </p>
      </div>
      <div class="topbar-actions">
        <a class="btn btn-ghost" href="activities.html"><i class="bi bi-check2-square me-1"></i> Activities</a>
        <a class="btn btn-primary" href="pipeline.html"><i class="bi bi-kanban me-1"></i> Pipeline</a>
      </div>
    </div>

    <section class="calendar-layout">
      <div class="panel">
        <div class="calendar-controls">
          <div>
            <h2 class="panel-title" id="calendarMonthLabel">Month</h2>
            <p class="panel-subtitle">Click a date to inspect scheduled activities.</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-ghost icon-btn" id="previousMonth" type="button" title="Previous month">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button class="btn btn-ghost" id="todayMonth" type="button">Today</button>
            <button class="btn btn-ghost icon-btn" id="nextMonth" type="button" title="Next month">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>

        <div class="mb-3">
          <select class="form-select" id="calendarTypeFilter"></select>
        </div>

        <div class="calendar-grid" id="calendarGrid"></div>
      </div>

      <aside class="section-stack">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Selected date</h2>
              <p class="panel-subtitle" id="selectedDateLabel">Today</p>
            </div>
          </div>
          <div class="selected-date-list" id="selectedDateActivities"></div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Add calendar activity</h2>
              <p class="panel-subtitle">Creates a scheduled activity on the selected date.</p>
            </div>
          </div>

          <form id="calendarActivityForm">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label" for="calendarActivityTitle">Title</label>
                <input class="form-control" id="calendarActivityTitle" required>
              </div>
              <div class="col-12">
                <label class="form-label" for="calendarActivityType">Type</label>
                <select class="form-select" id="calendarActivityType" required></select>
              </div>
              <div class="col-12">
                <label class="form-label" for="calendarActivityNotes">Notes</label>
                <textarea class="form-control" id="calendarActivityNotes" rows="3"></textarea>
              </div>
            </div>

            <button class="btn btn-primary mt-3" type="submit">
              <i class="bi bi-calendar-plus me-1"></i> Add activity
            </button>
          </form>
        </div>
      </aside>
    </section>
  `;

    $("#app").html(buildAppShell("calendar", mainHtml));
}

$(function () {
    renderCalendarShell();
    applyThemeSettings();
    setActiveNav();
    loadCalendarTypeOptions();
    renderCalendar();

    $("#previousMonth").on("click", function () {
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
        renderCalendar();
    });

    $("#nextMonth").on("click", function () {
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
        renderCalendar();
    });

    $("#todayMonth").on("click", function () {
        calendarDate = new Date();
        selectedCalendarDate = getTodayDate();
        renderCalendar();
    });

    $("#calendarTypeFilter").on("change", filterCalendarActivities);

    $("#calendarActivityForm").on("submit", function (event) {
        event.preventDefault();
        createCalendarActivity();
    });

    $(document).on("click", ".calendar-day[data-date]", function () {
        selectedCalendarDate = $(this).data("date");
        renderCalendar();
    });

    $(document).on("click", ".complete-calendar-activity", function () {
        markCalendarActivityCompleted($(this).data("id"));
    });
});