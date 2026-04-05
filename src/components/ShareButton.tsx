import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  appName: string;
  appId: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ appName, appId }) => {
  const shareUrl = `${window.location.origin}/app/${appId}`;
  const shareText = `Check out "${appName}" on bs Store!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: appName, text: shareText, url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleShare} className="shrink-0">
      <Share2 className="h-5 w-5" />
    </Button>
  );
};

export default ShareButton;
