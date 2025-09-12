import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, question, conversationId } = await req.json();

    if (!openRouterApiKey) {
      console.error('OPENROUTER_API_KEY not found');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration not found');
      return new Response(JSON.stringify({ error: 'Database configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing document analysis request:', { documentId, conversationId });

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get document content from database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Error fetching document:', docError);
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get conversation history for context
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('content, role')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10); // Last 10 messages for context

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Build context from conversation history
    const conversationContext = messages?.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n') || '';

    // Prepare the system prompt with document content
    const systemPrompt = `You are an educational AI assistant helping students analyze documents. 

DOCUMENT INFORMATION:
- File Name: ${document.file_name}
- File Type: ${document.file_type}
- Content: ${document.content_text || 'No text content extracted'}

CONVERSATION CONTEXT:
${conversationContext}

Please analyze the document and answer the user's question. Provide detailed, educational responses that help the user understand the content. If the question is not related to the document, politely redirect them to ask about the document content.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Document Analysis Chatbot',
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { role: 'user', content: question }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to get AI response' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    console.log('Document analysis completed successfully');

    return new Response(JSON.stringify({ 
      message: aiMessage,
      documentName: document.file_name 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-document function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});