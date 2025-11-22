import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Footer } from "@/components/Footer";
import { Mail, MessageCircle, FileQuestion, Book, Bug } from "lucide-react";

export default function Support() {
  const navigate = useNavigate();

  const supportOptions = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      action: "Contact us at support@runstreaks.io",
      link: "mailto:support@runstreaks.io"
    },
    {
      icon: FileQuestion,
      title: "FAQ",
      description: "Common questions answered",
      action: "View frequently asked questions",
      link: "/faq"
    },
    {
      icon: Book,
      title: "Documentation",
      description: "Learn how RunStreaks works",
      action: "Read the documentation",
      link: "/philosophy"
    },
    {
      icon: Bug,
      title: "Report a Bug",
      description: "Found an issue? Let us know",
      action: "Email bug reports to support@runstreaks.io",
      link: "mailto:support@runstreaks.io?subject=Bug Report"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Support - RunStreaks | Get Help with Your Running Streak</title>
        <meta name="description" content="Get support for RunStreaks. Contact us for help with your running streak tracking, Strava connection, or any questions about the platform." />
        <meta property="og:title" content="RunStreaks Support - Get Help" />
        <meta property="og:description" content="Contact RunStreaks support for help with streak tracking, Strava integration, and platform questions." />
        <meta property="og:url" content="https://runstreaks.io/support" />
        <meta name="twitter:title" content="RunStreaks Support" />
        <link rel="canonical" href="https://runstreaks.io/support" />
      </Helmet>

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

      {/* Support Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
          <p className="text-lg text-muted-foreground">
            We're here to help you keep your streak alive
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {supportOptions.map((option) => (
            <Card key={option.title} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <option.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {option.link.startsWith('mailto:') ? (
                  <a 
                    href={option.link}
                    className="text-sm text-primary hover:underline"
                  >
                    {option.action}
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate(option.link)}
                    className="w-full"
                  >
                    {option.action}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Common Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How do I connect my Strava account?</h3>
              <p className="text-sm text-muted-foreground">
                Click "Connect with Strava" on the homepage to link your account. You'll need to authorize RunStreaks to access your activity data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What counts as a valid daily run?</h3>
              <p className="text-sm text-muted-foreground">
                You must run at least 1 mile per day to maintain your streak. Activities are synced automatically from your Strava account.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">When does my streak reset?</h3>
              <p className="text-sm text-muted-foreground">
                Your streak resets at midnight in your local timezone. Make sure to complete your daily mile before the countdown reaches zero.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How do I sync my latest activities?</h3>
              <p className="text-sm text-muted-foreground">
                Activities sync automatically via webhook when you complete them in Strava. You can also manually sync from your profile page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
