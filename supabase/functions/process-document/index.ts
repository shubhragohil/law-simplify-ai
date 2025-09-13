import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { documentId } = await req.json();

    console.log('Processing document:', documentId);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError) {
      throw new Error('Failed to download document');
    }

    // Extract text from document (simplified - in real app you'd use proper document parsing)
    const text = await fileData.text();
    console.log('Extracted text length:', text.length);

    // Use OpenAI to create summary
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a legal document expert. Your job is to:
1. Extract the main content from legal documents
2. Create a simplified summary in plain English
3. Identify key legal terms and explain them
4. Highlight important clauses, rights, and obligations

Format your response as JSON with these fields:
- summary: A clear, simplified explanation of the document in plain English
- keyPoints: Array of the most important points
- legalTerms: Array of legal terms with simple explanations
- warnings: Array of important warnings or things to watch out for`
          },
          {
            role: 'user',
            content: `Please analyze this legal document and provide a simplified summary:\n\n${text.substring(0, 8000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to process document with AI');
    }

    const aiResponse = await response.json();
    let analysisResult;

    try {
      analysisResult = JSON.parse(aiResponse.choices[0].message.content);
    } catch {
      // Fallback if AI doesn't return valid JSON
      analysisResult = {
        summary: aiResponse.choices[0].message.content,
        keyPoints: ['Please review the document for important details'],
        legalTerms: [],
        warnings: ['Please consult with a legal professional for official advice']
      };
    }

    // Update document with AI analysis
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        original_text: text.substring(0, 10000), // Store first 10k chars
        simplified_summary: analysisResult.summary,
        key_points: analysisResult.keyPoints,
        legal_terms: analysisResult.legalTerms,
        warnings: analysisResult.warnings
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }

    console.log('Document processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Document processed successfully',
        analysis: analysisResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});