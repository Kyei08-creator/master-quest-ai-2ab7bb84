import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Users } from "lucide-react";

interface ShareModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleTopic: string;
}

export const ShareModuleDialog = ({ open, onOpenChange, moduleId, moduleTopic }: ShareModuleDialogProps) => {
  const [shareLink, setShareLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (open) {
      loadOrCreateShareLink();
      loadMemberCount();
    }
  }, [open, moduleId]);

  const loadMemberCount = async () => {
    const { count } = await supabase
      .from('module_members')
      .select('*', { count: 'exact', head: true })
      .eq('module_id', moduleId);
    
    setMemberCount(count || 0);
  };

  const loadOrCreateShareLink = async () => {
    setLoading(true);
    try {
      // Check if share already exists
      const { data: existingShare } = await supabase
        .from('module_shares')
        .select('share_token')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .maybeSingle();

      if (existingShare) {
        setShareLink(`${window.location.origin}/module/${moduleId}?share=${existingShare.share_token}`);
      } else {
        // Create new share
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data: newShare, error } = await supabase
          .from('module_shares')
          .insert({
            module_id: moduleId,
            created_by: user.user.id
          })
          .select('share_token')
          .single();

        if (error) throw error;

        setShareLink(`${window.location.origin}/module/${moduleId}?share=${newShare.share_token}`);
      }
    } catch (error) {
      console.error('Error loading share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Share link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{moduleTopic}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'} joined</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Anyone with this link can join and collaborate on this module. They can:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
              <li>View all resources and content</li>
              <li>Participate in discussions</li>
              <li>Complete assignments and quizzes</li>
              <li>Track their own progress privately</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Input
              value={shareLink}
              readOnly
              className="flex-1"
              placeholder="Generating link..."
            />
            <Button
              onClick={copyToClipboard}
              disabled={loading || !shareLink}
              size="icon"
              variant="outline"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            💡 Tip: Share this link via Discord, Slack, or any messaging platform
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
