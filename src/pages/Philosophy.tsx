import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RunStreaksPhilosophy } from "@/components/RunStreakPhilosophy";
import { Footer } from "@/components/Footer";

export default function Philosophy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Philosophy - RunStreaks | The Power of Daily Running</title>
        <meta name="description" content="Discover the RunStreaks philosophy: why daily running builds consistency, discipline, and mental toughness. Learn how a simple 1-mile commitment transforms your fitness journey." />
        <meta property="og:title" content="RunStreaks Philosophy - The Power of Daily Running" />
        <meta property="og:description" content="Why daily running builds consistency, discipline, and mental toughness. The simple commitment that transforms your fitness." />
        <meta property="og:url" content="https://runstreaks.io/philosophy" />
        <meta name="twitter:title" content="RunStreaks Philosophy" />
        <link rel="canonical" href="https://runstreaks.io/philosophy" />
      </Helmet>
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 text-foreground font-medium transition-colors hover:text-foreground relative pb-1 mb-4"
          >
            <span className="relative">
              ← Back to Leaderboard
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </span>
          </button>
        </div>
      </div>

      {/* RunStreaks Philosophy Section */}
      <RunStreaksPhilosophy />

      <Footer />
    </div>
  );
}
