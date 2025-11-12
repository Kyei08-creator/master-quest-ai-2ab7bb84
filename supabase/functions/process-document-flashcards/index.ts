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

    // Generate flashcards using Lovable AI
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
            content: 'You are an expert at creating educational flashcards. Generate clear, focused question-answer pairs from the provided document content.'
          },
          {
            role: 'user',
            content: `Create 15-20 flashcards based on this document content. Each flashcard should have a clear question and a concise answer. Focus on key concepts, definitions, and important facts. Topic: ${submission.modules?.topic}\n\nDocument content:\n${fileText.slice(0, 50000)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_flashcards',
              description: 'Generate a set of educational flashcards',
              parameters: {
                type: 'object',
                properties: {
                  flashcards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string', description: 'The question or prompt' },
                        answer: { type: 'string', description: 'The answer or explanation' }
                      },
                      required: ['question', 'answer']
                    }
                  }
                },
                required: ['flashcards']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_flashcards' } }
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

    const flashcardsData = JSON.parse(toolCall.function.arguments);
    const flashcards = flashcardsData.flashcards || [];

    console.log('Generated flashcards:', flashcards.length);

    // Insert flashcards
    for (const card of flashcards) {
      const { error: cardError } = await supabase
        .from('flashcards')
        .insert({
          module_id: submission.module_id,
          question: card.question,
          answer: card.answer,
          created_by: submission.user_id
        });

      if (cardError) {
        console.error('Error inserting flashcard:', cardError);
      }
    }

    // Update submission status
    await supabase
      .from('document_submissions')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', submissionId);

    console.log('Flashcards created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        flashcardCount: flashcards.length 
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