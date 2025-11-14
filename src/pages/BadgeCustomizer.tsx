import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Runner } from "@/types";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type StatType = 'streak' | 'rank' | 'miles' | 'avg';
type ThemeType = 'light' | 'dark' | 'fire';

const BadgeCustomizer = () => {
  const { id } = useParams();
  const [runner, setRunner] = useState<Runner | null>(null);
  const [stat, setStat] = useState<StatType>('streak');
  const [theme, setTheme] = useState<ThemeType>('light');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRunner = async () => {
      if (!id) return;

      const { data, error } = await (supabase as any)
        .from("runners")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching runner:", error);
        return;
      }

      setRunner(data as Runner);
    };

    fetchRunner();
  }, [id]);

  const badgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/badge?id=${id}&stat=${stat}&theme=${theme}`;
  
  const embedCode = {
    html: `<img src="${badgeUrl}" alt="RunStreak Badge" />`,
    markdown: `![RunStreak Badge](${badgeUrl})`,
    url: badgeUrl,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Badge code copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!runner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/runner/${id}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Customize Your Badge</h1>
          <p className="text-muted-foreground text-lg">
            Create an embeddable badge to showcase your running streak
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Customization Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Badge Settings</CardTitle>
                <CardDescription>Choose what to display on your badge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stat Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Statistic</Label>
                  <RadioGroup value={stat} onValueChange={(v) => setStat(v as StatType)}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="streak" id="streak" />
                      <Label htmlFor="streak" className="flex-1 cursor-pointer">
                        <div className="font-medium">Current Streak</div>
                        <div className="text-sm text-muted-foreground">Show days in your active streak</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="rank" id="rank" />
                      <Label htmlFor="rank" className="flex-1 cursor-pointer">
                        <div className="font-medium">Leaderboard Rank</div>
                        <div className="text-sm text-muted-foreground">Show your position on the leaderboard</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="miles" id="miles" />
                      <Label htmlFor="miles" className="flex-1 cursor-pointer">
                        <div className="font-medium">Total Miles</div>
                        <div className="text-sm text-muted-foreground">Show total miles in your streak</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="avg" id="avg" />
                      <Label htmlFor="avg" className="flex-1 cursor-pointer">
                        <div className="font-medium">Average Miles/Day</div>
                        <div className="text-sm text-muted-foreground">Show your daily average</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Theme</Label>
                  <RadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemeType)}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex-1 cursor-pointer">
                        <div className="font-medium">Light</div>
                        <div className="text-sm text-muted-foreground">Clean white background</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex-1 cursor-pointer">
                        <div className="font-medium">Dark</div>
                        <div className="text-sm text-muted-foreground">Dark mode friendly</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="fire" id="fire" />
                      <Label htmlFor="fire" className="flex-1 cursor-pointer">
                        <div className="font-medium">Fire</div>
                        <div className="text-sm text-muted-foreground">Gradient orange to red</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/badge-docs">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Documentation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Code Panel */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>This is how your badge will look</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-8 bg-muted/30 rounded-lg">
                <img 
                  src={badgeUrl} 
                  alt="Badge Preview" 
                  className="max-w-full h-auto shadow-lg rounded-lg"
                />
              </CardContent>
            </Card>

            {/* Embed Code */}
            <Card>
              <CardHeader>
                <CardTitle>Embed Code</CardTitle>
                <CardDescription>Copy and paste into your website or README</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="html" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html" className="space-y-3">
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                        <code>{embedCode.html}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(embedCode.html)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="markdown" className="space-y-3">
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                        <code>{embedCode.markdown}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(embedCode.markdown)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-3">
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                        <code className="break-all">{embedCode.url}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(embedCode.url)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeCustomizer;
