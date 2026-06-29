"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import type { AIConversation, ChatMessage, UserContextSummary } from "@/types/chat";

// ── Gemini ────────────────────────────────────────────────────────────────────

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenAI({ apiKey });
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return { supabase, user };
}

// ── Conversation CRUD ─────────────────────────────────────────────────────────

export async function getConversations(): Promise<AIConversation[]> {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function createConversation(): Promise<{ id: string } | { error: string }> {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title: "New Conversation" })
      .select("id")
      .single();
    if (error) throw error;
    return { id: data.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create conversation." };
  }
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[] | null> {
  try {
    const { supabase, user } = await requireUser();
    // Verify ownership via conversations table (RLS also enforces this)
    const { data: conv } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!conv) return null;

    const { data, error } = await supabase
      .from("ai_messages")
      .select("id, conversation_id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return null;
  }
}

export async function renameConversation(
  conversationId: string,
  title: string
): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const trimmed = title.trim().slice(0, 80);
    if (!trimmed) return { error: "Title cannot be empty." };
    const { error } = await supabase
      .from("ai_conversations")
      .update({ title: trimmed })
      .eq("id", conversationId)
      .eq("user_id", user.id);
    if (error) throw error;
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to rename." };
  }
}

export async function deleteConversation(
  conversationId: string
): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);
    if (error) throw error;
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete." };
  }
}

// ── User context summary ──────────────────────────────────────────────────────

export async function getUserContextSummary(): Promise<UserContextSummary | null> {
  try {
    const { supabase, user } = await requireUser();
    const [appsRes, resumesRes] = await Promise.all([
      supabase.from("job_applications").select("status").eq("user_id", user.id),
      supabase.from("resumes").select("display_name, is_default").eq("user_id", user.id),
    ]);
    const apps = appsRes.data ?? [];
    const resumes = resumesRes.data ?? [];

    const statusBreakdown: Record<string, number> = {};
    for (const a of apps) {
      statusBreakdown[a.status] = (statusBreakdown[a.status] ?? 0) + 1;
    }

    const defaultResume =
      resumes.find((r) => r.is_default)?.display_name ??
      resumes[0]?.display_name ??
      null;

    return { appCount: apps.length, statusBreakdown, resumeCount: resumes.length, defaultResume };
  } catch {
    return null;
  }
}

// ── Intent detection ──────────────────────────────────────────────────────────

type Intent =
  | "app_count" | "app_list" | "app_detail" | "resume_detail"
  | "missing_skills" | "interview_prep" | "follow_up" | "general";

