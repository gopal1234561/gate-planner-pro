import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subjects, completedTopics, dailyHours, targetYear, missedDays, userPrompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert GATE exam study planner. Create detailed, actionable study plans for GATE ${targetYear} preparation.

Rules:
- Generate a weekly study plan (7 days) with specific topics and time allocations
- Each day should have ${dailyHours} hours of study time
- Prioritize subjects that need more revision
- Include breaks and revision slots
- If missed days are provided, redistribute those topics across remaining days
- Return a JSON object with this structure:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "sessions": [
        { "subject": "...", "topic": "...", "duration_hours": 1.5, "type": "new|revision|practice", "priority": "high|medium|low" }
      ],
      "totalHours": 6
    }
  ],
  "dailySuggestions": [
    { "title": "...", "reason": "...", "priority": "high|medium|low", "estimatedMinutes": 45 }
  ],
  "tips": ["tip1", "tip2"]
}`;

    const finalPrompt = `Create a study plan with these details:
- Subjects: ${JSON.stringify(subjects)}
- Already completed topics: ${JSON.stringify(completedTopics)}
- Available hours per day: ${dailyHours}
- Target: GATE ${targetYear}
${missedDays ? `- Missed days to reschedule: ${JSON.stringify(missedDays)}. IMPORTANT: Redistribute the topics from these missed days across the remaining days of the week.` : ''}
${userPrompt ? `- Additional instructions from student: ${userPrompt}` : ''}

Generate the weekly plan starting from today and provide 3-5 daily suggestions for what to focus on today.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: finalPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_study_plan",
              description: "Generate a structured weekly study plan with daily suggestions",
              parameters: {
                type: "object",
                properties: {
                  weeklyPlan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        sessions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              subject: { type: "string" },
                              topic: { type: "string" },
                              duration_hours: { type: "number" },
                              type: { type: "string", enum: ["new", "revision", "practice"] },
                              priority: { type: "string", enum: ["high", "medium", "low"] },
                            },
                            required: ["subject", "topic", "duration_hours", "type", "priority"],
                          },
                        },
                        totalHours: { type: "number" },
                      },
                      required: ["day", "sessions", "totalHours"],
                    },
                  },
                  dailySuggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        reason: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        estimatedMinutes: { type: "number" },
                      },
                      required: ["title", "reason", "priority", "estimatedMinutes"],
                    },
                  },
                  tips: { type: "array", items: { type: "string" } },
                },
                required: ["weeklyPlan", "dailySuggestions", "tips"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_study_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let plan;
    if (toolCall) {
      plan = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content || "{}";
      plan = JSON.parse(content);
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("study planner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
