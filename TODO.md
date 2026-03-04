# Pulse Market — 1-Week Sprint TODO

> Hackathon deadline: ~March 11, 2026. Priority order: **Critical → High → Medium → Low**.
> Check items off as you complete them.

---

## 🔴 CRITICAL — Must work before demo

- [ ] **End-to-end reactive flow test on testnet**
  - Create a market watching a real ERC-20 contract
  - Subscribe it via `subscribeMarket()`
  - Trigger the watched event (fire a Transfer > threshold)
  - Verify `react()` is called automatically and market settles
  - Verify winners can `claimWinnings()` successfully

- [ ] **Fix Approval & Swap event templates** (`CreateMarketModal.tsx` + `SomniaEventHandler.sol`)
  - `SomniaEventHandler._evaluateCondition()` only decodes `Transfer` events
  - Approval and Swap templates in the frontend silently resolve as "condition always true"
  - **Fix option A:** Implement proper ABI decoding for Approval + Swap in `_evaluateCondition()`
  - **Fix option B (quick):** Remove Approval & Swap from frontend TEMPLATES array until decoded properly

- [ ] **Verify existing uncommitted changes don't break build**
  - Run `npm run build --workspace=frontend` and confirm clean
  - Check `CreateMarketModal.tsx` `useCallback` refactor doesn't regress close behavior
  - Commit the `next.config.js` warning suppressions + modal cleanup

---

## 🟠 HIGH — Should be done this week

### Frontend Fixes

- [ ] **Contract address validation feedback** (`CreateMarketModal.tsx` line ~277)
  - Currently: invalid address silently passes or gives a confusing error
  - Add visible error message under the input field when address is invalid

- [ ] **"Skip subscription" warning** (`CreateMarketModal.tsx` step 2)
  - "Skip for now" closes without warning that reactive settlement won't work
  - Add a dismissible warning banner: _"Markets not subscribed auto-settle manually only."_

- [ ] **MarketDetail loading skeleton**
  - The detail page header shows nothing until contract data loads
  - Add a skeleton/shimmer for the question, stats, and betting panel

- [ ] **Fix operator symbol mismatch** (`lib/contracts/encode.ts` + `constants/index.ts`)
  - `formatConditionLabel()` uses different symbols (`›`, `‹`) vs `COMPARISON_OP_LABELS`
  - Normalise to use the same constants from `constants/index.ts`

- [ ] **Zero-address detection** (`lib/contracts/addresses.ts`)
  - If env vars are missing, contracts default to address(0) and calls fail silently
  - Add a check: if address is `0x000...`, show a clear "App not configured" banner instead of broken UI

- [ ] **WalletConnect projectId warning**
  - If `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is unset, log a console.warn so devs know
  - Add a note in `.env.example` that the default ID may throttle connections

### Smart Contracts

- [ ] **Add `PlatformFeesWithdrawn` event to `PulseMarket.sol`**
  - `withdrawPlatformFees()` currently emits nothing
  - Add `event PlatformFeesWithdrawn(address indexed to, uint256 amount);` and emit it

- [ ] **Add integration test for reactive settlement** (`contracts/test/`)
  - Test: deploy both contracts → create market → subscribe → simulate Transfer → check resolution
  - This gives confidence the full flow works before the demo

### UX / Polish

- [ ] **Pagination page count in MarketFeed**
  - Show "Page 1 of N" so users know how many pages exist
  - Disable Next button when on last page

- [ ] **Question length validation in CreateMarketModal advanced form**
  - Counter is displayed but form can still submit >280 chars
  - Add client-side guard: disable submit + show "too long" message

---

## 🟡 MEDIUM — Nice polish, do if time allows

- [ ] **Creator fee withdrawal UI** (`MarketDetail.tsx`)
  - Contract supports 2% creator fee but no button exists for creators to claim it
  - Add a "Claim Creator Fee" button visible only to the market creator

- [ ] **Consolidate event watching** (`useReactiveEvents.ts`)
  - Three separate `useWatchContractEvent` calls with different polling intervals
  - Consolidate into one or align intervals for consistency

- [ ] **Real TVL in StatsBar** (`components/layout/StatsBar.tsx`)
  - Currently shows hardcoded/dummy stats
  - Compute TVL from sum of all active market balances (loop over `markets[]`)

- [ ] **"My Bets" view**
  - No way for a user to see all their active/past bets in one place
  - Add a `/my-bets` page or a tab on the home page filtered by connected wallet

- [ ] **MarketFeed filter state persistence**
  - Active filter (all/active/resolved) resets on navigation
  - Persist to URL query param (`?filter=active`) so back-navigation works

- [ ] **ActivityFeed history overflow**
  - Capped at 20 events; oldest silently dropped
  - Show "view all" or at least a count of hidden events

- [ ] **Username validation** (`context/UserContext.tsx`)
  - No length limit shown to user (contract limit is 20 chars)
  - Add max-length counter in the username edit input

- [ ] **Mobile navbar** (`components/layout/Navbar.tsx`)
  - Links ("Explorer", "Faucet") are hidden on mobile
  - Add a hamburger menu that reveals them

- [ ] **Error recovery on failed transactions** (`useMarketActions.ts`)
  - After a failed tx, users see a raw error string
  - Add a friendly "Try again" state with readable error message

---

## 🟢 LOW — Stretch goals / post-hackathon

- [ ] **Subgraph / indexer**
  - Replace 10-second polling with an event-indexed data source for faster UX

- [ ] **Multi-event type support** (Swap, Approval full decode)
  - Full implementation of `_evaluateCondition()` for all template types

- [ ] **Market search & filter by creator**
  - `MarketFeed` has no search bar; hard to find specific markets as volume grows

- [ ] **Gas reporting**
  - Add `hardhat-gas-reporter` to contracts to track gas costs per function

- [ ] **SettlementBurst spatial distribution**
  - Burst positions are random and can overlap
  - Use a grid or spiral distribution so particles don't collide visually

- [ ] **Role="img" aria labels on emoji in Toast**
  - Accessibility: screen readers spell out emoji character names
  - Add `role="img" aria-label="..."` to emoji spans in `ToastContext.tsx`

- [ ] **Add own image domain to next.config.js**
  - Currently only `github.com` and `coingecko.com` are in the image allowlist
  - Add your own CDN/logo host when you have one

---

## ✅ DEPLOYMENT CHECKLIST (before final submission)

- [ ] All tests passing: `npm run test --workspace=contracts`
- [ ] Frontend builds clean: `npm run build --workspace=frontend`
- [ ] No TypeScript errors beyond the known TS2737 BigInt quirk
- [ ] `.env` has real `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- [ ] Contracts are verified on Shannon Explorer ✓ (already done)
- [ ] End-to-end reactive settlement confirmed on testnet
- [ ] README has demo video / live URL link
- [ ] README contract table up to date
- [ ] `HeroSection` hardcoded "0 oracle dependencies" badge reviewed
- [ ] ActivityFeed + Globe tested with live testnet events

---

## 📦 QUICK WINS (< 30 min each, do these first)

1. Commit current uncommitted changes (`next.config.js` + `CreateMarketModal.tsx`)
2. Fix operator symbol mismatch in `encode.ts`
3. Add `PlatformFeesWithdrawn` event to contract
4. Add "Skip subscription" warning in `CreateMarketModal`
5. Add page count to `MarketFeed` pagination
6. Add question length guard on advanced form submit
7. Add zero-address detection banner
