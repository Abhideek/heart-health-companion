import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, role = "patient", chatHistory = [] } = await req.json();
    console.log(`Chat request - role: ${role}, message: ${message?.substring(0, 50)}...`);

    if (!message) {
      return new Response(
        JSON.stringify({ reply: "Please type a message." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ reply: "AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Dynamic system prompt based on user role
    let systemContent = `You are CardioCare, an AI heart health assistant. You provide accurate, helpful information about cardiovascular health, diet recommendations, and general wellness advice.

IMPORTANT GUIDELINES:
- Always recommend consulting with healthcare professionals for medical decisions
- Provide evidence-based information when discussing health topics
- Be empathetic and supportive in your responses
- When discussing diet plans, focus on heart-healthy options like DASH or Mediterranean diets
- Never diagnose conditions or prescribe medications`;

    if (role === "doctor") {
      systemContent += `

DOCTOR MODE:
- You are assisting a medical professional
- Use appropriate medical terminology
- Be concise and clinical in your responses
- Focus on clinical data interpretation, risk factors, and treatment considerations
- Reference current clinical guidelines when appropriate`;
    } else {
      systemContent += `

PATIENT MODE:
- You are assisting a patient
- Explain medical concepts in simple, easy-to-understand terms
- Be encouraging and supportive
- Emphasize the importance of following their doctor's advice
- Suggest lifestyle modifications and healthy habits
- Do not provide definitive diagnoses - always recommend consulting their healthcare provider`;
    }

    // Build messages array with history
    const messages = [
      { role: "system", content: systemContent },
      ...chatHistory.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    console.log(`Calling AI gateway with ${messages.length} messages`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ reply: "The AI service is currently busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ reply: "AI service credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ reply: "I'm having trouble connecting to my knowledge base. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    console.log(`AI response received: ${reply.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ reply: "I'm unable to connect to the AI service right now. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
