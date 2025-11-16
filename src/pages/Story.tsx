import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import houstonGolden from "@/assets/houston-golden.jpeg";
import { Footer } from "@/components/Footer";

export default function Story() {
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

      {/* Origin Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-instrument font-medium text-center mb-10 tracking-tight">
            Why RunStreak Exists
          </h1>
          
          {/* Story Paragraph */}
          <div className="text-base sm:text-lg text-foreground/90 leading-relaxed space-y-4 mb-12">
            <p>
              Every runner knows someone who claims they "never miss a day." The problem? There's no way to verify it.
            </p>
            
            <p>
              Strava tracks every run, but doesn't showcase commitment. Reddit's r/amileaday community shares screenshots, but it's all manual and unverified.
            </p>
            
            <p className="text-xl font-semibold text-foreground">
              RunStreak fixes this.
            </p>
            
            <p>
              Connect your Strava account. We automatically verify your daily running streak and display it on a public leaderboard. No screenshots. No manual logging. Just pure, verified commitment.
            </p>
            
            <p>
              Built for runners who don't just talk about consistency—they prove it every single day.
            </p>
          </div>

          {/* Visual Formula */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 py-8 bg-muted/30 rounded-lg border border-border/50">
            {/* Strava Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
                <img 
                  src="https://www.google.com/s2/favicons?domain=strava.com&sz=64" 
                  alt="Strava"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
              <span className="text-xs text-muted-foreground">Strava API</span>
            </div>

            {/* Plus Symbol */}
            <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">+</span>

            {/* Daily Verification */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-card border border-border flex items-center justify-center">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span className="text-xs text-muted-foreground">Verification</span>
            </div>

            {/* Equals Symbol */}
            <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">=</span>

            {/* RunStreak Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                <Flame 
                  className="h-6 w-6 sm:h-8 sm:w-8" 
                  style={{
                    stroke: 'url(#gradient-formula)',
                    fill: 'none',
                    strokeWidth: 2
                  }}
                />
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id="gradient-formula" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(25 100% 60%)" />
                      <stop offset="100%" stopColor="hsl(15 100% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">RunStreak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Founder Story Section */}
      <div className="py-16 px-4 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-instrument font-medium text-center mb-10 tracking-tight">
            Meet the Founder
          </h2>

          <div className="flex flex-col items-center gap-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                <img 
                  src={houstonGolden} 
                  alt="Houston Golden"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-semibold mb-2">Houston Golden</h3>
                <p className="text-muted-foreground mb-2">Founder, RunStreak</p>
                <p className="text-sm text-muted-foreground">
                  Serial entrepreneur with 200+ day running streak
                </p>
              </div>
            </div>
          </div>

          <div className="text-base sm:text-lg text-foreground/90 leading-relaxed space-y-4 mb-8">
            <p>
              "I've been running daily for over 200 days, but there was no easy way to prove it or compare my commitment with other runners. I wanted a platform that automatically verifies and celebrates consistency."
            </p>
            
            <p>
              Houston built RunStreak using cutting-edge AI tools to create a community where dedication is transparent and competition drives everyone to show up every single day.
            </p>
          </div>

          <div className="p-6 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Built by the team behind <a href="https://bamf.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BAMF.com</a> and <a href="https://bamf.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BAMF.ai</a> — empowering creators and entrepreneurs through technology and community.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
