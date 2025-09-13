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
    const { message, documentId, sessionId, userId } = await req.json();

    console.log('Chat request:', { documentId, sessionId, userId });

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Get or create chat session
    let chatSessionId = sessionId;
    if (!chatSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          document_id: documentId,
          title: `Chat about ${document.title}`
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      chatSessionId = newSession.id;
    }

    // Get recent chat history
    const { data: chatHistory, error: historyError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', chatSessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (historyError) {
      console.error('Error fetching chat history:', historyError);
    }

    // Save user message
    await supabase
      .from('chat_messages')
      .insert({
        session_id: chatSessionId,
        role: 'user',
        content: message
      });

    // Prepare context for AI
    const documentContext = `
Document Title: ${document.title}
Document Summary: ${document.simplified_summary || 'Not yet processed'}
Key Points: ${document.key_points ? JSON.stringify(document.key_points) : 'None'}
Legal Terms: ${document.legal_terms ? JSON.stringify(document.legal_terms) : 'None'}
Warnings: ${document.warnings ? JSON.stringify(document.warnings) : 'None'}
Original Text Preview: ${document.original_text ? document.original_text.substring(0, 2000) : 'Not available'}
`;

    // Prepare chat messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are a helpful legal assistant that helps users understand their legal documents. You have access to the following document:

${documentContext}

Your role is to:
1. Answer questions about this specific document
2. Explain legal terms in simple language
3. Highlight important clauses and their implications
4. Provide guidance on next steps or actions needed
5. Always remind users that this is informational and they should consult a lawyer for official legal advice

Be conversational, helpful, and always reference the specific document when answering questions.`
      }
    ];

    // Add chat history
    if (chatHistory) {
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Get AI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to get AI response');
    }

    const aiResponse = await response.json();
    const aiMessage = aiResponse.choices[0].message.content;

    // Save AI response
    const { data: savedMessage, error: saveError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: chatSessionId,
        role: 'assistant',
        content: aiMessage
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving AI message:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: aiMessage,
        sessionId: chatSessionId,
        messageId: savedMessage?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat:', error);
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