function detectIntent(message: string): { intent: Intent; company?: string } {
  if (/(how many|count|total|number of).*(application|job)/i.test(message))
    return { intent: "app_count" };
  if (/compare.*(resume|cv)|(resume|cv).*compare/i.test(message))
    return { intent: "resume_detail" };
  if (/missing skill|skill gap|common skill|lacking/i.test(message))
    return { intent: "missing_skills" };
  if (/(resume|cv).*(tip|review|improve|optimize|better|rate|score)/i.test(message) ||
      /(tip|improve|optimize).*(resume|cv)/i.test(message))
    return { intent: "resume_detail" };
  if (/(interview.*question|prepare.*interview|prep.*interview|interview.*prep|mock interview)/i.test(message)) {
    const m = message.match(/(?:for|at|with)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
    return { intent: "interview_prep", company: m?.[1] };
  }
  if (/follow.?up.*(email|message)|write.*email|email.*follow/i.test(message)) {
    const m = message.match(/(?:for|to|at|from)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
    return { intent: "follow_up", company: m?.[1] };
  }
  if (/(my|which|best).*(resume|cv)|(resume|cv).*(use|best|recommend)/i.test(message))
    return { intent: "resume_detail" };
  if (/(all|my|list|pending|active|waiting|applied|summarize|overview|status|rejected|offer).*(application|job)/i.test(message) ||
      /(application|job).*(list|overview|status|pending|active|summary)/i.test(message) ||
      /which (company|application|job)/i.test(message) ||
      /prioritize/i.test(message))
    return { intent: "app_list" };

  const patterns = [
    /(?:for|at|with|from)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:application|interview|position|job|role)/i,
    /([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:application|interview|position|job|role)/i,
  ];
  for (const p of patterns) {
    const m = message.match(p);
    if (m?.[1]) return { intent: "app_detail", company: m[1] };
  }
  return { intent: "general" };
}

// ── HyrBase context fetching ──────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function fetchHyrBaseContext(
  supabase: SupabaseClient,
  userId: string,
  intent: Intent,
  company?: string
): Promise<string> {
  switch (intent) {
    case "app_count": {
      const { count } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return `User has ${count ?? 0} total job applications.`;
    }
    case "app_list": {
      const { data } = await supabase
        .from("job_applications")
        .select("company_name, position, status, date_applied, salary_amount, salary_currency, salary_rate")
        .eq("user_id", userId)
        .order("date_applied", { ascending: false });
      if (!data?.length) return "No applications found.";
      return `Applications (${data.length}):\n` + data
        .map(a => `- ${a.company_name} | ${a.position} | ${a.status} | ${a.date_applied}${
          a.salary_amount ? ` | ${a.salary_currency ?? "USD"} ${a.salary_amount}/${a.salary_rate ?? "Monthly"}` : ""
        }`)
        .join("\n");
    }
    case "app_detail": {
      if (!company) return "";
      const { data } = await supabase
        .from("job_applications")
        .select("*, resumes(display_name)")
        .eq("user_id", userId)
        .ilike("company_name", `%${company}%`)
        .limit(1)
        .maybeSingle();
      if (!data) return `No application found matching "${company}".`;

      const { data: analysis } = await supabase
        .from("resume_analysis")
        .select("resume_match, ats_score, matching_skills, missing_skills, strengths, weaknesses, suggestions, summary")
        .eq("application_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const resumeRecord = Array.isArray(data.resumes) ? data.resumes[0] : data.resumes;

      let ctx = `Application at ${data.company_name}:
- Position: ${data.position}
- Status: ${data.status}
- Applied: ${data.date_applied}
- Type: ${data.employment_type} | ${data.work_setup}${data.location ? `\n- Location: ${data.location}` : ""}${
        data.salary_amount ? `\n- Salary: ${data.salary_currency ?? "USD"} ${data.salary_amount}/${data.salary_rate}` : ""
      }${data.recruiter_name ? `\n- Recruiter: ${data.recruiter_name}${data.recruiter_email ? ` <${data.recruiter_email}>` : ""}` : ""}${
        resumeRecord?.display_name ? `\n- Resume: ${resumeRecord.display_name}` : ""
      }${data.notes ? `\n- Notes: ${data.notes}` : ""}${
        data.job_description ? `\n\nJob Description (excerpt):\n${data.job_description.substring(0, 600)}` : ""
      }`;

      if (analysis) {
        ctx += `\n\nAI Analysis:
- Resume Match: ${analysis.resume_match}%
- ATS Score: ${analysis.ats_score}%
- Summary: ${analysis.summary}
- Matching Skills: ${analysis.matching_skills?.join(", ")}
- Missing Skills: ${analysis.missing_skills?.join(", ")}
- Strengths: ${analysis.strengths?.join("; ")}
- Weaknesses: ${analysis.weaknesses?.join("; ")}
- Suggestions: ${analysis.suggestions?.join("; ")}`;
      }
      return ctx;
    }
    case "interview_prep": {
      let appData = null;
      if (company) {
        const { data } = await supabase
          .from("job_applications")
          .select("company_name, position, status, job_description, notes")
          .eq("user_id", userId)
          .ilike("company_name", `%${company}%`)
          .limit(1)
          .maybeSingle();
        appData = data;
      }
      if (!appData) {
        const { data } = await supabase
          .from("job_applications")
          .select("company_name, position, status, job_description, notes")
          .eq("user_id", userId)
          .in("status", ["Assessment", "HR Interview", "Technical Interview", "Final Interview"])
          .order("date_applied", { ascending: false })
          .limit(1)
          .maybeSingle();
        appData = data;
      }
      if (!appData) return "No active interview-stage applications found.";
      return `Interview context for ${appData.company_name}:
- Position: ${appData.position}
- Status: ${appData.status}${appData.notes ? `\n- Notes: ${appData.notes}` : ""}${
        appData.job_description ? `\n\nJob Description:\n${appData.job_description.substring(0, 900)}` : ""
      }`;
    }
    case "follow_up": {
      let appData = null;
      if (company) {
        const { data } = await supabase
          .from("job_applications")
          .select("company_name, position, status, date_applied, recruiter_name, recruiter_email, notes")
          .eq("user_id", userId)
          .ilike("company_name", `%${company}%`)
          .limit(1)
          .maybeSingle();
        appData = data;
      }
      if (!appData) {
        const { data } = await supabase
          .from("job_applications")
          .select("company_name, position, status, date_applied, recruiter_name, recruiter_email")
          .eq("user_id", userId)
          .in("status", ["Applied", "Assessment", "HR Interview"])
          .order("date_applied", { ascending: true })
          .limit(1)
          .maybeSingle();
        appData = data;
      }
      if (!appData) return "No suitable application found for a follow-up.";
      return `Follow-up context:
- Company: ${appData.company_name}
- Position: ${appData.position}
- Status: ${appData.status}
- Applied: ${appData.date_applied}${appData.recruiter_name ? `\n- Recruiter: ${appData.recruiter_name}` : ""}${
        appData.recruiter_email ? `\n- Email: ${appData.recruiter_email}` : ""
      }`;
    }
    case "resume_detail": {
      const { data: resumes } = await supabase
        .from("resumes")
        .select("id, display_name, is_default, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!resumes?.length) return "No resumes uploaded.";

      const { data: analyses } = await supabase
        .from("resume_analysis")
        .select("resume_id, ats_score, resume_match, missing_skills, strengths, summary")
        .in("resume_id", resumes.map((r) => r.id))
        .order("created_at", { ascending: false });

      const analysisMap = new Map<string, NonNullable<typeof analyses>[number]>();
      for (const a of analyses ?? []) {
        if (!analysisMap.has(a.resume_id)) analysisMap.set(a.resume_id, a);
      }

      return resumes.map((r) => {
        const a = analysisMap.get(r.id);
        return `Resume: "${r.display_name}"${r.is_default ? " (Default)" : ""}${
          a
            ? `\n  ATS: ${a.ats_score}% | Match: ${a.resume_match}%\n  Summary: ${a.summary ?? "N/A"}\n  Strengths: ${a.strengths?.slice(0, 3).join(", ") ?? "N/A"}\n  Missing: ${a.missing_skills?.slice(0, 5).join(", ") ?? "N/A"}`
            : "\n  No AI analysis yet."
        }`;
      }).join("\n\n");
    }
    case "missing_skills": {
      const { data: apps } = await supabase
        .from("job_applications")
        .select("id, company_name, position")
        .eq("user_id", userId);
      if (!apps?.length) return "No applications found.";

      const { data: allAnalyses } = await supabase
        .from("resume_analysis")
        .select("application_id, missing_skills, ats_score")
        .in("application_id", apps.map((a) => a.id))
        .order("created_at", { ascending: false });

      if (!allAnalyses?.length) return "No AI analyses found yet.";

      const latestPerApp = new Map<string, NonNullable<typeof allAnalyses>[number]>();
      for (const a of allAnalyses) {
        if (!latestPerApp.has(a.application_id)) latestPerApp.set(a.application_id, a);
      }

      const skillCounts = new Map<string, number>();
      for (const analysis of latestPerApp.values()) {
        for (const skill of analysis.missing_skills ?? []) {
          skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
        }
      }

      const sorted = [...skillCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
      const appMap = new Map(apps.map((a) => [a.id, a]));

      return `Missing skills across ${latestPerApp.size} analyzed applications:\n\nTop skills:\n${
        sorted.map(([skill, count]) => `- ${skill} (${count}x)`).join("\n")
      }\n\nPer application:\n${
        [...latestPerApp.entries()].map(([id, a]) => {
          const app = appMap.get(id);
          return `- ${app?.company_name ?? "?"} (${app?.position ?? "?"}): ${a.missing_skills?.join(", ") ?? "none"}`;
        }).join("\n")
      }`;
    }
    default:
      return "";
  }
}

// ── Rolling context constants ─────────────────────────────────────────────────

const CONTEXT_WINDOW = 14;  // most recent messages sent to Gemini
const SUMMARY_INTERVAL = 6; // regenerate summary every N messages past the window

// ── Main send action ──────────────────────────────────────────────────────────

export async function sendMessage(
  message: string,
  conversationId: string | null,
  summary: UserContextSummary | null,
  forceGeneral?: boolean
): Promise<{ content: string; conversationId: string; generatedTitle?: string } | { error: string }> {
  try {
    const { supabase, user } = await requireUser();

    // Create conversation if new
    let convId: string;
    if (!conversationId) {
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, title: "New Conversation" })
        .select("id")
        .single();
      if (error) throw error;
      convId = data.id;
    } else {
      convId = conversationId;
    }

    // Save user message
    const { error: msgError } = await supabase
      .from("ai_messages")
      .insert({ conversation_id: convId, role: "user", content: message });
    if (msgError) throw msgError;

    // Fetch conversation (for existing summary) + all messages in parallel
    const [convRes, allMsgsRes] = await Promise.all([
      supabase
        .from("ai_conversations")
        .select("id, summary")
        .eq("id", convId)
        .single(),
      supabase
        .from("ai_messages")
        .select("role, content, created_at")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true }),
    ]);

    const allMessages = allMsgsRes.data ?? [];
    const totalCount = allMessages.length; // includes the user msg we just saved
    const isFirstMessage = totalCount === 1;
    const convSummary: string | null = convRes.data?.summary ?? null;

    // Rolling context: take last CONTEXT_WINDOW messages, excluding the newest user msg
    const priorMessages = allMessages.slice(0, -1); // everything before the current user msg
    const windowedPrior = priorMessages.slice(-CONTEXT_WINDOW + 1); // keep at most N-1 prior msgs

    // Build system instruction
    const statusLine = summary
      ? `${summary.appCount} applications (${Object.entries(summary.statusBreakdown)
          .map(([k, v]) => `${v} ${k}`).join(", ")}), ${summary.resumeCount} resume${
          summary.resumeCount !== 1 ? "s" : ""
        } uploaded${summary.defaultResume ? `, default: "${summary.defaultResume}"` : ""}`
      : "No applications or resumes yet.";

    const summaryBlock =
      convSummary && totalCount > CONTEXT_WINDOW
        ? `\n\n[Summary of earlier conversation]\n${convSummary}`
        : "";

    const systemInstruction = `You are HyrBase AI, a personal career coach integrated into HyrBase — an AI-powered job application tracker.

You help users navigate their job search: reviewing applications, preparing for interviews, improving resumes, writing emails, negotiating salary, and giving strategic career advice.

Be conversational, warm, and actionable. Use markdown (bullet lists, bold, tables) when it adds clarity. Keep responses focused and practical.

User's snapshot: ${statusLine}${summaryBlock}`;

    // Smart context: detect intent and fetch only relevant HyrBase data
    const { intent, company } = forceGeneral ? { intent: "general" as const, company: undefined } : detectIntent(message);
    const contextData =
      intent !== "general"
        ? await fetchHyrBaseContext(supabase, user.id, intent, company)
        : "";

    // Build Gemini contents array
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> =
      windowedPrior.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const userText = contextData
      ? `[Relevant HyrBase data]\n${contextData}\n\n[Question]\n${message}`
      : message;
    contents.push({ role: "user", parts: [{ text: userText }] });

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.85,
        maxOutputTokens: 1500,
      },
    });

    const aiContent = response.text?.trim() ?? "";
    if (!aiContent) throw new Error("Empty response from AI.");

    // Save AI response + update timestamp in parallel
    const newTotal = totalCount + 1; // +1 for the AI response
    const [, , ] = await Promise.all([
      supabase
        .from("ai_messages")
        .insert({ conversation_id: convId, role: "assistant", content: aiContent }),
      supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId),
    ]);

    let generatedTitle: string | undefined;

    // Post-response background tasks (non-fatal)
    try {
      // 1. Generate title on first message
      if (isFirstMessage) {
        const titleRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: `Give a short title (max 30 chars, no quotes) for a career assistant chat starting with: "${message.substring(0, 200)}". Return only the title.` }] }],
          config: { thinkingConfig: { thinkingBudget: 0 }, temperature: 0.3, maxOutputTokens: 15 },
        });
        const raw = titleRes.text?.trim().replace(/^["']|["']$/g, "") ?? "";
        if (raw) {
          generatedTitle = raw.slice(0, 40);
          await supabase
            .from("ai_conversations")
            .update({ title: generatedTitle })
            .eq("id", convId);
        }
      }

      // 2. Regenerate rolling summary when we exceed the context window
      // Trigger: every SUMMARY_INTERVAL messages past the window
      const pastWindow = newTotal - CONTEXT_WINDOW;
      if (pastWindow > 0 && pastWindow % SUMMARY_INTERVAL === 0) {
        const oldCount = pastWindow;
        const oldMessages = allMessages.slice(0, oldCount); // messages no longer in window
        if (oldMessages.length > 0) {
          const transcript = oldMessages
            .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
            .join("\n\n");
          const summaryRes = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: `Summarize this career coaching conversation in 100-150 words. Focus on key topics discussed, decisions made, and important context for continuing the conversation:\n\n${transcript}` }] }],
            config: { thinkingConfig: { thinkingBudget: 0 }, temperature: 0.3, maxOutputTokens: 200 },
          });
          const newSummary = summaryRes.text?.trim();
          if (newSummary) {
            await supabase
              .from("ai_conversations")
              .update({ summary: newSummary })
              .eq("id", convId);
          }
        }
      }
    } catch {
      // Non-fatal: title/summary failures don't break the chat
    }

    return { content: aiContent, conversationId: convId, generatedTitle };
  } catch (err) {
    console.error("[AI Assistant] sendMessage error:", err);
    return {
      error: err instanceof Error ? err.message : "Something went wrong. Please try again.",
    };
  }
}
