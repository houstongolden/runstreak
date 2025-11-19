import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RunStreaksPhilosophy } from "@/components/RunStreakPhilosophy";
import { Footer } from "@/components/Footer";

export default function Philosophy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            ← Back to Leaderboard
          </Button>
        </div>
      </div>

      {/* RunStreaks Philosophy Section */}
      <RunStreaksPhilosophy />

      <Footer />
    </div>
  );
}
