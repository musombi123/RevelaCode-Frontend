# Elimu Hub — User and Access Guide

**Product:** RevelaCode / Jumuiya Elimu Hub  
**Audience:** School owners and directors, principals/headteachers, registrars, bursars, teachers, storekeepers, parents/guardians, and students  
**Purpose:** Explain the hub's intended workflows, role-based access, accessibility practices, and safe use.

> **Availability note:** This is the user guide for the Elimu Hub workflows. What a user can actually do depends on the permissions granted to their account, the school's verification/approval state, the modules enabled for that school, and any payment or notification provider configuration. A feature described here should not be assumed live for every school until it is confirmed in the deployed application. This guide does not promise that a payment provider, SMS/email channel, or automated job is configured.

## 1. What Elimu Hub is

Elimu Hub is the school-management workspace within Jumuiya. It is designed to bring school administration, student records, staff coordination, parent communication, timetable and attendance workflows, and school-fee information into one school-scoped experience.

The hub is not a public directory of private school records. Users should only see the school information and actions allowed by their authenticated account and role. A person connected to more than one school should confirm the active school/workspace before creating or changing records.

### Main work areas

- **School access and verification:** school onboarding, account status, missing-resource requests, approval or rejection reasons.
- **Students and classes:** student admission records, class/stream placement, course or programme information, and student status.
- **Parents and guardians:** parent directory, verified parent–student relationships, contact details, and parent portal access.
- **Staff and roles:** staff invitations, role assignment, teacher details, departments, employment status, and approval requests for sensitive changes.
- **Timetable and attendance:** lesson schedules, teaching-day reminders, class attendance navigation, and related school records.
- **Fees and finance:** fee types, statements, balances/due dates, payment records, and receipt submission where those functions are enabled.
- **Notifications and lifecycle follow-up:** school-status updates, relevant reminders, and student lifecycle follow-up when the required rules and background services are configured.
- **Certificates and course completion:** completion outcomes and certificate workflows where the school's course configuration supports them.

## 2. Who can access Elimu Hub?

Access is role-based and school-scoped. The table describes the intended division of responsibility; exact buttons and permissions may vary with the school's configuration.

| Role | Typical access and responsibilities |
|---|---|
| **Owner / Director** | Highest school-level authority; oversees school setup, approves sensitive staff transfer/removal or role/status changes, reviews operational and financial information, and responds to school verification decisions. |
| **Principal / Headteacher** | Coordinates school operations, classes, staff, timetable and student oversight. Where an action requires owner approval, submits a request rather than finalising it independently. |
| **Registrar** | Manages admission/student records, class placement, parent/student links and registration follow-up, subject to granted permissions. May receive alerts requiring registration review. |
| **Bursar / Finance staff** | Manages configured fee types, fee statements, payment recording, receipt review, and reconciliation workflows available to the school. |
| **Teacher** | Accesses assigned teaching information, relevant classes/courses, timetable reminders, and attendance workflows permitted for their assignment. |
| **Storekeeper** | Uses stock/store-related access only where that role and the school's store module are enabled. This role is optional. |
| **Parent / Guardian** | Views only the linked student(s) and the parent-facing information made available by the school, such as fee information, due dates, statements and receipt-submission options when enabled. |
| **Student** | Uses student-facing information and learning/course access made available by the school and the student's account status. Student access is not the same as staff administration access. |

**Least-privilege rule:** Do not share an account to work around missing permissions. Ask the school owner or authorised administrator to grant the correct role. Being a parent, teacher, or staff member at one school does not automatically grant access to another school's records.

## 3. Getting started and school access

1. Open the official RevelaCode/Jumuiya application and sign in using your own account.
2. Open **Elimu** from the available hubs or dashboard.
3. Select the correct school/workspace if the account has access to more than one.
4. If prompted, complete the school or user setup steps shown in the application.
5. If access is blocked, read the displayed status and follow the stated next action. Do not repeatedly create a second school or duplicate account to bypass a pending review.

### School approval states

A school may encounter one of these states, depending on the verification workflow:

- **Pending review:** the application or supporting resources are awaiting review.
- **More information / missing resources:** provide the specific evidence or details requested.
- **Approved / active:** continue with the school setup and modules available to the account.
- **Rejected / not approved:** read the stated reason and follow the official correction or appeal process if one is provided.

