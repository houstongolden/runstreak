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

type StatType = 'streak' | 'miles' | 'avg' | 'none';
type ThemeType = 'light' | 'dark' | 'fire';

const BadgeCustomizer = () => {
  const { id } = useParams();
  const [runner, setRunner] = useState<Runner | null>(null);
  const [stat1, setStat1] = useState<StatType>('streak');
  const [stat2, setStat2] = useState<StatType>('miles');
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

  const badgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/badge?id=${id}&stat1=${stat1}&stat2=${stat2}&theme=${theme}`;
  
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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link to={`/runner/${id}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-3 sm:mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Customize Your Badge</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Create an embeddable badge to showcase your running streak
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Customization Panel */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Badge Settings</CardTitle>
                <CardDescription className="text-sm">Choose what to display on your badge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Primary Stat */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-semibold">Primary Stat</Label>
                  <RadioGroup value={stat1} onValueChange={(v) => setStat1(v as StatType)}>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="streak" id="stat1-streak" />
                      <Label htmlFor="stat1-streak" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Current Streak</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Show days in your active streak</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="miles" id="stat1-miles" />
                      <Label htmlFor="stat1-miles" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Total Miles</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Show total miles in your streak</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="avg" id="stat1-avg" />
                      <Label htmlFor="stat1-avg" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Average Miles/Day</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Show your daily average</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Secondary Stat */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-semibold">Secondary Stat</Label>
                  <RadioGroup value={stat2} onValueChange={(v) => setStat2(v as StatType)}>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="miles" id="stat2-miles" />
                      <Label htmlFor="stat2-miles" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Total Miles</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Show total miles in your streak</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="avg" id="stat2-avg" />
                      <Label htmlFor="stat2-avg" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Average Miles/Day</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Show your daily average</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="streak" id="stat2-streak" />
                      <Label htmlFor="stat2-streak" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Current Streak</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Show days in your active streak</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="none" id="stat2-none" />
                      <Label htmlFor="stat2-none" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">None (Single Stat)</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Only show primary stat</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Theme Selection */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-semibold">Theme</Label>
                  <RadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemeType)}>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Light</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Clean white background</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Dark</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Dark mode friendly</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="fire" id="fire" />
                      <Label htmlFor="fire" className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm sm:text-base">Fire</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Gradient orange to red</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/badge-docs">
                  <Button variant="outline" className="w-full gap-2 text-sm sm:text-base">
                    <ExternalLink className="h-4 w-4" />
                    View Documentation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Code Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Preview</CardTitle>
                <CardDescription className="text-sm">This is how your badge will look</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-muted/30 rounded-lg min-h-[120px]">
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
                <CardTitle className="text-lg sm:text-xl">Embed Code</CardTitle>
                <CardDescription className="text-sm">Copy and paste into your website or README</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="html" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
                    <TabsTrigger value="html" className="text-xs sm:text-sm">HTML</TabsTrigger>
                    <TabsTrigger value="markdown" className="text-xs sm:text-sm">Markdown</TabsTrigger>
                    <TabsTrigger value="url" className="text-xs sm:text-sm">URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html" className="space-y-3 mt-3 sm:mt-4">
                    <div className="relative">
                      <pre className="p-3 sm:p-4 bg-muted rounded-lg text-xs sm:text-sm overflow-x-auto max-w-full">
                        <code className="break-all">{embedCode.html}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => copyToClipboard(embedCode.html)}
                      >
                        {copied ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="markdown" className="space-y-3 mt-3 sm:mt-4">
                    <div className="relative">
                      <pre className="p-3 sm:p-4 bg-muted rounded-lg text-xs sm:text-sm overflow-x-auto max-w-full">
                        <code className="break-all">{embedCode.markdown}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => copyToClipboard(embedCode.markdown)}
                      >
                        {copied ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-3 mt-3 sm:mt-4">
                    <div className="relative">
                      <pre className="p-3 sm:p-4 bg-muted rounded-lg text-xs sm:text-sm overflow-x-auto max-w-full">
                        <code className="break-all">{embedCode.url}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => copyToClipboard(embedCode.url)}
                      >
                        {copied ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
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
