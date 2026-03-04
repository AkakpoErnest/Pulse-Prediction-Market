# ⚡ Pulse Market

> **Reactive prediction markets that auto-settle the instant an on-chain event fires — no oracles, no backends, no cron jobs.**

Built for the **Somnia Reactivity Hackathon** on Somnia Testnet (Shannon).

---

## What Makes This Different

Traditional prediction markets require a trusted oracle or an admin to push the settlement result on-chain. Pulse Market eliminates that entirely using **Somnia's Reactive Network**.

```
User creates market:  "Will the next Transfer be > 100 STT?"
                               │
                    ┌──────────▼──────────┐
                    │    PulseMarket.sol   │  ← bettors place YES / NO bets
                    └──────────┬──────────┘
                               │ subscribeMarket()
                    ┌──────────▼──────────────────────┐
                    │  SomniaEventHandler.sol          │
                    │  implements IReactiveContract    │
                    └──────────┬──────────────────────┘
                               │ registered with
                    ┌──────────▼──────────────────────┐
                    │  Somnia Reactive Service         │  ← watches the chain
                    └──────────┬──────────────────────┘
                               │
              Watched event fires on-chain (Transfer emitted)
                               │
                    ┌──────────▼──────────────────────┐
                    │  react() called automatically   │  ← same block
                    │  evaluates condition            │
                    │  calls resolveMarket()          │
                    └──────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Winners claim STT  │  ✓ done
                    └─────────────────────┘
```

The entire settlement cycle — from event emission to resolved market — happens **within the same block**. No oracles. No keepers. No backends. Just Somnia.

---

## Live Demo

