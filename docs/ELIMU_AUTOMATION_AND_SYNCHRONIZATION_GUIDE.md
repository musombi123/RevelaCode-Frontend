# Elimu Automation & Synchronization Centre — Operator Guide

**Audience:** School Owner and Principal  
**Purpose:** Run school automation safely, synchronize school data, migrate legacy records, resolve sync conflicts, and verify that data appears in the correct Elimu workspace.

> **Important routing rule:** Automation and Synchronization are not general-purpose file cabinets. Structured records must use their correct Elimu record type and authoritative endpoint. A successful upload or import preview does not by itself prove that a file or record is visible in its destination screen. Refresh and verify the destination after every import.

## 1. Where to find the centres

1. Sign in to RevelaCode and open the correct school's Elimu workspace.
2. Confirm the active school and your role in the dashboard header.
3. In the sidebar, open **System → Automation** or **System → Synchronization**.
4. These management screens are restricted to the **School Owner** and **Principal**. Other roles should use the modules permitted for their duties.

Both centres use the existing RevelaCode/Jumuiya Elimu backend and the active school's membership. Do not create a separate school account, database, or alternate copy of the records to make synchronization work.

## 2. Automation Centre

Automation defines school-scoped rules, queues jobs, and records execution activity. Use it for supported operational actions; do not use it to upload letters, papers, or arbitrary files.

### Review the current state

1. Open **System → Automation**.
2. Review the summary cards for total/enabled rules, queued jobs, running jobs, and failed jobs.
3. Review **Activity log** for recent events and the associated rule/job IDs.
4. If the centre reports an endpoint or permission error, verify the school membership and role before attempting to create rules.

### Create a rule

1. Select **New rule**.
2. Enter a clear, unique **Rule name**. Example: `Attendance review reminder`.
3. Choose a **Trigger** from the options supplied by the Elimu service. Select the event or schedule that actually matches the intended workflow.
4. Choose an **Action** from the service-provided list. Currently supported action identifiers include:
   - `notify`
   - `create_report` and `publish_report`
   - `send_reminder`
   - `flag_student` and `flag_class`
   - `generate_timetable`
   - `run_sync` and `retry_sync`
   - `create_alert`
   - `request_ai_analysis`
5. Add a short description explaining the desired outcome and who should review it.
6. Enable the rule immediately only when the trigger and action are understood and approved. Otherwise save it disabled and review it first.
7. Select **Save rule** and verify that the rule appears in the rule list.

The trigger and action menus are populated from the service, so use the choices shown by the application rather than typing undocumented identifiers. Use a unique rule name for each purpose.

### Run and monitor a rule

- **Run now** requests a job for that rule. It queues work; it is not proof that the action has finished.
- Open **Job queue** and inspect the job's status, timestamps, and any returned error.
- A queued/running job should be allowed to finish and then be verified in its destination module.
- **Retry** is intended for failed or cancelled jobs. Check the error and correct the cause before retrying.
- **Cancel** requests cancellation of an eligible queued/running job.
- Use **Disable** to stop a rule from being selected for future runs. Disabling a rule does not erase its audit history.
- Delete a rule only when it is no longer needed. Existing activity logs are retained.

A job can remain queued if the backend executor/worker that performs actions is unavailable. If jobs repeatedly remain queued, fail, or show stale state, capture the rule ID, job ID, status and timestamp for technical support; do not repeatedly create duplicate rules.

### Safe automation practices

- Test a new rule with a small, non-destructive workflow first.
- Review permissions and the target school before actions that publish reports, send reminders, or trigger synchronization.
- Check the destination module after a successful job.
- Do not assume that a green/healthy summary means every individual job succeeded.
- Use the activity log as the audit trail; do not delete or alter records manually to hide a failure.

## 3. Synchronization Centre

Synchronization manages device/desktop connections, devices, jobs, conflicts, and staged legacy imports. The school-scoped cloud data remains authoritative; the sync engine reconciles records rather than creating an unrelated parallel data store.

### A. Create a connection for a school device

1. Open **System → Synchronization**.
2. Select the option to create a connection.
3. Give it a recognizable name, for example `Makuselwa office desktop`.
4. Choose the correct platform (Windows, desktop, macOS, Linux, Android, web, API, or other, as appropriate to the connected client).
5. Create the connection and securely store the issued credential. The interface warns that a credential may not be shown again.
6. Configure the intended client with that credential following the client's approved setup procedure. Never paste a connection token into a document, spreadsheet, public chat, or support ticket.
7. Confirm the connection/device appears in the centre and has a valid status.

Creating a connection only provisions a sync identity; it does not import a spreadsheet or upload documents by itself. Revoke a connection only when access should be removed or the credential may have been exposed.

### B. Read the status and job queue

- **Status:** overall synchronization status returned for the active school.
- **Connections:** registered device/client connections.
- **Devices:** clients seen by the sync service.
- **Synchronization jobs:** queued, running, failed, or completed synchronization work.
- **Conflicts:** records for which cloud and local changes need an explicit decision.

