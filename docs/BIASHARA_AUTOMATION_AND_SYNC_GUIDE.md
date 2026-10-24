# Biashara Automation & Sync Centre — Operator Guide

**Audience:** Business Owner and authorized business team members  
**Purpose:** Use Biashara's operational modules correctly, configure automation rules, queue synchronization requests, and verify every record in its proper business workspace.

> **Core rule:** The business ID and the record type determine where a record belongs. Automation and Sync Centre are control/queue screens; they are not universal document folders. Creating a rule or queueing a sync request does not prove that a job has executed or that imported data has reached its destination.

## 1. Before using Biashara

1. Sign in with your existing RevelaCode/Jumuiya account.
2. Open **Jumuiya → Biashara** and confirm the active business shown in the workspace header.
3. Select the correct business before editing or synchronizing data. A user may have access to more than one business; records are scoped to the selected business.
4. Complete the business profile and required verification first. The current Finance, Automation, Sync Centre, Team, and business-switch contracts require an active, verified business and business-owner access.
5. Use an authorized account and never share access tokens, invitation tokens, or payment references in public channels.

Biashara operates through the existing RevelaCode/Jumuiya backend and its current data store. Do not create a second database or make a separate copy of products, orders, customers, or finance records in order to make the modules work.

## 2. What the main modules own

| Module | Records that belong here | How records are created or maintained today |
|---|---|---|
| Business profile | Business name, type/category, contacts, location, description and business status | Use **Business profile** and save the profile. |
| Products and stock | Product catalogue, SKU/identifiers where supplied, category, selling/cost prices, stock quantity and low-stock threshold | Use **Products and stock** to create/update products. Use the Inventory adjustment action for a stock correction or movement. |
| Inventory / stock health | Current quantity, low-stock list, and recorded stock adjustments/history | The API provides low-stock and inventory-history/adjustment operations. Do not represent a stock correction as a sale unless a sale actually occurred. |
| Orders | Customer orders and their lifecycle/status | Use **Orders** to create/review an order and update its status through the order workflow. |
| Customers | Customer contact and business relationship records | Use **Customers** to create/find a customer. Do not use an order record as a substitute for a customer profile. |
| Sales | Completed direct or point-of-sale transactions, including walk-in sales that may not begin as an order | Use **Record a sale**. A sale is not automatically an order, and an order is not automatically a completed sale. |
| Expenses | Business expenses and spending records | The existing backend provides an expenses endpoint. The currently inspected main navigation does not show a dedicated standalone Expenses tab; use the currently exposed entry point if present and confirm the record in reporting before relying on it. |
| Finance | Invoices and payment-allocation records | Use **Finance** to create an invoice and record an allocation against that invoice. An allocation is an internal record, not confirmation that a payment provider processed the money. |
| Website | Storefront settings and public-facing business website configuration | Use **Website** / Website Builder and save the website settings separately from the business profile. Preview/publish operations must be checked independently. |
| Website inquiries | Questions or enquiries submitted through the public business website | Review the website inquiries area. An inquiry is not automatically a customer, order, invoice, or sale unless a supported conversion workflow is performed. |
| Analytics and Intelligence | Summaries and analysis based on available business records | Refresh the report and check its data range/source. Insights are views over source records, not a substitute for entering the underlying transaction. |
| Alerts | Operational signals derived from currently available business data | Review alerts and validate the source item (for example, a low-stock product or an order). |
| Automations | Rule configuration and rule status | Rules can be recorded in the current centre; execution requires a compatible worker. See Section 3. |
| Sync Centre | Synchronization request records and their reported processing status | The current UI can queue a request. A worker must process it before it can be considered a completed sync. See Section 4. |
| Team | Business memberships and invitations | The owner manages roles/invitations. Current invitation creation requires the one-time invitation token to be shared securely; email delivery is not configured by this contract. |
| Switch business | Available business workspaces for the signed-in account | Select the intended business and refresh the workspace before continuing. |

## 3. Automations

The **Automations** screen stores supported rule configuration for the active business. At present, it must be treated as configuration-only.

### Create a rule

1. Confirm the correct business is active and verified.
2. Open **Automations**.
3. Enter a clear, unique rule name.
4. Select a trigger and action from the supported choices below.
5. Save the rule and confirm it appears in the rules list.

Supported triggers in the current UI/API contract:

- `low_stock` — a stock threshold event.
- `order_created` — a new order event.
- `invoice_overdue` — an overdue-invoice event.
- `daily_summary` — a daily summary schedule.

Supported actions in the current UI/API contract:

- `create_alert`
- `create_task`
- `daily_summary`

The current UI creates rules with `enabled: false`. The backend records them with `execution_mode: configuration_only` and explicitly rejects enabling a rule until a supported worker is configured. Do not interpret a saved or displayed rule as an active automation.

### How to validate an automation

