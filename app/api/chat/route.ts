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
        { error: 'Groq API Key is not configured on the server. Please add GROQ_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a professional technical interviewer at a top tech company. You are conducting a ${role} interview at ${difficulty} difficulty, type: ${type}.

Rules:
- Ask ONE question at a time.
- Start with a warm greeting and "Tell me about yourself."
- Ask 8–10 questions total based on the interview type.
- Ask ONE follow-up if an answer is too vague.
- Never give hints, feedback, or scores during the interview.
- Keep questions to 1–3 sentences.
- After the final question, say exactly: "That concludes our interview today. Thank you for your time." and nothing else.
- Never break character.`;

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'interviewer' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 150,
    });

    const question = completion.choices[0]?.message?.content || 'Could you repeat that?';

    return NextResponse.json({ question: question.trim() });
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during completion.' },
      { status: 500 }
    );
  }
}
