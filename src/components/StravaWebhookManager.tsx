import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Webhook, Trash2, RefreshCw } from 'lucide-react';

interface Subscription {
  id: number;
  callback_url: string;
  created_at: string;
}

export const StravaWebhookManager = () => {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('strava-subscribe-webhook', {
        body: { action: 'subscribe' },
      });

      if (error) throw error;

      toast.success('Successfully subscribed to Strava webhooks!');
      console.log('Subscription response:', data);
      
      // Refresh the list
      await handleList();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe to webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('strava-subscribe-webhook', {
        body: { action: 'list' },
      });

      if (error) throw error;

      setSubscriptions(data.subscriptions || []);
      console.log('Subscriptions:', data.subscriptions);
    } catch (error) {
      console.error('Error listing subscriptions:', error);
      toast.error('Failed to list subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subscriptionId: number) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('strava-subscribe-webhook', {
        body: { action: 'delete', subscriptionId },
      });

      if (error) throw error;

      toast.success('Successfully deleted webhook subscription');
      
      // Refresh the list
      await handleList();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Strava Webhook Management
        </CardTitle>
        <CardDescription>
          Subscribe to Strava webhooks to receive real-time activity updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Webhook className="h-4 w-4" />
            )}
            Subscribe to Webhooks
          </Button>
          
          <Button
            onClick={handleList}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Subscriptions
          </Button>
        </div>

        {subscriptions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Active Subscriptions</h3>
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">ID: {sub.id}</p>
                  <p className="text-xs text-muted-foreground">{sub.callback_url}</p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(sub.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleDelete(sub.id)}
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-2 border-t pt-4">
          <p className="font-medium">How it works:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Subscribe to Webhooks" to register your endpoint with Strava</li>
            <li>Strava will verify your endpoint (using the GET handler)</li>
            <li>Once subscribed, Strava will send POST events for all athlete activities</li>
            <li>Your app will automatically sync and send AI coach messages on milestones</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
