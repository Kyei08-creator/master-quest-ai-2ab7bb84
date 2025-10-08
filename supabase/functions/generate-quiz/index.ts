import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { topic, quizType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not set');
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    console.log('Generating quiz for topic:', topic, 'type:', quizType);

    let prompt = '';
    
    if (quizType === 'final_test') {
      prompt = `Generate a comprehensive final test for the topic "${topic}" with a total of 50 marks. 
      
Structure the test based on international assessment standards (IGCSE/A-Level format):

**Section A: Multiple Choice Questions (10 marks)**
- Generate 10 MCQ questions
- 1 mark each
- Mix of theoretical and practical questions

**Section B: True/False (5 marks)**
- Generate 5 True/False questions
- 1 mark each
- Test key concepts and misconceptions

**Section C: Short Answer Questions (15 marks)**
- Generate 5 short answer questions
- 3 marks each
- Require brief explanations or definitions

**Section D: Case Study/Comprehension (10 marks)**
- Generate 2 case study questions based on practical scenarios
- 5 marks each
- Test application of knowledge

**Section E: Extended Response/Essay (10 marks)**
- Generate 1 essay question
- 10 marks
- Requires detailed analysis and critical thinking

Also generate AI metrics for this final test:
- Practicality/Theoretical split (e.g., "60% Theoretical / 40% Practical")
- Predictability rating (e.g., "Moderately Predictable")
- Difficulty level (e.g., "Intermediate Graduate Level")
- Alignment percentage (e.g., "100% Aligned with designated resources")
- Estimated learning time (e.g., "45-60 minutes")
- Proficiency required (e.g., "Deep understanding of ${topic}")

Return as JSON:
{
  "questions": [
    {
      "question": "question text",
      "type": "mcq" | "true_false" | "short_answer" | "case_study" | "essay",
      "options": ["Option A", "Option B", "Option C", "Option D"] (only for mcq and true_false),
      "correctAnswer": 0 (for mcq/true_false) or "sample answer" (for written questions),
      "marks": number of marks for this question,
      "sectionTitle": "Section A: Multiple Choice Questions" (include section title)
    }
  ],
  "metrics": {
    "practicalityTheoretical": "percentage split",
    "predictability": "rating",
    "difficulty": "level description",
    "alignment": "percentage aligned",
    "learningTime": "time estimate",
    "proficiency": "required level"
  }
}`;
    } else {
      prompt = `Generate 25 high-quality multiple choice questions about "${topic}". 
      
Focus on quality over quantity. Mix theoretical and practical questions.

Also generate AI metrics for this quiz:
- Practicality/Theoretical split (e.g., "60% Theoretical / 40% Practical")
- Predictability rating (e.g., "Highly Predictable", "Moderately Predictable")
- Difficulty level (e.g., "Intermediate Graduate Level")
- Alignment percentage (e.g., "100% Aligned with designated resources")
- Estimated learning time (e.g., "5-10 minutes per attempt")
- Proficiency required (e.g., "Basic understanding of concepts")

Return as JSON:
{
  "questions": [
    {
      "question": "detailed question text",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "marks": 1
    }
  ],
  "metrics": {
    "practicalityTheoretical": "percentage split",
    "predictability": "rating",
    "difficulty": "level description",
    "alignment": "percentage aligned",
    "learningTime": "time estimate",
    "proficiency": "required level"
  }
}`;
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: prompt
        }],
        tools: [{ googleSearch: {} }],
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      console.error('AI API Error:', aiResponse.status, errorData);
      throw new Error(errorData.error?.message || `AI API returned ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));
    
    let quiz: any;
    try {
      const raw = data?.choices?.[0]?.message?.content ?? '';
      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      try {
        quiz = JSON.parse(cleaned);
      } catch {
        const candidates: string[] = [];
        const objStart = cleaned.indexOf('{');
        const objEnd = cleaned.lastIndexOf('}');
        const arrStart = cleaned.indexOf('[');
        const arrEnd = cleaned.lastIndexOf(']');
        if (objStart !== -1 && objEnd > objStart) candidates.push(cleaned.slice(objStart, objEnd + 1));
        if (arrStart !== -1 && arrEnd > arrStart) candidates.push(cleaned.slice(arrStart, arrEnd + 1));

        let ok = false;
        for (const c of candidates) { try { quiz = JSON.parse(c); ok = true; break; } catch {} }
        if (!ok) throw new Error('parse_failed');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', data?.choices?.[0]?.message?.content);
      throw new Error('Invalid AI response format');
    }

    return new Response(JSON.stringify(quiz), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
