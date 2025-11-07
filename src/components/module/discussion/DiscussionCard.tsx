import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThumbsUp, MessageCircle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DiscussionCardProps {
  discussion: {
    id: string;
    title: string;
    content: string;
    upvotes: number;
    is_resolved: boolean;
    created_at: string;
    profiles: {
      full_name: string | null;
    };
    _count: {
      replies: number;
    };
    user_upvoted: boolean;
  };
  onUpvote: (id: string) => void;
  onClick: () => void;
}

export const DiscussionCard = ({
  discussion,
  onUpvote,
  onClick,
}: DiscussionCardProps) => {
  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <Button
            variant={discussion.user_upvoted ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUpvote(discussion.id);
            }}
            className="flex flex-col h-auto py-2 px-3"
          >
            <ThumbsUp
              className={`w-4 h-4 ${discussion.user_upvoted ? "fill-current" : ""}`}
            />
            <span className="text-xs font-semibold">{discussion.upvotes}</span>
          </Button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{discussion.title}</h3>
              <p className="text-muted-foreground line-clamp-2">
                {discussion.content}
              </p>
            </div>
            {discussion.is_resolved && (
              <Badge
                variant="default"
                className="flex items-center gap-1 bg-success"
              >
                <CheckCircle className="w-3 h-3" />
                Resolved
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{discussion._count.replies} replies</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                {formatDistanceToNow(new Date(discussion.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <span>by {discussion.profiles.full_name || "Anonymous"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
