import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const { role, difficulty, type, messages } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API Key is not configured. Please add GROQ_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No interview transcript available to evaluate.' },
        { status: 400 }
      );
    }

    // Format transcript for readability by the evaluator
    const transcriptText = messages
      .map((m: any) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
      .join('\n\n');

    const systemPrompt = `You are an expert interview evaluator. You will receive a full interview transcript. Evaluate the candidate strictly and fairly.
Candidate Role: ${role}
Difficulty Level: ${difficulty}
Interview Type: ${type}

Return ONLY a valid JSON object. No markdown, no explanation, no preamble, no code fences.

{
  "score": <number 0–100>,
  "breakdown": {
    "technical_depth": <number 0–20>,
    "communication": <number 0–20>,
    "problem_solving": <number 0–20>,
    "confidence": <number 0–20>,
    "relevance": <number 0–20>
  },
  "strengths": ["<string>", "<string>", "<string>"],
  "improvements": ["<string>", "<string>", "<string>"],
  "watch_out_for": ["<string>", "<string>", "<string>"]
}

Scoring guide:
- technical_depth: Real knowledge vs surface buzzwords?
- communication: Structured, clear, and concise?
- problem_solving: Logical breakdown of problems?
- confidence: Conviction vs excessive hedging?
- relevance: Did answers actually address what was asked?

Be specific — reference actual patterns from the transcript, not generic advice.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: `Here is the interview transcript:\n\n${transcriptText}` }
      ],
      temperature: 0.2, // lower temperature for more objective grading
      response_format: { type: 'json_object' },
    });

    let resultText = completion.choices[0]?.message?.content || '{}';
    
    // Strip markdown fences
    resultText = resultText.replace(/```json|```/g, "").trim();
    
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in evaluate route:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during evaluation.' },
      { status: 500 }
    );
  }
}
