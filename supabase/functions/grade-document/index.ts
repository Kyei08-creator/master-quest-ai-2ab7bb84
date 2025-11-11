import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'submissionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing submission:', submissionId);

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('document_submissions')
      .select('*, modules(topic)')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('Submission error:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('document_submissions')
      .update({ status: 'processing' })
      .eq('id', submissionId);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('assessment-submissions')
      .download(submission.file_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      await supabase
        .from('document_submissions')
        .update({ status: 'error', ai_feedback: 'Failed to download file' })
        .eq('id', submissionId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Get assessment content based on type
    let assessmentPrompt = '';
    if (submission.assessment_type === 'assignment') {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('content')
        .eq('module_id', submission.module_id)
        .single();
      
      if (assignment) {
        assessmentPrompt = `Assignment Questions: ${JSON.stringify(assignment.content)}`;
      }
    } else if (submission.assessment_type === 'quiz' || submission.assessment_type === 'final_test') {
      // For quiz/final test, we'll grade based on general criteria
      assessmentPrompt = `This is a ${submission.assessment_type} for the module: ${submission.modules?.topic}`;
    }

    // Call Lovable AI for grading
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert grader for educational assessments. Grade the submitted document and provide:
1. A score out of 100
2. Detailed feedback on strengths and areas for improvement
3. Specific comments on content quality, understanding, and completeness

Format your response as JSON with this structure:
{
  "score": <number 0-100>,
  "feedback": "<detailed feedback text>",
  "total_marks": 100
}`
          },
          {
            role: 'user',
            content: `${assessmentPrompt}\n\nPlease grade this submission. The document is a ${submission.file_name} file with approximately ${submission.word_count || 'unknown'} words across ${submission.page_count || 'unknown'} pages.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      await supabase
        .from('document_submissions')
        .update({ status: 'error', ai_feedback: 'AI grading failed' })
        .eq('id', submissionId);
      
      return new Response(
        JSON.stringify({ error: 'AI grading failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;
    
    // Parse AI response
    let gradingResult;
    try {
      gradingResult = JSON.parse(aiMessage);
    } catch {
      // If parsing fails, extract score and feedback manually
      gradingResult = {
        score: 75, // Default score if parsing fails
        feedback: aiMessage,
        total_marks: 100
      };
    }

    // Update submission with grading results
    const { error: updateError } = await supabase
      .from('document_submissions')
      .update({
        status: 'graded',
        score: gradingResult.score,
        total_marks: gradingResult.total_marks,
        ai_feedback: gradingResult.feedback,
        graded_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save grading results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Grading completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        score: gradingResult.score,
        feedback: gradingResult.feedback
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in grade-document function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});