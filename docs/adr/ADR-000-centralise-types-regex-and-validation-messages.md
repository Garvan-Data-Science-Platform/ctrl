# ADR-000: Centralise core types, regex and validation messages to improve input validation

## Status

Proposed

## Date

2026-09-23

## Context

### Background

A penetration test identified insufficient validation of user input data.

Prisma ORM generates parameterised queries which [helps prevent against SQL injection](https://github.com/prisma/orm/discussions/19533).
React [escapes unsafe characters before rendering](https://reactz2h.com/chapter_12_frontend_security_for_react/series_01_xss_and_injection_defense/understanding_react_escaping) which helps reduce risk of Cross site scripting (XSS).
However without user input validation, it is still possible to store malicious payloads (leading to Stored XSS) in the database.
Even if it isn't easy to exploit this with the current set up, it is still not wise.
OWASP recommends [strict positive validation (allowlisting) to ensure only properly formed data is able to be processed by the application](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html).

Note, there are two categories of input validation:
- *Syntactic* validation (values match acceptable patterns)
- *Semantic* validation (values are within expected range)

This ADR relates only to *Syntactic* validation.

Input validation should occur both Client-side and Server-side.
This means every form on both Participant and Admin clients needs to only accept valid input AND the API should only accept requests that contain valid data.
There should be feedback to the user to communicate when input is invalid.

### Current State

Currently there is only some input validation on a small subset of fields in the two frontend clients, implemented in an inconsistent manner.
API validation is implemented via [TSOA](https://tsoa-community.github.io/docs/introduction.html), with only a small number of fields having specific allow-list validation.
The regex for existing validation are found in many places in the codebase, sometimes duplicated in multiple locations.

TSOA uses JSDoc to specify request Data Transfer Object (DTO) properties, which cannot be populated with variables.
This results in duplication between regex used in the application and in the model specification.
Also, the JSDoc specifications are applied throughout the various models (not always consistently)

Finally, Error messages are distributed all throughout the app and often hardcoded between application and tests.

## Options considered

### Zod

[Zod](https://zod.dev/) is a TypeScript focused schema validation library that would be perfect for this use case (it has libraries to work with Prisma schema, and integrations with react Forms).
It is used in [Elsa data](https://github.com/elsa-data/elsa-data/) and has previously been discussed for Ctrl ([see link to issue](https://github.com/Garvan-Data-Science-Platform/ctrl/issues/871)).

### Refactor types, regex and validation messages

The alternative to moving to zod is to implement client- and server-side validation, while being as DRY as possible to make maintenance easier in the future.

This would involve:
- moving regex to one common location so it can be used in forms in both front-ends and easily maintained
- moving validation messages to one common location so they can be used in both frontends as well as tests and easily maintained
- defining a set of 'core' or 'common' types (with TSOA validation rules), that can then be used in the various request DTO definitions (to ensure consistency of validation rules, and easy maintenance)

## Decision

We will refactor types, regex and validation messages to be as DRY as possible, and defined in a common location.
I also will add tests for input validation (Jest in Backend and Cypress in both Frontends).

## Rationale

It was viewed that the move to Zod would represent too major of a change at this time [see this slack conversation](https://garvan-data-science.slack.com/archives/C044Z3WEBUN/p1782802254271349).
In making this decision, we may have underestimated how much work was going to be involved in the refactor(!!).

## Consequences

Identifying core common types is useful for a future move to Zod, so this wasn't wasted work if we move to Zod in the future.
Regex, validation messages and common types are all specified in `application/common` and as a result are much more DRY and easily maintainable.

There is still duplication between the Regex used in the application and in the type JsDoc specifications (as these cannot use variables).
However to mitigate the difficulties of maintaining this, I've put both in the same file.

There are two places where request DTO properties are specified using JSDoc outside of the `application/common/types/commonTypes.ts`, but these could possibly be handled in common types:
- `application/common/types/api/auth/registerParticipant.ts` - max number of dependents; and,
- `application/common/types/api/users/updateProfile.ts` - max number of dependents.
