import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl mx-auto space-y-8 animate-fade-in">
        {/* Funny runner gif */}
        <div className="w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border/50 shadow-lg">
          <img
            src="https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif"
            alt="Runner falling"
            className="w-full h-auto"
          />
        </div>

        {/* 404 Header */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        </div>

        {/* Motivational message */}
        <div className="space-y-4 px-4">
          <p className="text-lg font-medium text-foreground">
            The road ends here, but the run never ends.
          </p>
          <p className="text-base text-muted-foreground">
            Don't let this roadblock stop you. Go home and keep running!
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => navigate("/")}
          size="lg"
          className="gap-2 animate-scale-in"
        >
          <Home className="h-4 w-4" />
          Back to Leaderboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
