# CRM Dashboard

A browser-based enterprise CRM dashboard for managing customers,
companies, deals, sales activities, calendars, sales pipelines,
analytics, and local workspace persistence.

## Live Links

- GitHub Repository: [fazal305/crm-dashboard](https://github.com/fazal305/crm-dashboard)
- Live Demo: [https://fazal305.github.io/crm-dashboard/](https://fazal305.github.io/crm-dashboard/)

## Overview

CRM Dashboard is a frontend-only customer relationship management system inspired by enterprise tools like Salesforce and HubSpot. It demonstrates multi-page browser architecture, localStorage state persistence, CRUD workflows, sales pipeline logic, charts, filters, and a polished SaaS interface without build tools or frameworks.

## Pages

- Dashboard: CRM overview, metrics, revenue chart, pipeline summary, quick actions, upcoming activities, and recent activity log
- Customers: Add, edit, delete, search, and filter customer contacts
- Companies: Manage company accounts, industries, sizes, websites, cities, related customer counts, and deal value
- Deals: Track deal value, probability, owner, expected close date, customer, company, and stage
- Activities: Schedule calls, emails, meetings, demos, follow-ups, and tasks
- Calendar: Monthly calendar view for scheduled activities
- Pipeline: Kanban-style drag-and-drop sales pipeline
- Analytics: Chart.js reporting, forecast calculations, top company ranking, and JSON export
- Settings: CRM preferences, dark mode, compact sidebar, workspace import/export, reset, and localStorage controls

## Features

- Multi-page browser application
- Shared sidebar and consistent navigation
- Active navigation highlighting
- Bootstrap-based enterprise UI
- jQuery-powered interactions
- Chart.js dashboard and analytics charts
- CRUD workflows for customers, companies, deals, and activities
- Search and filter tools across modules
- Drag-and-drop pipeline board
- Monthly activity calendar
- localStorage workspace persistence
- Demo data seeding
- Dark mode and light mode support
- Compact sidebar preference
- Workspace JSON export and import
- Analytics report JSON export
- Responsive layout for desktop, tablet, and mobile

## Technologies Used

- HTML5
- CSS3
- Bootstrap 5
- jQuery
- Vanilla JavaScript
- Chart.js
- Drag and Drop API
- LocalStorage
- Blob API
- Clipboard API

## Learning Outcomes

- Design a multi-page frontend application without a framework
- Build reusable shared utilities while keeping page-specific logic separate
- Model CRM data in browser storage
- Implement CRUD flows with form state, validation, editing, and deletion rules
- Create searchable and filterable enterprise tables
- Use Chart.js for sales dashboards and analytics
- Build drag-and-drop state updates with persistence
- Create a calendar view from stored activity data
- Export and import browser workspace data as JSON
- Maintain consistent UI patterns across a larger frontend project

## Architecture Notes

- Multi-page frontend architecture: each major CRM module has its own HTML file and is loaded through normal browser navigation.
- Shared JavaScript utilities: `js/shared.js` owns workspace loading, saving, seeding, formatting, navigation rendering, ID generation, logging, calculations, JSON export, theme application, and helper labels.
- Shared CSS plus page-specific CSS: `styles.css` defines global layout, theme variables, sidebar, panels, tables, buttons, forms, badges, responsive behavior, and common UI primitives. Each file in `css/` contains styles for one page only.
- localStorage workspace model: the app stores a single CRM workspace object under one localStorage key and treats it as the source of truth.
- CRM CRUD workflows: customers, companies, deals, and activities support create, edit, delete, search, filter, and persisted updates.
- Pipeline drag/drop state updates: deal cards are draggable between stage columns, and the deal stage is saved immediately after drop.
- Chart.js analytics rendering: dashboard and analytics pages load Chart.js from CDN and render revenue, stage, customer, and activity charts.
- No-build browser architecture: the project uses plain HTML, CSS, Bootstrap CDN, jQuery CDN, Chart.js CDN, and vanilla JavaScript. It runs by opening `index.html`.

## Folder Structure

```text
crm-dashboard/
  index.html
  customers.html
  companies.html
  deals.html
  activities.html
  calendar.html
  pipeline.html
  analytics.html
  settings.html

  styles.css

  css/
    dashboard.css
    customers.css
    companies.css
    deals.css
    activities.css
    calendar.css
    pipeline.css
    analytics.css
    settings.css

  js/
    shared.js
    dashboard.js
    customers.js
    companies.js
    deals.js
    activities.js
    calendar.js
    pipeline.js
    analytics.js
    settings.js

  README.md
  LICENSE
  .gitignore
```

How To Run Locally
git clone https://github.com/fazal305/crm-dashboard.git
cd crm-dashboard
Open index.html directly in your browser.
How To Use
Open index.html.
Review dashboard metrics, pipeline summary, upcoming activities, and recent activity.
Go to Companies and create or update company accounts.
Go to Customers and assign contacts to companies and owners.
Go to Deals and create opportunities with values, stages, probabilities, and expected close dates.
Go to Activities and schedule sales work against customers, companies, or deals.
Go to Calendar to view activities by date and add lightweight calendar tasks.
Go to Pipeline and drag deal cards between stages.
Go to Analytics to inspect charts, forecasts, and top company value.
Go to Settings to update preferences, export/import workspace JSON, reset demo data, or clear localStorage.
Sample Workflow
Add company: create a new account with industry, size, website, and city.
Add customer: create a contact and assign the contact to the company.
Create deal: create an opportunity for that customer and company with value, probability, owner, and stage.
Schedule activity: add a call, email, meeting, demo, follow-up, or task linked to the deal.
Move deal through pipeline: drag the deal card from New to Qualified, Proposal, Negotiation, Won, or Lost.
View analytics: inspect revenue by stage, deals by stage, customers by status, activities by type, top companies, and forecast.
Export workspace: download the full local CRM workspace as JSON from Settings.