The school owner should keep the registration contact information current and review notifications about approval, missing resources, or rejection reasons. If no reason or next step appears, contact the platform's authorised support channel and include the school name and a non-sensitive description of the issue—never send passwords or authentication codes.

## 4. School owner and director workflow

The owner/director should complete the following before inviting the school community:

1. Confirm the school profile and contact information.
2. Complete any required school verification and respond to requests for additional resources.
3. Review staff membership and ensure every person has the appropriate role.
4. Set up classes, streams, courses/programmes and the timetable as supported by the school's configuration.
5. Confirm that each student is linked to the correct class and parent/guardian where applicable.
6. Configure fee types and the school's payment details only through the finance settings provided by the application.
7. Test invitations, parent links, notifications and finance workflows with authorised test records before relying on them for live school operations.
8. Review pending staff-change requests and any operational alerts.

### Approvals for sensitive staff changes

Where the system routes a principal's request for staff transfer, removal, role, employment/status, or class assignment changes to the owner, the principal should submit the request with a clear reason and wait for a decision. The owner should verify the staff member and requested change before approving or rejecting it. Do not treat a submitted request as an approved change.

## 5. Students, classes and courses

### Student records

Student records should be accurate, school-scoped and updated promptly. Depending on the view and permissions, student lists may include:

- School admission number
- Student name
- Class and stream
- Study/course or programme information
- Duration/period and status
- Available record actions

When reviewing a student, verify the admission number and name before editing or taking an administrative action. Use class, stream, or course/programme filters where available. A filter only changes the displayed list; it does not change a student's underlying placement.

### Classes and streams

A class list is intended to help staff identify the class, class teacher and total student count. Confirm that class teachers, streams and student assignments match the current school records. If a class or stream is missing, ask an authorised school administrator to configure it rather than creating a duplicate class with a slightly different name.

### Inactivity and completion

Some school workflows may use term-based inactivity follow-up: a parent/guardian is contacted first, and unresolved cases can be escalated to the registrar for review. Treat reminders as a request to investigate—not as automatic proof that a student should be removed. Confirm the student's situation and follow school policy before changing enrolment status.

Where course completion and certificate workflows are enabled, check the completion result and the student's identity before issuing or recording a certificate. A completion message or certificate should only be treated as official when the school-authorised workflow confirms it. Do not delete a student's historical record simply because a course has been completed; follow the school's records-retention policy and the actions explicitly offered by the system.

## 6. Parents and guardians

The parent directory is intended to help authorised school staff manage parent/guardian contact details and student relationships. It may display an identity/reference, contact information, linked students and portal duration/status, depending on the implementation and permissions.

### Linking a parent to a student

1. Search for the parent and student using the school's approved identifiers.
2. Confirm the relationship and contact details with the school’s registration process.
3. Link the correct student(s) to the parent record.
4. Send or reissue the invitation using the invitation workflow available in the application.
5. Confirm that the recipient signs in with their **own account** and can only view the student(s) linked to them.

An invitation must not be used to sign a parent in as the school's email address or as another person. If the invite opens the wrong identity, stop using the link, report the problem to the school administrator, and have the invitation/identity mapping checked before sharing student information.

### Parent portal use

Parents/guardians should:

- Sign in using their own account and keep credentials private.
- Check that the displayed student name(s) are correct.
- Review available fee types, statements, due dates and payment history.
- Submit a receipt only through the official workflow shown by the application, if enabled.
- Contact the school bursar if an amount, allocation, receipt status or due date appears incorrect.
- Notify the school if a student relationship is missing or incorrect.

Portal access duration may depend on the linked student's school-defined study period or other configured rules. If access expires early or the wrong student appears, ask the school to review the relationship and access status; do not create a duplicate parent profile as a workaround.

## 7. Fees, payments and receipts

Finance access should be restricted to authorised school staff and the parent/guardian information intended for the linked student. The exact options available depend on the school's finance configuration.

### School finance staff

Where supported, the bursar or authorised finance staff can:

