// js/settings.js
function renderSettingsForm() {
    const workspace = loadWorkspace();

    $("#crmName").val(workspace.settings.crmName);
    $("#adminEmail").val(workspace.settings.adminEmail);
    $("#defaultCurrency").val(workspace.settings.currency);
    $("#defaultStage").val(workspace.settings.defaultStage);
    $("#darkModeToggle").prop("checked", Boolean(workspace.settings.darkMode));
    $("#compactSidebarToggle").prop("checked", Boolean(workspace.settings.compactSidebar));

    $("#settingsPreview").html(`
    <div class="preview-row"><span>CRM name</span><strong>${escapeHtml(workspace.settings.crmName)}</strong></div>
    <div class="preview-row"><span>Admin email</span><strong>${escapeHtml(workspace.settings.adminEmail)}</strong></div>
    <div class="preview-row"><span>Currency</span><strong>${escapeHtml(workspace.settings.currency)}</strong></div>
    <div class="preview-row"><span>Default stage</span><strong>${escapeHtml(workspace.settings.defaultStage)}</strong></div>
    <div class="preview-row"><span>Customers</span><strong>${workspace.customers.length}</strong></div>
    <div class="preview-row"><span>Companies</span><strong>${workspace.companies.length}</strong></div>
    <div class="preview-row"><span>Deals</span><strong>${workspace.deals.length}</strong></div>
    <div class="preview-row"><span>Activities</span><strong>${workspace.activities.length}</strong></div>
  `);
}

function saveSettings() {
    const workspace = loadWorkspace();

    workspace.settings.crmName = $("#crmName").val().trim() || "NightCity CRM";
    workspace.settings.adminEmail = $("#adminEmail").val().trim() || "admin@example.com";
    workspace.settings.currency = $("#defaultCurrency").val();
    workspace.settings.defaultStage = $("#defaultStage").val();
    workspace.settings.darkMode = $("#darkModeToggle").is(":checked");
    workspace.settings.compactSidebar = $("#compactSidebarToggle").is(":checked");

    saveWorkspace(workspace);
    addActivityLog("Settings", "Saved settings", "Updated CRM workspace settings");
    applyThemeSettings();
    $(".brand-title").text(workspace.settings.crmName);
    renderSettingsForm();
    showStatus("Settings saved.", "success");
}

function toggleDarkMode() {
    const workspace = loadWorkspace();
    workspace.settings.darkMode = $("#darkModeToggle").is(":checked");
    saveWorkspace(workspace);
    applyThemeSettings();
}

function toggleCompactSidebar() {
    const workspace = loadWorkspace();
    workspace.settings.compactSidebar = $("#compactSidebarToggle").is(":checked");
    saveWorkspace(workspace);
    applyThemeSettings();
}

function exportWorkspace() {
    const workspace = loadWorkspace();
    downloadJson(`crm-workspace-${getTodayDate()}.json`, workspace);
    showStatus("Workspace exported.", "success");
}

function importWorkspace(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
        try {
            const data = JSON.parse(reader.result);

            if (!data.settings || !Array.isArray(data.customers) || !Array.isArray(data.companies) || !Array.isArray(data.deals) || !Array.isArray(data.activities)) {
                showStatus("Invalid workspace file.", "danger");
                return;
            }

            saveWorkspace({
                ...structuredClone(defaultWorkspace),
                ...data,
                settings: {
                    ...defaultWorkspace.settings,
                    ...data.settings
                },
                activityLog: Array.isArray(data.activityLog) ? data.activityLog : []
            });

            applyThemeSettings();
            renderSettingsForm();
            addActivityLog("Settings", "Imported workspace", "Imported workspace JSON");
            showStatus("Workspace imported.", "success");
        } catch (error) {
            console.error(error);
            showStatus("Could not import workspace JSON.", "danger");
        } finally {
            $("#importWorkspaceFile").val("");
        }
    };

    reader.readAsText(file);
}

function resetDemoWorkspace() {
    resetWorkspace();
    renderSettingsForm();
    showStatus("Demo data restored.", "success");
}