| | |
|---|---|
| **Live App** | *(add your deployed URL here)* |
| **Network** | Somnia Testnet (Shannon) — [Add to MetaMask](#network-config) |
| **Get STT** | [testnet.somnia.network](https://testnet.somnia.network/) |

---

## Live Contracts (Somnia Testnet)

| Contract | Address | Explorer |
|---|---|---|
| PulseMarket | `0xF996C610619C0376840d4634af8477e9CBFF1AE2` | [View ↗](https://shannon-explorer.somnia.network/address/0xF996C610619C0376840d4634af8477e9CBFF1AE2#code) |
| SomniaEventHandler | `0x2a3563D707E4d61797D80832CA76F1621221cdc1` | [View ↗](https://shannon-explorer.somnia.network/address/0x2a3563D707E4d61797D80832CA76F1621221cdc1#code) |

Both contracts are **source-verified** on Shannon Explorer.

---

## Features

- **Reactive auto-settlement** — markets resolve in the same block as the triggering event
- **Zero external dependencies** — no Chainlink, no API endpoints, no cron jobs
- **Template-based market creation** — guided UI with inline address validation and reactivity warning on skip
- **Creator fee withdrawal** — market creators can claim their 2% fee directly from the market detail page
- **Live activity feed** — watch bets and settlements stream in real time
- **3D reactive globe** — animated arcs visualise global market activity (React Three Fiber)
- **Particle burst effects** — settlement animations powered by Framer Motion
- **Expiry refunds** — if a market expires before triggering, all bettors get full refunds
- **Setup detection** — clear banner if contract env vars are missing, so the app never silently breaks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.25, Hardhat, OpenZeppelin v5 |
| Reactivity | Somnia IReactiveContract, Somnia Reactive Service |
| Frontend | Next.js 14 (App Router), TypeScript |
| Web3 | wagmi v2, viem, RainbowKit |
| 3D / Animations | @react-three/fiber, @react-three/drei, framer-motion |
| Styling | Tailwind CSS |
| Network | Somnia Testnet (Shannon), Chain ID 50312 |

---

## How It Works

### 1. Create a Market
Any wallet can create a market by specifying:
- A **question** (e.g. "Will the next STT transfer exceed 100 STT?")
- A **watched contract address** (any on-chain contract)
- An **event** to watch (e.g. `Transfer(address,address,uint256)`)
- A **condition** (e.g. `value > 100 STT`)
- A **duration** (5 min → 30 days)

The creation bond (0.01 STT) counts as the creator's initial YES bet.

### 2. Subscribe to Reactivity
After creation, `SomniaEventHandler.subscribeMarket(id)` is called. This registers the market with Somnia's Reactive Service, which begins watching the target contract for the specified event. The `CreateMarketModal` guides you through this step automatically.

### 3. Bet
Other users bet YES or NO with a minimum stake of 0.001 STT. Stakes accumulate in the market contract.

### 4. Auto-Settlement
When the watched event fires on-chain, Somnia's Reactive Service calls `react()` on `SomniaEventHandler` **within the same block**. The handler decodes the event payload, evaluates the condition, and calls `PulseMarket.resolveMarket()` with the outcome.

### 5. Claim
Winners call `claimWinnings()`. Winnings are distributed proportional to stake. If the market expires without being triggered, all bettors receive full refunds via `cancelExpiredMarket()`.

Market **creators** can separately withdraw their 2% fee via the "Withdraw Creator Fee" button on the market detail page, available after the first winner claims.

### Fee Structure

| Recipient | Share |
|---|---|
| Winning bettors | 97% (proportional to stake) |
| Market creator | 2% (claimable after first winner) |
| Platform | 1% |

---

## Repo Structure

```
pulse-market/
├── contracts/
│   ├── contracts/
│   │   ├── PulseMarket.sol          # Core market lifecycle (create, bet, resolve, claim)
│   │   ├── SomniaEventHandler.sol   # Reactive settler (IReactiveContract)
│   │   └── interfaces/
│   │       ├── IPulseMarket.sol
│   │       └── IReactiveContract.sol
│   ├── scripts/deploy.ts
│   ├── test/PulseMarket.test.ts     # 18 tests, all passing
│   └── hardhat.config.ts
└── frontend/
    ├── src/
    │   ├── app/                     # Next.js App Router pages
    │   ├── components/
    │   │   ├── three/               # ReactiveGlobe (R3F), SettlementBurst (Framer)
    │   │   ├── market/              # MarketFeed, MarketCard, MarketDetail, CreateMarketModal
    │   │   ├── layout/              # Navbar, HeroSection, StatsBar
    │   │   └── ui/                  # ToastProvider, ActivityFeed
    │   ├── context/                 # ToastContext, UserContext
    │   ├── hooks/                   # usePulseMarket, useMarketActions, useReactiveEvents
    │   └── lib/contracts/           # ABIs, addresses, condition encoding
    └── package.json
```

---

## Running Locally

### Prerequisites
- Node.js ≥ 18
- An STT-funded wallet — [get STT here](https://testnet.somnia.network/)

### Install

```bash
git clone https://github.com/your-repo/pulse-market
cd pulse-market
npm install
```

### Configure

```bash
cp .env.example .env
# Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (free at cloud.walletconnect.com)
# Contract addresses are pre-configured for Somnia Testnet
```

### Run frontend (connects to live testnet contracts)

```bash
npm run dev --workspace=frontend
# → http://localhost:3000
```

### Run tests

```bash
npm run test --workspace=contracts      # 18 Hardhat tests
npm run build --workspace=frontend      # production build check
```

### Deploy your own contracts

```bash
# Set DEPLOYER_PRIVATE_KEY in .env first
npm run compile --workspace=contracts
npm run deploy:testnet --workspace=contracts
```

---

## Network Config

Add Somnia Testnet to MetaMask:

| Field | Value |
|---|---|
| Network Name | Somnia Testnet |
| RPC URL | `https://dream-rpc.somnia.network` |
| Chain ID | `50312` |
| Currency Symbol | `STT` |
| Block Explorer | `https://shannon-explorer.somnia.network` |

---

## Smart Contract Architecture

### PulseMarket.sol

Core state machine for each market:

```
Created → Active → Resolved (YES / NO)
                └→ Cancelled  (expired before event triggered → full refunds)
```

Key functions:
- `createMarket()` — creates market, bonds creator as YES bettor
- `placeBet(marketId, isYes)` — stake STT on YES or NO
- `resolveMarket(marketId, outcome)` — called only by `SomniaEventHandler`
- `claimWinnings(marketId)` — winners pull their proportional share
- `withdrawCreatorFee(marketId)` — creator pulls their 2% after first claim
- `cancelExpiredMarket(marketId)` — refund all bettors if expired before resolution
- `withdrawPlatformFees()` — owner withdraws accumulated 1% fees (emits `PlatformFeesWithdrawn`)

Security: `ReentrancyGuard`, `Pausable`, `Ownable` (OpenZeppelin v5). All ETH transfers use `call{}` with boolean check.

### SomniaEventHandler.sol

Implements `IReactiveContract` as the bridge between Somnia's Reactive Service and `PulseMarket`:

- `subscribeMarket(id)` — registers a market's (contract, event topic, condition) with the Reactive Service
- `react(chainId, origin, topics[], data)` — called by Somnia when the watched event fires; decodes payload, evaluates condition, calls `resolveMarket()`
- `_evaluateCondition()` — decodes Transfer event data and compares value against threshold using the stored operator

---

## Changelog

### Latest (sprint week 1)
- Inline contract address validation with error feedback in the Create Market modal
- Reactivity warning shown when user tries to skip the subscription step
- "Page X of N" pagination in the market feed
- Creator fee withdraw button on the market detail page (visible to creators only)
- `PlatformFeesWithdrawn` event added to contract for on-chain transparency
- Condition label display unified with standard operator symbols (`>`, `≥`, `<`, `≤`, `=`)
- Misconfigured-contract banner shown when env vars are missing

---

## Known Limitations

- Reactive settlement currently fully supports **Transfer** event conditions. Approval and Swap template decoding is planned.
- WalletConnect requires a project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com) for reliable production use.
- This is a **testnet deployment** — contracts have not been audited for mainnet use.

---

## License

MIT