1. Configure fee types and applicable charges.
2. Review student fee statements, balances and due dates.
3. Record or review payment transactions.
4. Match a payment to the correct student and fee item.
5. Review submitted receipts and record the decision using the available workflow.
6. Reconcile payment records against the school's bank/mobile-money records.

Before confirming a transaction, verify the amount, currency, reference, date, student and fee allocation. Correct mistakes through the supported correction or reversal process; do not silently overwrite a financial history.

### Parents and payment automation

The parent portal may expose fee statements, due dates and receipt submission. Actual online payments, automated confirmation, bank/mobile-money integration, payment allocation and reconciliation require the relevant provider integration, credentials, callback/webhook configuration and operational testing. The presence of a fee screen alone does **not** prove that online payment is enabled.

- Use only payment instructions displayed by the school through its official channels.
- Never share a PIN, password, one-time code or full payment credentials.
- Keep the payment confirmation/reference and receipt until the school confirms allocation.
- If a payment is pending or duplicated, contact the bursar with the transaction reference; do not pay again solely because the portal has not refreshed.
- Do not mark a payment as successful based only on a screenshot if the school's verification policy requires a transaction reference or provider confirmation.

## 8. Staff, invitations, departments and stores

### Staff directory

The staff list is intended to present staff role, identifier, contact details, department, status, and—for teachers—course or teaching assignments where configured. Check these details when onboarding staff and whenever assignments change.

### Invitations

1. An authorised administrator starts an invitation and enters the intended invitee's details.
2. Confirm the email/contact belongs to the person being invited.
3. Send the invitation using the application's supported process.
4. The invitee opens the link and authenticates or completes account setup as instructed.
5. Verify that the signed-in identity is the invitee and that the school/role shown is correct.

If an invitation is expired, sent to the wrong address, or resolves to the wrong identity, do not forward it to another person. Ask the administrator to invalidate/reissue it where supported and investigate the identity mapping.

### Optional roles and departments

Teacher department assignment and store/storekeeper roles may be optional. Assign them only when the school uses those structures and the corresponding module is available. A missing department or store function may reflect configuration or permissions, not a failure that should be bypassed by assigning a more powerful role.

## 9. Timetable, teaching reminders and attendance

Teachers should check their timetable at the beginning of each teaching day. When timetable reminders are available, the dashboard may highlight the current or next lesson, classes scheduled that day, and a route to attendance.

- Verify the date, local time, class/stream and lesson before taking attendance.
- If the timetable looks wrong, ask the timetable administrator to correct the published entry.
- If a lesson is absent, check whether the timetable is published and whether the teacher/class assignment is correct.
- Use the attendance page for the relevant lesson and follow school attendance procedures.
- Do not assume a reminder proves that attendance has been recorded.

Automated reminders depend on a scheduled background service, correct timetable data, timezone handling, and a working notification channel. If reminders do not arrive, the school administrator should verify those components rather than assuming the teacher has no lesson.

## 10. Notifications and follow-up

Notifications may cover school verification, staff requests, timetable reminders, student follow-up, parent communications or finance events where implemented and configured.

For each notification:
1. Read the event, subject and date.
2. Open the corresponding record in the correct school.
3. Verify the details before acting.
4. Complete the authorised action or escalate it to the correct role.
5. If the message seems duplicated, stale or unrelated, report it rather than acting twice.

Email, SMS, in-app alerts and scheduled reminders are separate delivery channels. A notification workflow is only dependable when its delivery provider, credentials, scheduled job and record permissions are correctly configured.

## 11. Accessibility and usability

Elimu Hub should be usable by people with different devices, abilities and connectivity conditions. These are recommended operating practices; they are not a claim that every screen has already passed a formal accessibility audit.

### Keyboard and assistive technology
- Prefer the keyboard to move through controls when using a laptop or desktop; use Tab/Shift+Tab to navigate and Enter/Space to activate a focused control.
- Use visible focus indicators to understand which control is selected.
- Form fields should have clear labels, and errors should explain what needs correction in text—not by colour alone.
- Screen-reader users should use the control labels and headings exposed by the interface. If a control has no understandable name, report the page and control to support.

