# ADR-000: Record the OIDC MFA signal in the audit log

## Status
Proposed

## Date
2026-11-17

## Context

### Background

Garvan's security policy, as quoted in [#705](https://github.com/Garvan-Data-Science-Platform/ctrl/issues/705), accepts Garvan's own identity provider as meeting the policy, but requires an MFA signal when CTRL accepts a login from an external source. The issue asks CTRL to request MFA, check the signal that comes back, and warn when it's missing.

Garvan's deployment has two OIDC providers for admin logins. Auth0 is Garvan's own, set up by Garvan IT to send staff through Garvan's Okta, which asks for MFA. AAF runs a CILogon service that brokers logins from Australian research institutions and from social providers such as Google. Other organisations deploy CTRL with their own providers or with password login only, so their logins must not change unless they opt in.

### Current State

On `dev` at `a4d1c9e`, `loginOIDC` reads only the access token and ignores the ID token (`application/backend/src/controllers/AuthController.ts:315`). A login's audit row has no user ID, because the middleware takes it from the login token, which a login request doesn't have yet (`application/backend/src/middlewares/AuditLog.ts:16`).

Real logins through AAF, summarised in the [#705 update comment](https://github.com/Garvan-Data-Science-Platform/ctrl/issues/705#issuecomment-6934020709), showed:

- A Garvan login returns `acr` `https://refeds.org/profile/mfa` in the ID token, and the institution's name when the `org.cilogon.userinfo` scope is requested.
- A Google login returns no `acr`. AAF says social providers don't signal MFA ([AAF CILogon Q&A](https://support.aaf.edu.au/support/solutions/articles/19000136535-aaf-cilogon-capability-q-a)).
- No login returned `amr`, the claim that names the MFA method. The REFEDS MFA profile leaves it out of scope ([REFEDS MFA profile](https://refeds.org/profile/mfa), section 4.4).

## Options considered

### Request MFA from the provider

CTRL would send `acr_values` so the provider forces MFA. CILogon doesn't pass MFA requests on to institutions ([CILogon FAQ](https://www.cilogon.org/faq)), and a Google login sent with `acr_values=https://refeds.org/profile/mfa` came back with no `acr` and no error. CTRL would still need to check the reply.

### Block logins without the MFA signal

CTRL would reject an OIDC login whose ID token carries no MFA value. Social logins would never get through, and an institution that does MFA but doesn't signal it yet would be locked out until its IT changes its IdP.

### Record the signal and flag logins without it (chosen)

CTRL reads the ID token on every OIDC login, stores the MFA claims in the login's audit row, and flags logins without an MFA value. No login is blocked.

## Decision

We will record the MFA signal of each OIDC login in its audit row and flag logins without it, without blocking any login.

- CTRL checks the ID token's issuer, audience and expiry, but not its signature. The token comes straight from the token endpoint over TLS, which OIDC Core accepts in place of a signature check ([OIDC Core 1.0, section 3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation), step 6). A missing or unreadable token is recorded as an error and never fails the login.
- The row keeps the provider, the user ID and only the `acr`, `amr`, `auth_time`, `idp` and `idp_name` claims. It doesn't keep the email, because `meta` isn't encrypted while `User.email` is (`application/backend/prisma/schema.prisma:20`, `:227-228`).
- Each OIDC provider gets three optional settings: `additionalScopes`, `auditLogClaims` (on by default) and `auditLogMfaWarning`, the `acr` and `amr` values that count as MFA. Only providers with `auditLogMfaWarning` get flagged.

For Garvan, AAF gets `additionalScopes: ['org.cilogon.userinfo']` and `auditLogMfaWarning: { acrValues: ['https://refeds.org/profile/mfa'] }`. Auth0 is recorded without a warning, because the policy accepts Garvan's own provider. A per-provider option to block is a call for when a deployment needs it.

## Rationale

- The signal that comes back is the only thing CTRL can act on. Recording it first lets each institution's behaviour be checked from its first logins before anything depends on it.
- Flagging keeps every institution that can log in today able to log in, while still giving security the evidence the policy asks for.
- The warning is per provider and off unless set, so other deployments keep their current logins. Recording the claims only adds audit detail.
- The flag shows that a signal arrived, not that MFA happened. It trusts the institution's IdP the same way CTRL already trusts it for who the user is, and an IdP can be misconfigured: an earlier test in [#705](https://github.com/Garvan-Data-Science-Platform/ctrl/issues/705) saw `PasswordProtectedTransport` from a login that used 2FA.

## Consequences

Each OIDC login row shows the provider, the user, the institution and, where configured, whether MFA was signalled. Password and OTP login rows also get the user ID, which links the two rows of a participant login ([#859](https://github.com/Garvan-Data-Science-Platform/ctrl/issues/859)) and covers most of [#852](https://github.com/Garvan-Data-Science-Platform/ctrl/issues/852).

The audit log can't say which MFA method was used. Each CILogon client has to allow the `org.cilogon.userinfo` scope for the institution to arrive. If Auth0 is later set up to pass Okta's MFA result on, it arrives under a custom claim name, because Auth0 doesn't let an Action set `acr` or `amr` ([Auth0: create custom claims](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)), and reading it needs a small code change.

Logins are still recorded as `CREATE` (`application/backend/src/middlewares/AuditLog.ts:33-34`). A separate login operation needs a new `AuditLogOperation` value and a migration.