Refresh the page after a client sync. If a job fails, read its error before retrying. Confirm the affected entity type, school, record count, and destination before triggering another run.

### C. Resolve a conflict carefully

1. Open the conflict and identify its record/entity type and the versions being compared.
2. Determine which version is authoritative using school records and the responsible staff member.
3. Choose **Keep cloud version** when the cloud record is correct.
4. Choose **Keep desktop version** only after verifying that the local version is correct and should replace/reconcile with the cloud version.
5. Add a concise resolution note, if prompted, then submit the choice.
6. Refresh the conflict list and verify the affected record in its normal Elimu module.

Do not choose a version merely to clear the conflict count. Conflicts are review points, not disposable warnings.

## 4. Import an existing school's records

The **legacy import** workflow is available within the Synchronization module. It is a staged migration tool for supported structured records—not a universal attachment uploader.

### Supported file formats and limits

The backend parser supports **ZIP, JSON, CSV, and XLSX** for legacy imports. The current service limits a single upload to 25 MiB; ZIP content is limited to 80 MiB unpacked and 100 files. A migration is limited to 50,000 records. Import previews expire after approximately four hours, so review and start a preview promptly.

### Supported import record types

The current legacy-import selector supports these entity types:

| Import type | Expected destination after successful reconciliation |
|---|---|
| Students / learners | Elimu → Student records |
| Classes / streams | Elimu → Classes |
| Attendance | Elimu → Attendance |
| Exams / assessments / marks | Elimu → Assessments; exam-related results can be reviewed in Exam Centre |
| Fees / payments | Elimu → School fees / Finance controls, subject to the fee API's supported fields |
| Assignments | Elimu → Assignments |
| Lessons | Elimu → Lessons |
| Timetables | Elimu → Timetable |
| Timetable entries | Elimu → Timetable |
| CBC projects | Elimu → CBC projects |
| School events | Elimu → Calendar/events where supported |

For a single CSV, JSON or XLSX file, select the entity type that matches the rows. For a supported ZIP bundle, the server attempts to identify multiple entity files; review the preview summary to verify the detected types and row counts. Do not label a file as one entity type simply because it contains a few columns that resemble another type.

### Import procedure

1. Prepare a backup of the legacy export and confirm it belongs to the correct school.
2. Open **System → Synchronization → Legacy import**.
3. Select the correct entity type for a single-entity file. Select the ZIP bundle directly for a multi-entity archive.
4. Choose the file. If field names differ from Elimu's field names, optionally enter a valid JSON field-mapping object. Example:
   ```json
   {
     "AdmissionNo": "admission_number"
   }
   ```
   Map each source column to the correct supported field. A field mapping only renames/maps data fields; it does not create a new record type or turn a document into an admission-letter workflow.
5. Select **Preview import**. The upload is staged temporarily; authoritative school records are not changed at preview time.
6. Review the preview ID, detected entity types, record counts, fields, warnings, and validation errors. Cancel/stop and correct the source if the type or counts are unexpected.
7. Start the migration only after reviewing the preview. The service requires a School Owner to have invited a Principal; that Principal must be linked to the school or have a valid pending invitation whose email delivery status is sent.
8. Allow the migration to process batches. The import reconciles in bounded batches and is resumable; it does not hard-delete existing records.
9. Verify the final status is **completed** and review created/updated/skipped/conflict counts and any warnings.
10. Open every relevant destination module, refresh it, and confirm representative records can be found by student/admission number, class, date, academic year, term, or other relevant identifier.

### Retry a paused import

If an import pauses on a failed batch:

1. Read the displayed error and correct the source data or configuration where needed.
2. Use **Refresh status** to read the server's latest state.
3. Select **Retry / Continue** to resume from stored checkpoints and retry failed batches.
4. Wait for a completed state, then validate the destination modules again.

Do not upload the same source repeatedly as a workaround: it can create unnecessary reconciliation work. A fresh preview is appropriate when the preview expires or the source file has been corrected.

## 5. Record routing: what belongs where

The guiding rule is **one record type, one authoritative destination, and any additional views must read from that same record**. Avoid duplicate databases or storing structured records only as arbitrary documents.