1. Confirm the rule appears under the correct business.
2. Confirm its name, trigger, action, and enabled status.
3. Check that the application indicates execution is not yet available.
4. Do **not** create duplicate rules in an attempt to force execution.
5. Once the compatible worker is implemented and enabled, test one low-risk case, inspect its job/result/log, and verify the outcome in the proper destination module.

### Expected future routing for automation outcomes

| Trigger | Expected action output | Destination to verify |
|---|---|---|
| Low stock | Create alert/task | Alerts, linked to the affected product and stock level |
| Order created | Create alert/task | Alerts or an operational task linked to the order |
| Invoice overdue | Create alert/task | Finance, linked to the invoice; alert/task should point to the same invoice |
| Daily summary | Daily summary | A designated business summary/notification view |

This table describes the intended workflow. Until an execution worker is configured, the rule is only saved configuration and these actions must not be assumed to have happened.

## 4. Sync Centre

The **Sync Centre** records requests to synchronize data from a supported source. It currently does not claim that a connector or import worker has run.

### Queue a request

1. Select the correct, active business.
2. Open **Sync Centre**.
3. Choose one of the source values currently accepted by the API:
   - `csv_import`
   - `website`
   - `inventory`
   - `orders`
4. Choose a direction:
   - **Pull** — request data to be brought into the business system.
   - **Push** — request data to be sent outward.
   - **Bidirectional** — request exchange in both directions.
5. Select **Queue sync**.
6. Confirm that the request appears in the Sync Centre list.
7. Read the status and message. A newly created request is `queued` and explicitly says that no external sync has run yet.

The current API recognizes the status vocabulary `queued`, `running`, `succeeded`, `failed`, and `cancelled`. A status should only be treated as completed when a configured worker has actually processed the request and returned a terminal result. Do not change a status manually or infer success from the presence of a queue row.

### Critical CSV/import limitation

Although **CSV import** is a selectable Sync Centre source, the inspected Biashara UI/backend contract only creates a sync-job record with source, direction, status, progress and message. It does **not** upload, parse, validate, map, or insert the CSV rows in that workflow, and the current contract says the worker must process the request before it can be marked complete.

Therefore, **queueing a CSV sync is not the same as importing a CSV file**. Do not promise that products, customers, orders, sales, stock or finance records will appear just because a `csv_import` job was queued. A file parser, field mapping/preview, reconciliation rules and destination-specific worker still need to be implemented for end-to-end CSV import.

### Sync lifecycle and troubleshooting

- **Queued:** request saved; it has not necessarily started.
- **Running:** a worker reports that it is processing the request.
- **Succeeded:** worker reports success; still verify the resulting records.
- **Failed:** read the error and correct the underlying cause before retrying.
- **Cancelled:** the request did not complete.

If jobs remain queued, collect the business, job ID, source, direction, creation time and message. This indicates the configured worker or integration may be missing or unavailable; repeatedly queuing the same request can create duplicate work.

## 5. Record routing: where every kind of data should appear

Use the following routing map when preparing a future import, connecting a source, or validating a module action.

| Record/data type | Correct destination | Key check |
|---|---|---|
| Business identity, address, contacts | Business profile | Active business ID and verified profile |
| Product description, SKU, category, selling price, cost price | Products and stock | Product ID/SKU, currency and correct business |
| Stock quantity / adjustment | Products and stock → inventory/stock history | Adjustment quantity, reason and product ID |
| Low-stock event | Alerts (after an automation worker exists) | Product and configured threshold match |
| Customer name/contact | Customers | Stable customer identity and valid contact details |
| Order placed by a customer | Orders | Order ID, customer reference, line items and status |
| Order status change | The same order in Orders | Status history and order ID; do not make a second order |
| Direct or walk-in sale | Sales | Transaction date, items/amount and payment method/reference if captured |
| Business expense | Expense records / reporting | Amount, category, date, business ID; verify the current UI exposes the intended entry point |
| Invoice | Finance → Invoices | Invoice number, customer, line items, total and due date |
| Payment allocation | Finance → Invoice → Allocations | Amount must not exceed outstanding balance; method and transaction reference required |
| Storefront/business website settings | Website | Correct business and saved/published settings |
| Public website inquiry | Website → Inquiries | Inquiry ID and contact; it remains an inquiry until explicitly converted |
| Automation rule | Automations | Name, trigger/action, execution mode and enabled state |
| Sync request | Sync Centre → Jobs | Job ID, source, direction and actual worker-reported status |
| Team invitation/membership | Team | Business ID, email, role, invitation status and acceptance |
| Business analytics/intelligence | Analytics / Intelligence | Validate results against source products, orders, sales, expenses and finance records |

### Important record distinctions

