import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";

interface AssignmentEmptyProps {
  moduleTopic: string;
  generating: boolean;
  onGenerate: () => void;
}

export const AssignmentEmpty = ({ moduleTopic, generating, onGenerate }: AssignmentEmptyProps) => {
  return (
    <Card className="shadow-card-custom animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Module Assignment
            </CardTitle>
            <CardDescription>AI-generated practical tasks for {moduleTopic}</CardDescription>
          </div>
          <Button 
            onClick={onGenerate} 
            disabled={generating}
            className="transition-all duration-200 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? "Generating..." : "Generate Assignment"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">
            No assignment yet. Click "Generate Assignment" to create one.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
