# NEXORA Required Behavior — Baseline Compliance Audit

**Repository:** musombi123/RevelaCode-Frontend  
**Application:** `apps/nexora`  
**Audit method:** Source inspection of the React workspace, shell, Device Lab, Creator Flow, Asset Library, project storage, World Builder, job queue, export/build screens. No live desktop browser, local-agent device, physical Android device, payment sandbox, or PC disconnect test was available in this environment. Source-level evidence is not presented as runtime acceptance.

Legend: **PASS** = behavior supported by inspected implementation; **PARTIAL** = some implementation exists but requirement is incomplete; **FAIL** = missing or contradicted; **BLOCKED** = requires other repository/runtime/server access.

## Baseline results

| # | Spec section | Result | Evidence / gap |
|---|---|---|---|
| 1 | General principles | PARTIAL | Local-agent architecture exists for heavy compute, but primary action sequence is not consistently enforced; jobs/responsiveness cannot be runtime verified. |
| 2 | Startup and session | PARTIAL | Auth gate exists and session is restored from localStorage; loading/auth gates do not establish <1s startup, remembered resume point, guest export restrictions, or safe expired-session restoration. First-login guided tour and replay are absent in this NEXORA app. |
| 3 | PC connection states | PARTIAL | Device Lab supports pairing, reconnect detection, hardware info, requirements/preflight, refresh and disconnect. It does not demonstrate all five specified states, persistent mid-job recovery, or readiness status (CPU/GPU/RAM) on all disconnect paths. |
| 4 | Projects and saving | FAIL/PARTIAL | Cloud projects use account API and local drafts are persisted in browser localStorage; assets use IndexedDB. Projects are not guaranteed to live in a user's PC disk directory. Local edits are not protected by a verified checkpoint/recovery system; no global saved-state indicator. Server project documents contain metadata and strip binary assets, but the required server-only resume-point data contract is not implemented/verified. Undo/redo across edits absent. |
| 5 | Generation pipeline | PARTIAL | Creator Flow has real API pipeline/stage approval; job queue shows returned states/progress and retries selected failed jobs. Queue lacks confirmed pause/resume/cancel, per-step percent/ETA, confirmed cancellation dialog, and resume-from-failed-step semantics. |
| 6 | Assets | PARTIAL | Asset import, local storage, search and type filters exist; model/template add-to-scene exists. Missing bulk actions, favorites, drag-to-level, virtualized list, robust broken-asset tile/rescan. Live streaming of generated assets is not proven. |
| 7 | Preview/testing | PARTIAL | 3D model preview and playtest job queue exist. Preview is not proven lazy, Play/Stop/Reset always visible, adaptive low-end quality is not evidenced, nor is a clickable error-cause console. |
| 8 | Levels | FAIL | Scene objects and timeline exist, but a level collection with Level 1, add/rename/reorder/delete-confirm/undo and lossless switching is not evidenced. |
| 9 | Performance/resources | PARTIAL | Compute operations are routed through local-agent API; CPU/RAM/GPU capability and requirement preflight are visible. Live CPU/GPU/RAM/disk monitoring, overload/disk alerts, workload enforcement, and nonblocking behavior are not verified. |
| 10 | Export/plans/payments | PARTIAL/BLOCKED | Build Center, Android build settings, Release Center and Creator Flow plan selection exist. Server-side prices/plan entitlements and payment verification exist only insofar as connected API contracts; not verified here. Android/PC-only active targets, fixed KES 499 pricing breakdown, Pochi/M-Pesa Pending→Confirmed and export unlock sequence not proven. |
| 11 | Ads | BLOCKED | No evidence in inspected NEXORA workspace of approved-slot NEXORA ads implementation; ads placement/label/paid-tier suppression needs full app/repository check. |
| 12 | Errors/offline/notifications | PARTIAL | Status/notice and notification center exist; offline/session error handling is present in some paths. Consistent plain-language cause/next-step errors, full offline recovery, nonblocking dismissible notifications for every event are not proven. |
| 13 | UI rules | PARTIAL | Dark studio shell, responsive utility classes, search, Ctrl+K command palette and Help modal exist. Docking/resizing, per-user remembered layouts/reset, full shortcuts (Ctrl+S/Z/Y/Space), disabled-button reason tooltips and complete accessibility are missing or unverified. |
| 14 | Security/privacy | PARTIAL | Device-local compute boundary and explicit video rights prompts exist. Sensitive logging and every destructive/payment/export confirmation must be audited across backend and desktop agent. |
| 15 | Acceptance test | BLOCKED | None of the ten end-to-end acceptance tests can be truthfully marked PASS from source inspection alone. See test status below. |

## Acceptance-test status (baseline)

| Test | Result | Note |
|---|---|---|
| 1. Tour once / skip / replay | FAIL | Guided tour not found in `apps/nexora` source. |
| 2. Connect PC / permissions / readiness meter | PARTIAL | Pairing and preflight exist; actual PC/device test required. |
| 3. Add video / pipeline / live assets | PARTIAL | Upload + pipeline UI/API exists; end-to-end live asset creation requires worker/local agent. |
| 4. Disconnect during job / recover | FAIL | Durable pause/reconnect recovery not evidenced. |
| 5. Close mid-edit / restore checkpoint | FAIL | Browser-local project persistence exists, but verified crash recovery/checkpoint absent. |
| 6. Level 2 / switch without losing changes | FAIL | Multi-level lifecycle absent from inspected project schema/UI. |
| 7. Export Center / pricing / target availability | PARTIAL | Build/release surfaces exist; exact target/pricing contract needs backend/runtime validation. |
| 8. Payment code / Pending / Confirmed / unlock | BLOCKED | Requires backend/admin payment integration and test credentials. |
| 9. Offline local / online recovery | PARTIAL | Local draft/asset storage exists; full offline workflow and recovery not tested. |
| 10. Ads slots / active-job suppression | BLOCKED | Ad system and placements not validated. |

## Scope and dependency boundary

This repository hosts the NEXORA frontend under `apps/nexora`. Complete compliance also depends on the NEXORA backend, desktop Local Agent/PC application, worker/toolchain, auth/plan/payment/admin configuration, and a real desktop browser. Frontend-only changes cannot safely fake server entitlement, hardware telemetry, job checkpointing, or M-Pesa approval.

## Fix strategy

Do not replace existing functional components. Implement in phases with a CI gate and evidence:
1. Frontend safety/usability primitives: guided onboarding + replay, shortcut/help consistency, saved-state/recovery UI backed by actual persistence, recent/resume point, undoable edit actions where supported.
2. Local PC contract: persistent disk project storage, live hardware/resource state, job queue control and checkpoint/resume, generated-asset events, levels API/schema.
3. Billing/export/ad/offline contracts: verify target and pricing config, admin-confirmed payment flow, server-side entitlement, approved ad slots and offline behavior.
4. Acceptance: run all ten tests on a real desktop and local PC app; document results without converting untested rows to PASS.

This baseline audit is source inspection, not a claim of live acceptance.