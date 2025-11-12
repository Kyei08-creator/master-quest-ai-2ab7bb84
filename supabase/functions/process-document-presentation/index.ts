import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    
    if (!submissionId) {
      throw new Error('Submission ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing document submission:', submissionId);

    // Get the document submission
    const { data: submission, error: submissionError } = await supabase
      .from('document_submissions')
      .select('*, modules(topic)')
      .eq('id', submissionId)
      .single();

    if (submissionError) throw submissionError;
    if (!submission) throw new Error('Submission not found');

    console.log('Found submission:', submission.file_name);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('assessment-submissions')
      .download(submission.file_path);

    if (downloadError) throw downloadError;

    // Read file content as text
    const fileText = await fileData.text();
    
    console.log('File content length:', fileText.length);

    // Generate presentation using Lovable AI
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
            content: 'You are an expert at creating educational presentations. Generate clear, concise slides from the provided document content.'
          },
          {
            role: 'user',
            content: `Create a presentation with 8-12 slides based on this document content. Each slide should have a clear title and concise bullet points or content. Topic: ${submission.modules?.topic}\n\nDocument content:\n${fileText.slice(0, 50000)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_presentation',
              description: 'Generate a structured presentation with slides',
              parameters: {
                type: 'object',
                properties: {
                  slides: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Slide title' },
                        content: { type: 'string', description: 'Slide content with key points' }
                      },
                      required: ['title', 'content']
                    }
                  }
                },
                required: ['slides']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_presentation' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const presentationData = JSON.parse(toolCall.function.arguments);
    const slides = presentationData.slides || [];

    console.log('Generated slides:', slides.length);

    // Create presentation record
    const { data: presentation, error: presentationError } = await supabase
      .from('presentations')
      .insert({
        module_id: submission.module_id,
        title: `${submission.modules?.topic || 'Document'} Presentation`,
        created_by: submission.user_id
      })
      .select()
      .single();

    if (presentationError) throw presentationError;

    // Insert slides
    for (let i = 0; i < slides.length; i++) {
      const { error: slideError } = await supabase
        .from('presentation_slides')
        .insert({
          presentation_id: presentation.id,
          slide_order: i,
          title: slides[i].title,
          content: slides[i].content
        });

      if (slideError) {
        console.error('Error inserting slide:', slideError);
      }
    }

    // Update submission status
    await supabase
      .from('document_submissions')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', submissionId);

    console.log('Presentation created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        presentationId: presentation.id,
        slideCount: slides.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});