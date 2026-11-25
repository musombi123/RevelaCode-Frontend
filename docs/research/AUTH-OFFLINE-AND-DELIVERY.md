# RevelaCode authentication, offline behaviour and client delivery

**Evidence snapshot:** 25 November 2026  
**Primary source:** `src/context/AuthContext.jsx`, `src/auth/tokenStorage.mjs`, `src/auth/sessionIdentity.mjs`, `src/auth/workspaceRoles.mjs`, `src/services/offlineHubSync.js`, `src/services/jumuiyaApi.jsx`, `src/main.jsx` and the repository package scripts.

## 1. Client session model

The frontend stores a cached profile/session and access token so the application can restore a previously used account. The inspected AuthContext then contacts the RevelaCode backend's `/api/auth/me` endpoint when a stored non-guest access token is present.

This creates three important states:

- **Online-confirmed:** the backend has accepted the current token.
- **Offline-restored:** local session information is available, but the backend could not be reached. This is not a current server-side confirmation.
- **Rejected/revoked:** the backend authoritatively rejects the current token; the client clears the matching session.

A late authentication response for an older token is guarded so it cannot erase a newer login. Cached identity fields are sanitized to avoid retaining credential-like values within the profile object.

## 2. Token persistence

The shared token helper uses `revela_jwt` as the canonical access-token storage key, maintains compatibility aliases for older modules, and keeps refresh-token and token-type fields separately. It attempts local storage and falls back to session storage if local storage is unavailable.

The implementation is a client persistence strategy, not a complete security boundary. Browser storage can be exposed by malicious JavaScript running in the same origin. Production assurance still depends on secure coding, dependency controls, content security policy, server-side token validation, token lifetime and rotation policy, and incident response.

## 3. Offline storage model

`src/services/offlineHubSync.js` defines an IndexedDB database with stores for:

- queued mutations;
- cached API responses;
- session-related data;
- local activity.

It uses a user-scoped identity and can further scope records to a tenant. When IndexedDB is unavailable or blocked, it attempts a localStorage fallback.

The implementation uses a bounded API cache lifetime and supports local outbox-style mutation queuing. The code should be reviewed with each individual API workflow to confirm whether the operation is actually queueable, idempotent and safe to replay.

## 4. Synchronization and consistency questions

Offline mode changes where a mutation waits; it does not remove the need for server authorization or conflict resolution. The platform needs to guarantee:

- stable mutation IDs across retries;
- server-side deduplication;
- authenticated user and tenant ownership checks;
- ordering rules for dependent writes;
- clear conflict states and recovery actions;
- safe handling of expired/revoked sessions;
- no duplicate payments or irreversible side effects;
- visibility of unsynced records to the user.

The backend contains Elimu synchronization/import/conflict modules and Jumuiya domain-specific services. Exact offline coverage is endpoint-specific and should be represented in a support matrix.

## 5. Native Android delivery

The frontend uses Capacitor packages and contains Android-specific startup and offline warm-up handling. The actual native Android application is maintained in the separate `RevelaCode-Android` repository, not in this frontend's web build. That native repository owns Android platform configuration, permissions, plugins, Gradle builds, app signing and APK/AAB outputs.

The frontend deliberately avoids waiting for optional study-cache warm-up before first-screen rendering. Native Android uses native ad integration rather than injecting the web AdSense script. The presence of SDK or ad-unit configuration is not proof of approved advertising revenue.

## 6. Deployment boundary

The root app is deployed as a Vite static bundle. API requests go to the configured RevelaCode backend and RevelaAI services. Staging mode avoids production-origin fallbacks when its environment variables are missing.

The current build scripts include separate NEXORA output. NEXORA's route is excluded from RevelaCode service-worker interception and must remain separately built and routed. A change in Git alone does not automatically update Render dashboard rewrite rules or service configuration.

## 7. Verification required before external assurance

- Verify token expiry, refresh, logout and revocation on web and Android.
- Test localStorage-disabled/private-browser behaviour.
- Run XSS and dependency-risk review.
- Test IndexedDB blocked/quota/error handling and localStorage fallback.
- Test offline mutation ordering, replay, deduplication and conflict recovery.
- Verify sensitive data is not placed in the offline cache without a retention policy.
- Exercise network loss during payment, invitation, attendance, stock and school finance flows.
- Test cold start, app update, stale chunks and Android back/navigation behaviour.
- Test current production and staging build origins from deployed artifacts.

Do not promise that all RevelaCode modules work offline. State which workflows have been explicitly tested and which require an active network.
