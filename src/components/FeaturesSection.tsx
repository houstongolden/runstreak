import { Bot, MessageSquare, Users, TrendingUp, Award, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const FeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Running Coach",
      description: "Get personalized AI insights and chat directly with your Strava and running data. Tired of pasting screenshots into ChatGPT? This is your solution—deep analysis of your training, form, recovery, and progress all in one place."
    },
    {
      icon: MessageSquare,
      title: "SMS Accountability",
      description: "Receive daily AI-powered SMS reminders to keep your streak alive. Your personal running coach in your pocket, helping you stay consistent and motivated every single day."
    },
    {
      icon: Users,
      title: "Accountability Partners",
      description: "Connect with other runners to stay motivated and keep your streak going. Share progress, celebrate wins, and push each other to maintain consistency through good days and bad."
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Track your best efforts across all distances. See your progress over time with detailed metrics on pace, distance, elevation, and heart rate data—all synced automatically from Strava."
    },
    {
      icon: Activity,
      title: "Streak Tracking",
      description: "Monitor your current streak, longest streak ever, and days on streak percentage. Visual heatmaps show your consistency at a glance, celebrating every single run that keeps your streak alive."
    },
    {
      icon: Award,
      title: "Social Engagement",
      description: "Give kudos, leave encouraging comments, and build a supportive running community. Share your journey with others who understand the commitment it takes to run every day."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:px-[240px]">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Everything You Need to Run Every Day
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you build and maintain your running streak, stay motivated, and become a better runner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover-lift">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
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
    </section>
  );
};

export default FeaturesSection;
