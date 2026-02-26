import { Navbar } from "@/components/layout/Navbar";
import { MarketDetail } from "@/components/market/MarketDetail";

interface Props {
  params: { id: string };
}

export default function MarketPage({ params }: Props) {
  const marketId = BigInt(params.id);

  return (
    <main className="min-h-screen bg-dark-500 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-pulse-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-somnia-500/5 blur-[120px]" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <MarketDetail marketId={marketId} />
      </div>
    </main>
  );
}
