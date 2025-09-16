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
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

    if (!googleApiKey) {
      throw new Error('Google API key not configured');
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

    // Extract text from document based on file type
    let text = '';
    
    try {
      if (document.file_type === 'pdf') {
        // For PDFs, convert to text - simplified extraction
        const arrayBuffer = await fileData.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
        const rawText = decoder.decode(arrayBuffer);
        
        // Extract readable text between PDF markers (simplified approach)
        const textMatches = rawText.match(/BT\s*(.*?)\s*ET/g);
        if (textMatches && textMatches.length > 0) {
          text = textMatches.join(' ').replace(/BT|ET/g, '').trim();
        } else {
          // Fallback: extract any printable ASCII text
          text = rawText.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
        }
      } else if (document.file_type === 'docx') {
        // For DOCX files, we'd need proper parsing - for now use basic text extraction
        const arrayBuffer = await fileData.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
        const rawText = decoder.decode(arrayBuffer);
        // Extract any readable text and clean it
        text = rawText.replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
      } else {
        // For text files
        text = await fileData.text();
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      text = '';
    }
    
    // Clean the text to remove null bytes and problematic Unicode characters
    text = text.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    
    // If text extraction failed or produced very little content, use a fallback
    if (!text || text.length < 50) {
      text = `Legal document: ${document.original_filename}\nFile type: ${document.file_type}\nSize: ${document.file_size} bytes\n\nThis document contains binary data that requires specialized parsing tools for full text extraction. The document has been uploaded successfully and can be referenced in conversations, though detailed text analysis may be limited.`;
    }
    
    console.log('Extracted text length:', text.length);

    // Use Gemini API to create summary
    const prompt = `You are a legal document expert. Your job is to:
1. Extract the main content from legal documents
2. Create a simplified summary in plain English
3. Identify key legal terms and explain them
4. Highlight important clauses, rights, and obligations

Format your response as JSON with these fields:
- summary: A clear, simplified explanation of the document in plain English
- keyPoints: Array of the most important points
- legalTerms: Array of legal terms with simple explanations
- warnings: Array of important warnings or things to watch out for

Please analyze this legal document and provide a simplified summary:

${text.substring(0, 50000)}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error('Failed to process document with AI');
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.candidates[0].content.parts[0].text;
    let analysisResult;

    try {
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : aiContent;
      analysisResult = JSON.parse(jsonText);
    } catch {
      // Fallback if AI doesn't return valid JSON
      analysisResult = {
        summary: aiContent,
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