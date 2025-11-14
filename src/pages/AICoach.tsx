import { useParams } from "react-router-dom";
import AICoachChat from "@/components/AICoachChat";
import { Card, CardContent } from "@/components/ui/card";

export default function AICoach() {
  const { runnerId } = useParams<{ runnerId: string }>();

  if (!runnerId) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No runner ID provided. Please access this page from your profile.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <AICoachChat runnerId={runnerId} />
    </div>
  );
}