- **Orders vs. Sales:** an order represents a requested/accepted transaction in the order lifecycle. A sale represents a completed sale entry, including walk-in sales that may not have an order. Do not duplicate the same event in both modules just to make counters match.
- **Invoice vs. Payment:** creating an invoice records an amount owed. An allocation records that an amount has been assigned to an invoice, but the current backend explicitly does not process the payment. Allocations must be reconciled against a trusted payment source before being treated as verified cash received.
- **Product vs. Stock movement:** the product record holds catalogue and current-stock information; inventory adjustments should use the inventory action so quantity changes have a traceable reason/history.
- **Website inquiry vs. Customer/Order:** an inquiry is a lead/question. It should not silently create a customer, order, invoice, or sale without an explicit conversion workflow.
- **Automation rule vs. executed action:** a stored rule is configuration. It is not proof that an alert, task, summary, or status change occurred.
- **Sync job vs. synchronized record:** a queue row is a request. A worker must run, reconcile the source and destination, and report a result.

## 6. Verification procedure after any operation

For each created record, adjustment, rule, or sync request:

1. Confirm the correct business is active.
2. Confirm the interface reports that the save/action was accepted; distinguish saved, queued, and completed states.
3. Copy the record ID, order ID, product ID, invoice number or sync-job ID for traceability.
4. Open the intended destination module, refresh it, and search using the stable identifier.
5. Compare quantities and totals against the source. For stock, verify before/after quantity; for finance, verify invoice total, allocated amount, and outstanding amount; for orders, verify status and items.
6. Check for duplicates, unexpected business scope, missing links, failed status or warnings.
7. Verify that public storefront publication is intentional and that private customer/finance data remains private.

For a pilot, enter one test product, one customer, one order, one direct sale, one expense (where the UI entry point exists), and one invoice in their normal modules. Verify each saved record in its destination before testing any integration or sync job.

## 7. Permissions, verification and safety boundaries

- The current Finance, Automation, Sync Centre, Team and business-switch contract endpoints resolve the selected business and require it to be **active and verified**.
- These contract operations are owner-only. A manager/sales/inventory/viewer membership does not automatically grant owner-only finance, automation, sync, team or switching privileges.
- Each operation is scoped to the owner and selected business. Always verify the selection before creating an invoice or queueing a sync request.
- Payment allocation records require a supported method (`cash`, `bank`, `mobile_money`, or `other`) and a transaction reference. Do not invent a reference or represent it as verified provider payment.
- Team invitation creation currently reports `manual_share_required`; it returns a one-time acceptance token for secure sharing and does not send an invitation email. Share it privately with the intended person and never publish it.
- Never put confidential customer data, payment references, or tokens in a public website field or shared log.

## 8. Current API route families

The frontend calls the existing Jumuiya backend using the `/api/jumuiya` API root. Biashara's relevant route families are:

- Business profile: `/biashara/business`
- Products: `/biashara/products`
- Inventory: `/biashara/inventory/low-stock`, `/biashara/inventory/<product_id>/adjust`, `/biashara/inventory/history`
- Customers: `/biashara/customers`
- Orders: `/biashara/orders`, `/biashara/orders/<order_id>/status`
- Sales and expenses: `/biashara/sales`, `/biashara/expenses`
- Dashboard and website: `/biashara/dashboard`, `/biashara/website`, `/biashara/website/inquiries`
- Finance: `/biashara/finance/invoices` and `/biashara/finance/invoices/<invoice_id>/allocations`
- Automation configuration: `/biashara/automations/rules`
- Sync queue: `/biashara/sync/jobs`
- Team and switching: `/biashara/team`, `/biashara/team/invitations`, `/biashara/businesses`, `/biashara/businesses/active`

Use the application UI and its authenticated API client for ordinary operations. Direct production API calls must preserve authentication and the existing business ownership, verification, and authorization checks.

## 9. Implementation gaps to close for full end-to-end behavior

The inspected code explicitly identifies these limitations. They are not resolved by this guide:

1. **Automation execution:** rules are configuration-only. Install and operate a compatible worker, enforce idempotency, return real job outcomes, and write results into the correct alerts/tasks/summary destinations before presenting automation as active.
2. **Synchronization execution:** Sync Centre creates queue records only. A worker/connector must process source and direction, perform validated reconciliation, update progress/status, and report errors/results. Until then, records remain queued and no external synchronization should be claimed.
3. **CSV import:** implement upload, schema/type selection, mapping, preview, validation, duplicate detection, explicit confirmation, bounded/retryable batch processing, conflict handling, and post-import destination verification. CSV rows should route by declared record type—not be inserted into one generic collection.
4. **Destination integrity:** preserve business ID and source record identity during import. Existing module views should read the reconciled record instead of maintaining a second copy.
5. **Expense UI destination:** the backend exposes expense records, but a dedicated visible navigation route was not found in the inspected current Biashara workspace. Verify or add the correct entry/list view before promising users a dedicated Expense screen.

The acceptance criterion is not simply that an upload or queue request returns success. It is that every accepted record is validated, saved to its correct authoritative business record type, visible in the corresponding workspace, traceable by ID, and not duplicated in another module.
