import { Activity } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";

const Features = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: Activity,
      title: "Streak Tracking",
      description: "Monitor your current streak and track your consistency. Visual heatmaps show your daily running activity at a glance, celebrating every single run that keeps your streak alive."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Features - RunStreaks | Personal Streak Tracking</title>
        <meta name="description" content="Track your personal running streak with RunStreaks. Monitor your consistency with visual heatmaps and stay accountable to your daily running goals." />
        <meta property="og:title" content="RunStreaks Features - Personal Streak Tracking" />
        <meta property="og:description" content="Track your running streak with visual heatmaps and stay accountable to your daily running goals." />
        <meta property="og:url" content="https://runstreaks.io/features" />
        <meta name="twitter:title" content="RunStreaks Features" />
        <meta name="twitter:description" content="Personal streak tracking designed to help you build and maintain your running streak." />
        <link rel="canonical" href="https://runstreaks.io/features" />
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

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-instrument font-medium text-center mb-6 tracking-tight">
            Personal Streak Tracking
          </h1>
          <p className="text-base sm:text-lg text-foreground/90 text-center leading-relaxed">
            Track your running streak with visual consistency tracking to help you stay motivated and build lasting habits.
          </p>
        </div>

        <div className="grid grid-cols-1 max-w-md mx-auto gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover-lift">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary-glow/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Features;