function clearWorkspace() {
    localStorage.removeItem(CRM_STORAGE_KEY);
    const workspace = structuredClone(defaultWorkspace);
    saveWorkspace(workspace);
    applyThemeSettings();
    renderSettingsForm();
    showStatus("Workspace cleared.", "warning");
}

function renderSettingsShell() {
    const mainHtml = `
    <div class="topbar">
      <div>
        <button class="btn btn-ghost mobile-nav-toggle mb-3" type="button">
          <i class="bi bi-list"></i>
        </button>
        <div class="page-kicker">Workspace control</div>
        <h1 class="page-title">Settings</h1>
        <p class="page-description">
          Configure CRM identity, currency, default stage, theme behavior, and local workspace portability.
        </p>
      </div>
      <div class="topbar-actions">
        <button class="btn btn-primary" id="exportWorkspaceButton" type="button">
          <i class="bi bi-download me-1"></i> Export workspace
        </button>
      </div>
    </div>

    <section class="settings-layout">
      <div>
        <section class="settings-section">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">CRM preferences</h2>
              <p class="panel-subtitle">These settings affect labels, formatting, and default deal behavior.</p>
            </div>
          </div>

          <form id="settingsForm">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="crmName">CRM name</label>
                <input class="form-control" id="crmName" required>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="adminEmail">Admin email</label>
                <input class="form-control" id="adminEmail" type="email" required>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="defaultCurrency">Default currency</label>
                <select class="form-select" id="defaultCurrency">
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="defaultStage">Default pipeline stage</label>
                <select class="form-select" id="defaultStage">
                  <option value="New">New</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div class="col-md-6">
                <div class="form-check form-switch mt-3">
                  <input class="form-check-input" id="darkModeToggle" type="checkbox">
                  <label class="form-check-label" for="darkModeToggle">Dark mode</label>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-check form-switch mt-3">
                  <input class="form-check-input" id="compactSidebarToggle" type="checkbox">
                  <label class="form-check-label" for="compactSidebarToggle">Compact sidebar</label>
                </div>
              </div>
            </div>

            <button class="btn btn-primary mt-4" type="submit">
              <i class="bi bi-save me-1"></i> Save settings
            </button>
          </form>
        </section>

        <section class="settings-section">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Workspace import</h2>
              <p class="panel-subtitle">Restore a previously exported CRM workspace JSON file.</p>
            </div>
          </div>

          <div class="import-box">
            <input class="form-control" id="importWorkspaceFile" type="file" accept="application/json">
          </div>
        </section>

        <section class="settings-section workspace-danger">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Data controls</h2>
              <p class="panel-subtitle">Reset demo data or clear this browser workspace.</p>
            </div>
          </div>

          <div class="settings-actions">
            <button class="btn btn-ghost" id="resetDemoButton" type="button">
              <i class="bi bi-arrow-clockwise me-1"></i> Reset demo data
            </button>
            <button class="btn btn-outline-danger" id="clearWorkspaceButton" type="button">
              <i class="bi bi-trash3 me-1"></i> Clear localStorage
            </button>
          </div>
        </section>
      </div>

      <aside class="settings-section">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Workspace summary</h2>
            <p class="panel-subtitle">Current local CRM state.</p>
          </div>
        </div>
        <div class="settings-preview" id="settingsPreview"></div>
      </aside>
    </section>
  `;

    $("#app").html(buildAppShell("settings", mainHtml));
}

$(function () {
    renderSettingsShell();
    applyThemeSettings();
    setActiveNav();
    renderSettingsForm();

    $("#settingsForm").on("submit", function (event) {
        event.preventDefault();
        saveSettings();
    });

    $("#darkModeToggle").on("change", toggleDarkMode);
    $("#compactSidebarToggle").on("change", toggleCompactSidebar);
    $("#exportWorkspaceButton").on("click", exportWorkspace);
    $("#importWorkspaceFile").on("change", importWorkspace);
    $("#resetDemoButton").on("click", resetDemoWorkspace);
    $("#clearWorkspaceButton").on("click", clearWorkspace);
});