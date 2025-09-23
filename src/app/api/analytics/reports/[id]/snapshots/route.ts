import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = { reportId: params.id };
    if (period) {
      whereClause.period = period;
    }

    const snapshots = await db.analyticsSnapshot.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limit
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error fetching analytics snapshots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, metadata, period, date } = body;

    if (!data || !period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const snapshot = await db.analyticsSnapshot.create({
      data: {
        reportId: params.id,
        data: JSON.stringify(data),
        metadata: metadata ? JSON.stringify(metadata) : null,
        period,
        date: date ? new Date(date) : new Date()
      }
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Error creating analytics snapshot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}