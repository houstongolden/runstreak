import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Code, Palette, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/Footer";

const BadgeDocs = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-instrument font-medium mb-2">RunStreak Badges</h1>
          <p className="text-muted-foreground text-lg">
            Showcase your running dedication with embeddable badges
          </p>
        </div>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What are RunStreak Badges?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              RunStreak Badges are dynamic, embeddable images that display your running statistics in real-time. 
              Perfect for GitHub profiles, personal websites, or anywhere you want to show off your running consistency.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">✨ Key Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Auto-updates with your latest stats</li>
                <li>• Multiple themes (Light, Dark, Fire)</li>
                <li>• Choose from 4 different statistics</li>
                <li>• Easy to embed anywhere</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How to Get Your Badge */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              How to Get Your Badge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium mb-1">Connect Your Strava</p>
                  <p className="text-sm text-muted-foreground">
                    First, connect your Strava account to create your RunStreak profile.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium mb-1">Visit Your Profile</p>
                  <p className="text-sm text-muted-foreground">
                    Navigate to your runner profile page from the leaderboard.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium mb-1">Customize Your Badge</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Get Badge" to open the customizer and choose your preferred stat and theme.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium mb-1">Copy & Embed</p>
                  <p className="text-sm text-muted-foreground">
                    Copy the embed code and paste it into your README, website, or blog.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Available Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Available Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold mb-1">Current Streak</h4>
                <p className="text-sm text-muted-foreground">
                  Shows your active daily running streak in days
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold mb-1">Leaderboard Rank</h4>
                <p className="text-sm text-muted-foreground">
                  Displays your current position on the leaderboard
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold mb-1">Total Miles</h4>
                <p className="text-sm text-muted-foreground">
                  Shows total miles accumulated in your streak
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-semibold mb-1">Average Miles/Day</h4>
                <p className="text-sm text-muted-foreground">
                  Displays your daily average distance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Embedding Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Embedding Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">GitHub README</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Add your badge to your GitHub profile README using Markdown:
              </p>
              <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                <code>![RunStreak Badge](badge-url-here)</code>
              </pre>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Personal Website</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Embed in any HTML page using an img tag:
              </p>
              <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                <code>{`<img src="badge-url-here" alt="RunStreak Badge" />`}</code>
              </pre>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Direct Link</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Share the direct image URL anywhere that supports images
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">How often does the badge update?</h4>
              <p className="text-sm text-muted-foreground">
                Badges are cached for 5 minutes and automatically refresh with your latest stats.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-1">Can I customize the colors?</h4>
              <p className="text-sm text-muted-foreground">
                Currently, we offer three preset themes. More customization options coming soon!
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-1">Is it free to use?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! Badges are completely free for all RunStreak users.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-1">What if my streak breaks?</h4>
              <p className="text-sm text-muted-foreground">
                Your badge will automatically reflect your current stats. Keep running to maintain your streak!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link to="/">
            <Button size="lg" className="gap-2">
              Get Started with RunStreak
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BadgeDocs;
