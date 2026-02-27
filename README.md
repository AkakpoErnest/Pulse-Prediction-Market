# ⚡ Pulse Market

> **Reactive prediction markets that auto-settle the instant an on-chain event fires — no oracles, no backends, no cron jobs.**

Built for the **Somnia Reactivity Hackathon** on Somnia Testnet (Shannon).

---

## The "Wow" Factor

Traditional prediction markets require a trusted oracle or an admin to push the settlement result. Pulse Market eliminates that entirely.

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

The entire settlement cycle happens **within the same block** as the triggering event. No oracles. No keepers. No backends. Just Somnia.

---

## Live Contracts (Somnia Testnet)

| Contract | Address | Explorer |
|---|---|---|
| PulseMarket | `0xF996C610619C0376840d4634af8477e9CBFF1AE2` | [View ↗](https://shannon-explorer.somnia.network/address/0xF996C610619C0376840d4634af8477e9CBFF1AE2#code) |
| SomniaEventHandler | `0x2a3563D707E4d61797D80832CA76F1621221cdc1` | [View ↗](https://shannon-explorer.somnia.network/address/0x2a3563D707E4d61797D80832CA76F1621221cdc1#code) |

Both contracts are **source-verified** on Shannon Explorer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.25, Hardhat, OpenZeppelin v5 |
| Reactivity | Somnia IReactiveContract, Reactive Service |
| Frontend | Next.js 14 (App Router), TypeScript |
| Web3 | wagmi v2, viem, RainbowKit |
| 3D / Animations | @react-three/fiber, @react-three/drei, framer-motion, GSAP |
| Styling | Tailwind CSS |
| Network | Somnia Testnet (Shannon), Chain ID 50312 |

---

## How It Works

### 1. Create a Market
Any wallet can create a market by specifying:
- A **question** (e.g. "Will the next STT transfer exceed 100 STT?")
- A **watched contract address** (e.g. an ERC-20 token)
- An **event topic** (e.g. `Transfer(address,address,uint256)`)
- A **condition** (e.g. `value > 100 STT`)
- A **duration** (5 min → 30 days)

The creation bond (0.01 STT) counts as the creator's initial YES bet.

### 2. Subscribe to Reactivity
After creation, `SomniaEventHandler.subscribeMarket(id)` is called. This registers the market with Somnia's Reactive Service, which begins watching the target contract for the specified event.

### 3. Bet
Other users bet YES or NO with a minimum stake of 0.001 STT.

### 4. Auto-Settlement
When the watched event fires on-chain, Somnia's Reactive Service calls `react()` on `SomniaEventHandler` **within the same block**. The handler evaluates whether the condition was met and calls `PulseMarket.resolveMarket()`.

### 5. Claim
Winners call `claimWinnings()`. If the market expires without being triggered, all bettors get full refunds.

### Fee Structure
- 97% → winning bettors (proportional to stake)
- 2% → market creator
- 1% → platform

---

## Repo Structure

```
pulse-market/
├── contracts/
│   ├── contracts/
│   │   ├── PulseMarket.sol          # Core market lifecycle
│   │   ├── SomniaEventHandler.sol   # Reactive settler
│   │   └── interfaces/
│   ├── scripts/deploy.ts
│   ├── test/PulseMarket.test.ts     # 18 tests, all passing
│   └── hardhat.config.ts
└── frontend/
    ├── src/
    │   ├── app/                     # Next.js App Router
    │   ├── components/
    │   │   ├── three/               # 3D globe + particle effects
    │   │   ├── market/              # Market feed, cards, detail, create
    │   │   ├── layout/              # Navbar, hero, stats
    │   │   └── ui/                  # Toast, activity feed
    │   ├── hooks/                   # wagmi hooks + live event watcher
    │   └── lib/contracts/           # ABIs, addresses, encoding
    └── package.json
```

---

## Running Locally

### Prerequisites
- Node.js ≥ 18
- An STT-funded wallet ([get STT here](https://testnet.somnia.network/))

### Install
```bash
git clone https://github.com/your-repo/pulse-market
cd pulse-market
npm install
```

### Configure
```bash
cp .env.example .env
# Edit .env — set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# (free at cloud.walletconnect.com)
```

### Run frontend (connects to live testnet contracts)
```bash
npm run dev       # http://localhost:3000
```

### Deploy your own contracts
```bash
npm run compile         # compile
npm run test            # 18 tests
npm run deploy:testnet  # deploy + verify on Somnia Testnet
```

---

## Network Config

| Field | Value |
|---|---|
| Network Name | Somnia Testnet |
| RPC URL | `https://dream-rpc.somnia.network` |
| Chain ID | `50312` |
| Symbol | `STT` |
| Explorer | `https://shannon-explorer.somnia.network` |

---

## License

MIT