| Record or file | Correct Elimu destination | Current support boundary |
|---|---|---|
| Learner bio, admission number, class membership | Student records / Registrar workflows | Structured student import is supported. |
| Class/stream, lesson, assignment, attendance, CBC, timetable | Their corresponding Elimu module | The listed structured record types are supported by legacy import. |
| Exam marks and assessment evidence | Assessments; relevant results/reports in Exam Centre | Structured assessment records and exam reports exist. |
| School fees and payment records | School fees / Finance | Structured `fees` import exists. Verify finance fields and the fee-status/receipt workflow separately. |
| Stock, movements and supply requests | Inventory & stores | This is a separate inventory workflow, not one of the current legacy-import choices. |
| Books and loans | School library | Use the library module; library items/loans are not legacy-import choices. |
| School policies, notices, calendar, fee structures and other general attachments | School Document Centre, using the currently offered document category | The current document categories are forms, notices, calendar, handbook, fees, and other. A category selection alone is not proof that the file is routed into another module. |
| Past-paper PDF/DOC or examination-paper file | **Intended destination: Exam Centre → Past papers** | **Not currently exposed as a dedicated past-paper document type/repository in the inspected Exam Centre and legacy-import selector.** Do not import a PDF as an assessment/marks record. |
| Admission letter or transfer letter attachment | **Intended destination: the relevant learner's Registrar/student record → Letters** | **Not currently exposed as dedicated admission-letter/transfer-letter document types in the inspected document categories or legacy-import selector.** A student record's admission number is not the letter file itself. |
| Fee receipt/invoice/statement attachment | Finance record/receipt workflow, linked to the correct student and transaction | Do not treat a PDF attachment as a `fees` row. Verify the existing Finance/receipt process. |

### Important limitation

The application currently has record-level destinations for many Elimu data types, but **past-paper files, admission letters, and transfer-letter files do not yet have a dedicated category-and-routing path evidenced by the current upload/import choices**. The guide deliberately does not claim these documents will automatically appear in Exam Centre or a learner's file merely because they were uploaded to the general Document Centre.

To complete that end-to-end behavior, the product needs category-aware document metadata and storage plus destination views that query the same school-scoped document record. The required mapping is:

- `past_paper` / `exam_paper` → Exam Centre → Past papers.
- `admission_letter` → matching learner record → Registrar/Letters.
- `transfer_letter` → matching learner record → Registrar/Letters.
- `fee_receipt` / `fee_statement` → matching student/transaction → Finance.
- Other academic documents → the specific supported academic module, not a generic bucket.

Each file should retain its school ID, document type, linked record ID where applicable, academic year/term where relevant, uploader, timestamps, access policy, and publication state. Private student and finance documents must never become public documents by default.

## 6. End-to-end verification checklist

After any import, upload, sync, or automation run, use this checklist:

- [ ] The active school shown in the dashboard is correct.
- [ ] The operation reports a completed/successful state, not merely queued or previewed.
- [ ] The record's type/category matches its intended destination.
- [ ] The record contains the correct school ID and relevant learner/class/transaction identifier.
- [ ] The destination module was refreshed and the record is visible there.
- [ ] Counts are plausible and there are no unexpected duplicates or orphaned records.
- [ ] Any conflicts, skipped rows, or failures have been reviewed.
- [ ] Private records remain limited to authorized school members.
- [ ] Only items intentionally approved for publication appear on public school pages.
- [ ] The operation's import ID, job ID, entity type, counts, and error details have been retained for audit/support if needed.

For an acceptance test, upload one harmless test record of each supported type, then open the mapped module and verify it. Test files such as past papers and letters separately: they should only be accepted as complete workflows when the dedicated document type, linked record, and destination view are implemented.

## 7. Troubleshooting

- **401 / session expired:** sign in again and re-open the active school workspace.
- **403 / access denied:** confirm the user has an active membership and the required Owner/Principal role; do not bypass access checks.
- **Import preview rejects the file:** confirm the format is ZIP/JSON/CSV/XLSX, file size is within limits, a single-entity file has the correct entity type, and field mappings are valid JSON.
- **Preview has the wrong entity or row count:** stop before starting. Correct the export, entity selection, or mappings and preview again.
- **Preview expired:** upload and preview the source again.
- **Import paused / batch failed:** read the error, refresh status, correct the cause, then retry/continue.
- **Record is missing from the destination:** confirm the import is completed, confirm the entity type and school scope, refresh the correct module, and search by a stable identifier. If a document category has no dedicated destination integration, treat this as a product-routing gap rather than re-importing it as a different record type.
- **Automation job stays queued:** confirm the backend executor is running and inspect the job/log state.
- **Sync conflict keeps returning:** compare both records and identity fields; do not repeatedly force one side without checking why reconciliation treats them as different.

## 8. API areas used by the current UI

The Elimu frontend uses the existing API prefix `/api/jumuiya/elimu`. The main route families are:

- Automation: `/automation/status`, `/automation/actions`, `/automation/rules`, `/automation/jobs`, `/automation/logs`.
- Synchronization: `/sync/status`, `/sync/connections`, `/sync/devices`, `/sync/jobs`, `/sync/conflicts`.
- Legacy import: `/sync/import/preview`, `/sync/import/start`, `/sync/import/process`, and `/sync/import/status/<import_id>`.
- Structured records: `/students`, `/classes`, `/attendance`, `/assessments`, `/fees`, `/assignments`, `/lessons`, `/timetable`, `/cbc/projects`, and related module routes.

Use the UI or the service's published contract rather than manually calling these endpoints against production. All calls must retain normal authentication, active-school scoping, and the existing backend authorization checks.
