import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

export function ReferralModal({ isOpen, onClose, referralCode }: ReferralModalProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://runstreaks.io/?ref=${referralCode}`;

  useEffect(() => {
    // Store referral code in localStorage when modal opens with code
    if (referralCode && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      
      if (refParam) {
        localStorage.setItem('referralCode', refParam);
        console.log('Stored referral code:', refParam);
      }
    }
  }, [referralCode]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share RunStreaks</DialogTitle>
          <DialogDescription>
            Invite your running friends and win prizes!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-md bg-muted font-mono text-sm break-all">
              {referralLink}
            </div>
            <Button onClick={copyReferralLink} size="icon" variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Your referral code: <span className="font-mono font-semibold">{referralCode}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
