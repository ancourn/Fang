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

    const { documentId, analysisType } = await request.json();

    if (!documentId || !analysisType) {
      return NextResponse.json({ error: 'Document ID and analysis type are required' }, { status: 400 });
    }

    // Verify user has access to the document
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { userId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
          { workspace: { members: { some: { userId: session.user.id } } } }
        ]
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const startTime = Date.now();
    
    // Initialize ZAI SDK
    const zai = await ZAI.create();
    
    let analysisResult = {};
    let confidence = 0;

    try {
      switch (analysisType) {
        case 'summary':
          const summaryPrompt = `Please provide a comprehensive summary of the following document content:\n\n${document.content || ''}`;
          const summaryCompletion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are an expert document analyst. Provide clear, concise summaries.' },
              { role: 'user', content: summaryPrompt }
            ],
            max_tokens: 500,
            temperature: 0.7
          });
          
          analysisResult = {
            summary: summaryCompletion.choices[0]?.message?.content || 'No summary generated'
          };
          confidence = 0.9;
          break;

        case 'keywords':
          const keywordPrompt = `Extract the most important keywords and phrases from the following document content. Return them as a JSON array:\n\n${document.content || ''}`;
          const keywordCompletion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are an expert at keyword extraction. Return only a JSON array of keywords.' },
              { role: 'user', content: keywordPrompt }
            ],
            max_tokens: 200,
            temperature: 0.3
          });
          
          try {
            const keywords = JSON.parse(keywordCompletion.choices[0]?.message?.content || '[]');
            analysisResult = { keywords };
            confidence = 0.85;
          } catch (parseError) {
            analysisResult = { keywords: [] };
            confidence = 0.5;
          }
          break;

        case 'sentiment':
          const sentimentPrompt = `Analyze the sentiment of the following document content and return a JSON object with 'sentiment' (positive, negative, or neutral) and 'confidence' (0-1):\n\n${document.content || ''}`;
          const sentimentCompletion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are an expert at sentiment analysis. Return only a JSON object.' },
              { role: 'user', content: sentimentPrompt }
            ],
            max_tokens: 100,
            temperature: 0.2
          });
          
          try {
            const sentiment = JSON.parse(sentimentCompletion.choices[0]?.message?.content || '{}');
            analysisResult = sentiment;
            confidence = sentiment.confidence || 0.8;
          } catch (parseError) {
            analysisResult = { sentiment: 'neutral', confidence: 0.5 };
            confidence = 0.5;
          }
          break;

        case 'readability':
          const readabilityPrompt = `Analyze the readability of the following document content and return a JSON object with 'score' (0-100), 'level' (elementary, middle, high, college), and 'suggestions' (array of improvement suggestions):\n\n${document.content || ''}`;
          const readabilityCompletion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are an expert at readability analysis. Return only a JSON object.' },
              { role: 'user', content: readabilityPrompt }
            ],
            max_tokens: 300,
            temperature: 0.3
          });
          
          try {
            const readability = JSON.parse(readabilityCompletion.choices[0]?.message?.content || '{}');
            analysisResult = readability;
            confidence = 0.8;
          } catch (parseError) {
            analysisResult = { score: 50, level: 'middle', suggestions: [] };
            confidence = 0.5;
          }
          break;

        case 'insights':
          const insightsPrompt = `Provide deep insights and analysis for the following document content. Return a JSON object with 'keyInsights' (array), 'recommendations' (array), and 'actionItems' (array):\n\n${document.content || ''}`;
          const insightsCompletion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are an expert business analyst. Provide actionable insights and recommendations.' },
              { role: 'user', content: insightsPrompt }
            ],
            max_tokens: 600,
            temperature: 0.7
          });
          
          try {
            const insights = JSON.parse(insightsCompletion.choices[0]?.message?.content || '{}');
            analysisResult = insights;
            confidence = 0.85;
          } catch (parseError) {
            analysisResult = { keyInsights: [], recommendations: [], actionItems: [] };
            confidence = 0.5;
          }
          break;

        default:
          return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
      }
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      analysisResult = { error: 'AI analysis failed' };
      confidence = 0;
    }

    const processingTime = Date.now() - startTime;

    // Save analysis result to database
    const savedAnalysis = await db.aIDocumentAnalysis.create({
      data: {
        documentId,
        analysisType,
        result: JSON.stringify(analysisResult),
        confidence,
        processingTime
      }
    });

    return NextResponse.json({
      id: savedAnalysis.id,
      analysisType,
      result: analysisResult,
      confidence,
      processingTime,
      createdAt: savedAnalysis.createdAt
    });

  } catch (error) {
    console.error('Document analysis error:', error);
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
    const documentId = searchParams.get('documentId');
    const analysisType = searchParams.get('type');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Verify user has access to the document
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { userId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
          { workspace: { members: { some: { userId: session.user.id } } } }
        ]
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const whereClause: any = { documentId };
    if (analysisType) {
      whereClause.analysisType = analysisType;
    }

    const analyses = await db.aIDocumentAnalysis.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      analyses: analyses.map(analysis => ({
        id: analysis.id,
        analysisType: analysis.analysisType,
        result: JSON.parse(analysis.result),
        confidence: analysis.confidence,
        processingTime: analysis.processingTime,
        createdAt: analysis.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching document analyses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}