# PocketPlan submission preparation

Category: Save

App: https://pocketplan-psi.vercel.app/

Public MIT source: https://github.com/Fraeiy/pocketplan

## Description for the submission form (under 250 words)

PocketPlan helps freelancers, students and anyone with uneven paydays give their NIM a purpose before spending it.

Inside Nimiq Pay, connect an address, create savings goals and assign part of your existing balance to each one. The dashboard separates goal allocations from unassigned money and highlights the next unfinished deadline, with a weekly planning target.

When a payment arrives, enter its amount, choose a savings percentage and leave a buffer for everyday spending. PocketPlan previews a plan that fills the earliest goals first, capped by the selected address's available balance and each goal's remaining target. Applying the plan refreshes the wallet balance again.

Allocations are planning labels. They do not transfer or lock NIM, prevent spending, or earn yield. If the wallet balance falls below your allocations, PocketPlan reduces them proportionally after a successful refresh. Failed balance reads remain visibly unavailable or stale instead of being treated as zero.

Goals stay on the user's device, with JSON backup and restore. Plans are separated by wallet address and network. The app uses the Nimiq Mini Apps SDK for account access, network detection and balance lookup. No custom backend or private keys are required.

## Submission checklist

- [ ] Complete the funded testnet device checklist in TESTING.md.
- [ ] Verify the public URL inside Nimiq Pay on mainnet before submitting.
- [ ] Confirm the entry name is available in the current competition portal.
- [ ] Submit in Save with the public URL and MIT source repository.
- [ ] Supply the actual team representative and payout address in the form.
- [ ] Add the direct Skool and public social post links after publishing them.
- [ ] Record a short walkthrough of the actual working app. Do not label example mode as a funded wallet test.
- [ ] Recruit genuine testers, document feedback and address failures.
- [ ] Maintain public hosting through judging and any winner obligations.

Deadline verified November 2: November 11, 2026 at 23:59 UTC, or November 12 at 00:59 Africa/Lagos. Working submission target: November 8. Verify the portal again before final submission.

Official sources:
- https://www.nimiq.com/blog/mini-apps-competition-cycle-3-announcement/
- https://miniappscompetition.com/rules
- https://miniappscompetition.com/scoring
- https://miniappscompetition.com/faq

## X draft (not published)

Uneven paydays make saving harder than it should be.

I'm building PocketPlan for the Nimiq Mini Apps Competition. Set a goal, plan part of each payday, and see what's left for everyday spending.

Your NIM stays in your wallet. Nothing is locked.

I'd love feedback from Nimiq Pay users:
https://pocketplan-psi.vercel.app/

## Skool tester post draft (not published)

Title: PocketPlan: looking for feedback on saving around uneven paydays

I'm building PocketPlan in the Save category. It's for people who don't get paid the same amount on the same day every month.

Connect Nimiq Pay, create a goal and plan a share of a payday. It prioritises the nearest deadlines, leaves your chosen spending buffer and shows how much NIM is still unassigned. Allocations are labels, so all funds stay spendable in your wallet.

Try it in Nimiq Pay → Mini Apps → Custom URL:
https://pocketplan-psi.vercel.app/

Example mode is available without a funded wallet. For funded testing, use testnet first. I'd especially like feedback on whether the first minute is clear, whether the payday preview makes sense, and whether your goals return after reopening.

Code: https://github.com/Fraeiy/pocketplan

Please tell me what confused you or broke. I'll use the feedback to improve it before the deadline.
