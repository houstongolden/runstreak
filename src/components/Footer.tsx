import { useState } from "react";
import { AppDownloadSection } from "@/components/AppDownloadSection";
import { AdvertiseModal } from "@/components/AdvertiseModal";

export function Footer() {
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);

  return (
    <>
      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <footer className="border-t border-border pt-12 pb-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:px-[240px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Explore */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Explore</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    Global Leaderboard
                  </a>
                </li>
                <li>
                  <a href="/features" className="hover:text-foreground transition-colors">
                    Platform Features
                  </a>
                </li>
                <li>
                  <a href="/philosophy" className="hover:text-foreground transition-colors">
                    The Run Streak Philosophy
                  </a>
                </li>
                <li>
                  <a href="/badge-docs" className="hover:text-foreground transition-colors">
                    Embed Your Badge
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    View All Streakers
                  </a>
                </li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">About RunStreak</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/story" className="hover:text-foreground transition-colors">
                    Our Origin Story
                  </a>
                </li>
                <li>
                  <a
                    href="https://bamf.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Built by BAMF
                  </a>
                </li>
                <li>
                  <a
                    href="https://bamf.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    BAMF AI Platform
                  </a>
                </li>
              </ul>
            </div>

            {/* Partner With Us */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Partner With Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => setIsAdvertiseModalOpen(true)}
                    className="hover:text-foreground transition-colors text-left"
                  >
                    Advertise
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} RunStreak. Built by{" "}
              <a
                href="https://bamf.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                BAMF
              </a>
              .
            </p>
          </div>
        </div>
      </footer>

      {/* Advertise Modal */}
      <AdvertiseModal 
        open={isAdvertiseModalOpen} 
        onOpenChange={setIsAdvertiseModalOpen}
      />
    </>
  );
}
