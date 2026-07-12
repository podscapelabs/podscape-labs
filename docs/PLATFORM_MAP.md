# Podscape Labs Platform Map

This document records the current application boundaries and the intended direction for shared platform infrastructure. It is descriptive, not a migration plan.

## Current applications

| Application | Responsibility | Repository | Public domain | Hosting | Authentication and data |
| --- | --- | --- | --- | --- | --- |
| Podscape Labs | Parent studio and public marketing website | `podscapelabs/podscape-labs` | `https://www.podscapelabs.com` | Vercel | No shared platform account system is currently implemented in this repository |
| PodBound | PodBound public website, accounts, administration, and playtest simulator | `podscapelabs/podbound` | `https://www.podbound.net` | Vercel | Supabase authentication and database |

## Current ownership boundaries

### Podscape Labs repository

- Podscape public pages and navigation
- Podscape visual theme and design tokens
- PodBound promotional presentation on Podscape
- links into the PodBound website

### PodBound repository

- PodBound public pages and Field Archive presentation
- registration, sign-in, password recovery, and account pages
- account roles: registered, playtester, and administrator
- PodBound Field access enforcement
- playtest agreement and report submission
- PodBound administration
- maintenance controls
- Supabase schema and numbered migrations

## Shared-platform direction

Podscape Labs is the parent platform. Podscape and PodBound remain separate modules and may continue to use separate repositories and deployments. Shared capabilities should be introduced deliberately through compatible services or packages rather than by immediately merging the applications.

Planned shared concerns include stable account identity, authentication, roles and permissions, administrative components, maintenance and system-health visibility, notifications, email infrastructure, audit logging, and appropriate shared design tokens.

The current PodBound identity must not be duplicated when Podscape account features are introduced. The authentication and database architecture must be audited before either application begins sharing user data.

## Compatibility rules

- Preserve the current public domains and working routes.
- Use **PodBound Field** in new public-facing wording.
- Keep `/arena` and existing Arena-named database fields or APIs as compatibility aliases until a reviewed migration and redirect plan exists.
- Apply database migrations in order and separately record whether each migration reached production.
- Do not assume a migration is live merely because its SQL file is committed.
- Do not move secrets, production data, or environment values between repositories.
- Do not merge the repositories without a separately approved technical proposal.

## Deployment and service checklist

Confirm and record these details before shared-platform implementation begins:

- Vercel project name and production branch for each application
- custom-domain ownership and DNS provider
- Supabase project used by PodBound
- production migration ledger
- authentication email provider and sending limits
- environment-variable ownership by application
- backup and rollback procedure
- service owner and recovery contact

Do not put secret values, API keys, passwords, or private connection strings in this document.