### Mobile and low-bandwidth use
- Use a current browser and keep the device browser updated where possible.
- On a small screen, scroll within the page and check the active school before submitting forms.
- Avoid submitting the same payment, receipt or registration form repeatedly when the network is slow. Wait for a result and check the record first.
- If a page fails to load, try a stable connection and refresh once. If data may have been submitted, verify the record before retrying.

### Readability and privacy
- Use browser zoom or device text-size settings when needed.
- Do not rely on colour alone to interpret approval, payment or student status; read the status label and reason.
- On shared devices, sign out after use and avoid saving credentials in a public browser.
- Do not send screenshots containing student IDs, fee balances, phone numbers or other private information to public channels.

### Reporting an accessibility issue
Report the page/module, device/browser, what you were trying to do, and what happened. Include a screenshot only after hiding student, parent, staff and payment details. Never include passwords, session tokens, PINs or one-time codes.

## 12. Privacy, security and good records practice

- Use an individual account; never share passwords or authentication codes.
- Access only records needed for your assigned duties.
- Verify school, student, parent and staff identities before making changes.
- Keep contact details and parent–student relationships accurate.
- Do not download, copy or distribute school records unless your role and school policy permit it.
- Use official finance instructions and preserve transaction references.
- Report a suspected account compromise or exposure of student data to the school owner/authorised support promptly.
- Follow applicable school retention, safeguarding and privacy policies. The hub does not replace the school's legal obligations.

## 13. Common problems and what to do

| Problem | Recommended action |
|---|---|
| Elimu is missing or access is denied | Confirm sign-in, active school, account membership, school status and assigned role. Ask the owner/administrator to review permissions. |
| School status is pending or asks for resources | Read the requested item, submit it through the official process, and wait for the review decision. |
| A parent sees the wrong student or cannot see a linked student | Stop using the affected view for private information and ask the registrar to verify the parent–student link and signed-in identity. |
| An invitation signs in as the wrong person | Do not continue. Report it, verify the invitee email/account mapping, and reissue the invitation through the authorised workflow. |
| A teacher's timetable or reminder is wrong/missing | Check the published timetable, date, teacher assignment and class. Ask the timetable administrator to review it. |
| A fee or payment is incorrect | Do not make a duplicate payment. Keep the transaction reference and ask the bursar to verify allocation and provider status. |
| A receipt remains pending | Confirm submission and contact the authorised finance staff. Provider confirmation and school review may be required. |
| Staff transfer/removal is pending | The request is not final until the authorised owner/director decision is recorded. |
| A course completion/certificate is missing | Ask the teacher/registrar to verify completion data and whether the certificate workflow is enabled. |
| A page is difficult to use on mobile or with a keyboard | Report the module, device/browser and steps to reproduce without exposing private records. |

## 14. School administrator readiness checklist

Before relying on Elimu Hub for live operations, the school should verify:

- [ ] School approval state and school profile are correct.
- [ ] Owner/director and authorised staff accounts are correct.
- [ ] Role permissions prevent unauthorised access to student and finance records.
- [ ] Staff invitations resolve to the intended person's own account.
- [ ] Classes, streams, courses, teachers and published timetable entries are accurate.
- [ ] Parent–student links have been checked.
- [ ] Fee types, statements and payment instructions match school policy.
- [ ] Payment provider integration, webhooks/callbacks and reconciliation have been tested if online payment is enabled.
- [ ] Notification channels and scheduled jobs have been tested if reminders are enabled.
- [ ] Student inactivity and course completion rules have been reviewed by authorised school leadership.
- [ ] A keyboard/mobile accessibility pass has been performed on the actual deployed application.
- [ ] Staff know how to report a privacy incident or incorrect financial record.

## 15. Support and change control

When requesting help, provide the module, school name, approximate time, steps taken, and a non-sensitive error message. Use the school's authorised support process. Redact names, admission numbers, parent contacts, payment references and other personal data unless the support channel is approved to receive them.

This manual should be updated whenever the deployed role permissions, navigation, payment integration, notification delivery or student lifecycle rules change. For production use, validate every described workflow against the live application and the school's configured permissions before training users.

---

**Document status:** User guide / operational reference  
**Last updated:** 22 October 2026  
**Important:** This guide explains intended usage and access principles. It is not a substitute for verifying live feature availability, production configuration, school policy, or applicable legal requirements.
