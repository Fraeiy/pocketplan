# PocketPlan

A device-local savings planner for Nimiq Pay. Targets and allocations are in NIM. Funds remain in the connected wallet: allocations do not transfer, lock, or earn yield.

## Develop

Node 22+, `npm install`, `npx vite --host 0.0.0.0`. Run `npm test` and build with `npm run build`; deploy `dist/` as a static site. The public app is https://pocketplan-psi.vercel.app/. No server, secrets or database required. Google Fonts are requested for typography; system fonts are the fallback.

## Wallet testing

Open the deployed HTTPS URL inside Nimiq Pay's Mini Apps Custom URL field. Connect and approve sharing addresses. SDK >=0.2.1 and a compatible Nimiq Pay host are required for `getBalance`. If multiple addresses are shared, select a regular spending address. Reading an address does not prove ownership or spendability. The app reads the active wallet network from host context and keeps mainnet and testnet plans separate. It never switches wallet networks. Testnet is for development; the competition requires a mainnet product. The public Vercel deployment is available for Nimiq Pay device testing. A successful zero-balance mainnet connection has been observed; funded end-to-end wallet testing still needs device confirmation.

Create a goal, allocate NIM, reload and reconnect. Spend from your own wallet outside PocketPlan and refresh: allocations exceeding the current balance should shrink proportionally. Failed balance lookups keep the last known number visibly stale and block allocations. Zero is a valid successful balance. Check permission denial and older hosts without balance lookup. Confirm no send/sign methods are invoked.

## Persistence and privacy

Goals and address association live only in localStorage on this browser/device. Clearing browser data loses them. Export/restore JSON backups are available; backups contain wallet address and goal names. No wallet balance is persisted. Sample mode has separate storage and never calls wallet transactions. Do not import private keys: the app never asks for them. No custom backend, analytics or custody.

## Status

Public MIT source and a public Vercel deployment are available. The payday planner and next-goal overview are implemented. Automated model checks cover planning, precision, reconciliation and network/address-specific backups. Mainnet address and zero-balance lookup have been observed in a user screenshot; funded device flows remain to be confirmed. Not submitted to the competition. User testing, promotion and final submission remain.

## Payday planner

Enter your received NIM amount, savings percentage and spending buffer. Preview assigns at most the unassigned wallet balance after the buffer, filling earliest deadlines first. Confirming refreshes the balance again; a changed plan or insufficient funds prevents applying an outdated preview. Entering a payday is not a verified income event, deposit or transaction. The app never moves funds.

## Network safety and backups (v2)

SDK 0.2.4 exposes `getHostNetwork()`. This build requires the host to identify mainnet or testnet; unknown networks are blocked with an update instruction. Goals and backups are isolated by network and selected address. If the network changes during a refresh, reconnect. Old v1 data is left untouched; v1 backups are not silently assigned to a network. Export new v2 backups before switching devices or deployments. Unknown/corrupt local data is not automatically overwritten. Connection resets on page reload, and reconnecting opens the same network/address plan.

## Render

`render.yaml` defines a static site, with build `npm ci && npm run build` and publish directory `dist`. No paid compute service is needed. Connect a public GitHub repository containing these source files and the MIT license. `node_modules`, `.env` files, internal `.openai` metadata and generated output do not belong in that public source export. Static deploy needs no secrets. Render deployment is blocked pending support review; Vercel currently hosts the public app. No hosting-specific backend or storage is used. Export goals before changing site addresses because browser storage is origin-specific.

Validation: ten model tests cover amount precision, proportional reductions, payday caps/buffers, calendar-day guidance, goals and network/address-specific backups. Example-mode browser checks are separate from real wallet verification, which remains pending.

## Next-goal overview

The dashboard highlights the earliest unfinished target, a weekly planning amount, and money not assigned to goals. Overdue targets lead to a goal review; fully covered goals lead to a new goal. Guidance pauses when a balance is stale or being refreshed. This is a budget plan, not an income forecast or an enforced spending limit.

## Testing and submission

See [the device checklist](TESTING.md) and [submission preparation](SUBMISSION.md). The latter contains unpublished outreach drafts and a description under 250 words. No tester or user-count claims are made without evidence.
