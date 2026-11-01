# PocketPlan

A device-local savings planner for Nimiq Pay. Targets and allocations are in NIM. Funds remain in the connected wallet: allocations do not transfer, lock, or earn yield.

## Develop

Node 22+, `npm install`, `npx vite --host 0.0.0.0`. Build with `npm run build`; deploy `dist/` as a Render static site. No server, secrets or database required. Google Fonts are requested for typography; system fonts are the fallback.

## Wallet testing

Open the deployed HTTPS URL inside Nimiq Pay's Mini Apps Custom URL field. Connect and approve sharing addresses. SDK >=0.2.1 and a compatible Nimiq Pay host are required for `getBalance`. If multiple addresses are shared, select a regular spending address. Reading an address does not prove ownership or spendability. The app reads the active wallet network from host context and keeps mainnet and testnet plans separate. It never switches wallet networks. Testnet is for development; the competition requires a mainnet product. The current preview is owner-private and needs a public Render deployment before external Nimiq Pay testing/submission.

Create a goal, allocate NIM, reload and reconnect. Spend from your own wallet outside PocketPlan and refresh: allocations exceeding the current balance should shrink proportionally. Failed balance lookups keep the last known number visibly stale and block allocations. Zero is a valid successful balance. Check permission denial and older hosts without balance lookup. Confirm no send/sign methods are invoked.

## Persistence and privacy

Goals and address association live only in localStorage on this browser/device. Clearing browser data loses them. Export/restore JSON backups are available; backups contain wallet address and goal names. No wallet balance is persisted. Sample mode has separate storage and never calls wallet transactions. Do not import private keys: the app never asks for them. No custom backend, analytics or custody.

## Status

Second implementation with a payday planner. Build and deterministic allocation math tests checked locally. Real Nimiq Pay device integration remains to be verified. Not submitted to the competition. A public MIT GitHub repo, public mainnet deployment, user testing, promotion and final submission are still required.

## Payday planner

Enter your received NIM amount, savings percentage and spending buffer. Preview assigns at most the unassigned wallet balance after the buffer, filling earliest deadlines first. Confirming refreshes the balance again; a changed plan or insufficient funds prevents applying an outdated preview. Entering a payday is not a verified income event, deposit or transaction. The app never moves funds.

## Network safety and backups (v2)

SDK 0.2.4 exposes `getHostNetwork()`. This build requires the host to identify mainnet or testnet; unknown networks are blocked with an update instruction. Goals and backups are isolated by network and selected address. If the network changes during a refresh, reconnect. Old v1 data is left untouched; v1 backups are not silently assigned to a network. Export new v2 backups before switching devices or deployments. Unknown/corrupt local data is not automatically overwritten. Connection resets on page reload, and reconnecting opens the same network/address plan.

## Render

`render.yaml` defines a static site, with build `npm ci && npm run build` and publish directory `dist`. No paid compute service is needed. Connect a public GitHub repository containing these source files and the MIT license. `node_modules`, `.env` files, internal `.openai` metadata and generated output do not belong in that public source export. Static deploy needs no secrets. Hosting is still the private preview until a Render connection and actual deployment have been completed.

Validation: seven model tests cover amount precision, proportional reductions, payday caps/buffers, goals and backups. Example-mode browser checks are separate from real wallet verification, which remains pending.
