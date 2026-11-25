# RevelaCode frontend research library

**Edition:** Founder study and technical due diligence  
**Repository:** `musombi123/RevelaCode-Frontend`  
**Evidence snapshot:** 25 November 2026  
**Scope:** RevelaCode's React application and shared client-side services. NEXORA is documented as a separately mounted application and is covered by its own research dossier.

## Reading order

1. [Frontend architecture](FRONTEND-ARCHITECTURE.md) — application entry, routing, providers, component organization and API boundaries.
2. [Product surfaces and user journeys](PRODUCT-SURFACES-AND-USER-JOURNEYS.md) — dashboard and hub structure, main user flows, native packaging and web deployment.
3. [Authentication, offline behaviour and client delivery](AUTH-OFFLINE-AND-DELIVERY.md) — session restoration, token handling, offline data and sync design, Android boundary and known risks.

## Evidence standard

This material is based on the source and documentation visible on the `main` branch at the evidence date. It does not certify production deployment, adoption, accessibility, performance, security or complete feature acceptance.

- A page/component means a client-side surface exists.
- A client API service means the browser knows how to call an API.
- A backend route and passing test are separate evidence.
- A passing test does not prove the feature is deployed or being used by customers.
- A README statement describes the declared product contract; inspect current implementation and live service before external claims.

## Application boundary

The root RevelaCode application is a React/Vite web experience with React Router, application providers, shared UI components, dashboards, authentication services and domain API clients. It connects to the RevelaCode backend and to the separate RevelaAI service for AI requests.

The repository also contains `apps/nexora/`, an independent React app with its own HTML/Vite entry and React startup. It is built separately into the `/dev_nexora` path on the same static-hosting service. Shared static hosting does not mean shared application shell, authentication, API or project data.

## Related source

- [Root README](../../README.md)
- [Elimu user guide](../ELIMU_HUB_USER_GUIDE.md)
- [Elimu automation/synchronization guide](../ELIMU_AUTOMATION_AND_SYNCHRONIZATION_GUIDE.md)
- [Biashara automation/sync guide](../BIASHARA_AUTOMATION_AND_SYNC_GUIDE.md)
- [NEXORA path hosting boundary](../NEXORA_PATH_BASED_HOSTING.md)
- [NEXORA application README](../../apps/nexora/README.md)

## External disclosure

Do not publish customer information, JWTs, OAuth tokens, deployment secrets, internal admin routes or unredacted support screenshots. Use sanitized screenshots and demo accounts for public or partner presentations.
