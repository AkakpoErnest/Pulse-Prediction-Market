import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/layout/HeroSection";
import { MarketFeed } from "@/components/market/MarketFeed";
import { StatsBar } from "@/components/layout/StatsBar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dark-500 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-pulse-500/5 blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-somnia-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-pulse-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <StatsBar />
        <MarketFeed />
      </div>
    </main>
  );
}
