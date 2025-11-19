import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2, Flame } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AdPaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTestMode = searchParams.get("test") === "true";
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    domain: "",
    description: "",
    logoUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.domain || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Call edge function to create ad spot
      const { data, error } = await supabase.functions.invoke('create-ad-spot', {
        body: {
          companyName: formData.companyName,
          domain: formData.domain,
          description: formData.description,
          logoUrl: formData.logoUrl || null,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Failed to create ad spot');

      toast.success("Ad spot created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error creating ad spot:", error);
      toast.error("Failed to create ad spot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[100px]">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Logo Header */}
        <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <Flame className="h-6 w-6 text-primary" />
          <span className="text-xl font-instrument font-medium">RunStreaks</span>
        </Link>
        
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">
              {isTestMode ? "Test Mode - Skip to Ad Setup" : "Payment Successful!"}
            </CardTitle>
            <CardDescription>
              {isTestMode 
                ? "Fill in your ad details to create a test spot" 
                : "Thank you for your purchase. Now let's set up your ad spot."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyName">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Nike"
                  required
                />
              </div>

              <div>
                <Label htmlFor="domain">
                  Website Domain <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="nike.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Where should the ad link to? (without https://)
                </p>
              </div>

              <div>
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Premium running shoes and athletic wear for serious athletes"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Brief description of your product or service
                </p>
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to use Clearbit logo API
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating ad spot...
                  </>
                ) : (
                  "Activate my ad spot"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
