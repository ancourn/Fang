import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, type, context } = await request.json();

    if (!prompt || !type) {
      return NextResponse.json({ error: 'Prompt and type are required' }, { status: 400 });
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();
    
    let systemPrompt = '';
    let userPrompt = prompt;
    let maxTokens = 500;
    let temperature = 0.7;

    switch (type) {
      case 'document':
        systemPrompt = 'You are an expert content writer. Create well-structured, professional document content based on the user\'s request.';
        maxTokens = 800;
        temperature = 0.7;
        break;

      case 'email':
        systemPrompt = 'You are a professional email writer. Write clear, concise, and effective emails. Include appropriate subject line, greeting, body, and closing.';
        maxTokens = 600;
        temperature = 0.6;
        break;

      case 'summary':
        systemPrompt = 'You are an expert at creating concise summaries. Capture the key points while maintaining clarity and brevity.';
        maxTokens = 300;
        temperature = 0.5;
        break;

      case 'title':
        systemPrompt = 'You are an expert at creating catchy, descriptive titles. Generate titles that are engaging and accurately reflect the content.';
        maxTokens = 100;
        temperature = 0.8;
        break;

      case 'translation':
        systemPrompt = 'You are a professional translator. Provide accurate, natural-sounding translations while maintaining the original meaning and tone.';
        maxTokens = 600;
        temperature = 0.3;
        break;

      default:
        systemPrompt = 'You are a helpful assistant. Provide high-quality content based on the user\'s request.';
    }

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      });

      const response = completion.choices[0]?.message?.content || 'No content generated';

      // Save generation to database
      const savedGeneration = await db.aIContentGeneration.create({
        data: {
          userId: session.user.id,
          prompt,
          response,
          type,
          context: context ? JSON.stringify(context) : null,
          model: 'gpt-3.5-turbo'
        }
      });

      return NextResponse.json({
        id: savedGeneration.id,
        prompt,
        response,
        type,
        createdAt: savedGeneration.createdAt
      });

    } catch (aiError) {
      console.error('AI content generation error:', aiError);
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    const whereClause: any = { userId: session.user.id };
    if (type) {
      whereClause.type = type;
    }

    const generations = await db.aIContentGeneration.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      generations: generations.map(gen => ({
        id: gen.id,
        prompt: gen.prompt,
        response: gen.response,
        type: gen.type,
        context: gen.context ? JSON.parse(gen.context) : null,
        tokensUsed: gen.tokensUsed,
        model: gen.model,
        createdAt: gen.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching content generations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}