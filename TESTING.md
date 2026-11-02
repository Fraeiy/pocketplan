# PocketPlan tester guide

Open https://pocketplan-psi.vercel.app/ inside Nimiq Pay → Mini Apps → Custom URL.

PocketPlan only reads your selected NIM address and balance. It does not move or lock funds, stake, sign messages, or ask for keys. Goals stay in this browser's storage. Export a backup before clearing data or changing devices or site addresses.

## Five-minute test

Use testnet NIM for funded tests. Switch networks in Nimiq Pay, not inside PocketPlan. Confirm the network shown beneath the balance before starting.

1. Connect and confirm the selected address balance matches Nimiq Pay. With several addresses, select the address you intend to use.
2. Create two goals with different future dates and small NIM targets. Check that “Your next move” highlights the earliest unfinished goal.
3. Assign a small amount. Confirm assigned plus unassigned equals your displayed wallet balance. No transaction should be requested.
4. Plan a payday: enter 500 NIM, 20%, and a spending buffer. The preview should assign at most 100 NIM, limited by your unassigned balance, buffer and remaining goal targets. Apply once. Wallet funds should be unchanged.
5. Close and reopen the mini app, reconnect to the same address and network, and confirm the goals and allocations remain.
6. Export a backup, change a goal name, then restore your backup. Confirm replacement before applying. The previous name and amounts should return.
7. Try restoring that backup while connected to a different address or network. It should be rejected. Switch back to see the original plan.
8. Optional, testnet only: spend testnet NIM through the wallet outside PocketPlan until your balance is below the total allocated. Refresh PocketPlan. Goal allocations should shrink proportionally to match the new balance.
9. Check connection cancellation, no funds, and an unavailable network. A failed refresh must not turn an unknown balance into zero or allow new allocations.

## Feedback to send

- Phone and Nimiq Pay version:
- Network: testnet or mainnet
- Step attempted:
- Expected result:
- Actual result:
- Anything confusing in the first minute:

A screenshot helps, but hide private wallet details. Never send recovery words, private keys, or passwords. Do not manufacture wallets or traffic to inflate competition usage.

## Validation status

Automated model checks and desktop example-mode checks are separate from real wallet checks. Mainnet address connection and a returned zero balance were observed in a user screenshot on November 2, 2026. Funded wallet flows, cancellation, stale balance behavior and device backup restoration still need explicit device results; do not report them as independently verified.
