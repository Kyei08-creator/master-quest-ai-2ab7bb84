import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface DocumentUploadProps {
  moduleId: string;
  assessmentType: 'assignment' | 'quiz' | 'final_test';
  onUploadComplete?: () => void;
}

export const DocumentUpload = ({ moduleId, assessmentType, onUploadComplete }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submission, setSubmission] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or TXT files');
      return;
    }

    setFile(selectedFile);
  };

  const estimateWordCount = (fileSize: number): number => {
    // Rough estimate: 1 page ≈ 500 words ≈ 3KB
    return Math.floor((fileSize / 3000) * 500);
  };

  const estimatePageCount = (fileSize: number): number => {
    // Rough estimate: 1 page ≈ 3KB
    return Math.ceil(fileSize / 3000);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const wordCount = estimateWordCount(file.size);
      const pageCount = estimatePageCount(file.size);

      // Check limits
      if (pageCount > 10) {
        toast.error('Document exceeds 10 page limit');
        setUploading(false);
        return;
      }

      if (wordCount > 7000) {
        toast.error('Document exceeds 7000 word limit');
        setUploading(false);
        return;
      }

      // Upload file to storage
      const filePath = `${user.id}/${moduleId}/${assessmentType}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assessment-submissions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create submission record
      const { data: submissionData, error: insertError } = await supabase
        .from('document_submissions')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          assessment_type: assessmentType,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          page_count: pageCount,
          word_count: wordCount,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSubmission(submissionData);
      toast.success('Document uploaded successfully! AI grading in progress...');

      // Trigger AI grading
      const { error: gradeError } = await supabase.functions.invoke('grade-document', {
        body: { submissionId: submissionData.id }
      });

      if (gradeError) {
        console.error('Grading error:', gradeError);
        toast.error('Document uploaded but grading failed. Please contact support.');
      } else {
        toast.success('Document graded successfully!');
        onUploadComplete?.();
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (submission) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {submission.status === 'graded' && <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />}
          {submission.status === 'processing' && <Loader2 className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1 animate-spin" />}
          {submission.status === 'error' && <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />}
          
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Submission Status</h3>
            <p className="text-sm text-muted-foreground mb-4">
              File: {submission.file_name}
            </p>
            
            {submission.status === 'graded' && (
              <div className="space-y-2">
                <Alert>
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      Score: {submission.score}/{submission.total_marks}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {submission.ai_feedback}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {submission.status === 'processing' && (
              <Alert>
                <AlertDescription>
                  AI is currently grading your submission. This may take a few moments...
                </AlertDescription>
              </Alert>
            )}
            
            {submission.status === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>
                  An error occurred during grading. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Submit Your Assessment</h3>
          <p className="text-sm text-muted-foreground">
            Upload your completed assessment document. Maximum 10 pages, 7000 words.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Accepted formats: PDF, DOC, DOCX, TXT (Max 10MB)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            disabled={uploading}
            className="flex-1"
          />
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          )}
        </div>

        {file && (
          <Alert>
            <AlertDescription className="text-sm">
              Estimated: {estimatePageCount(file.size)} pages, {estimateWordCount(file.size)} words
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading & Grading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Submit Document for AI Grading
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};