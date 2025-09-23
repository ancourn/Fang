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

    const report = await db.analyticsReport.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        snapshots: {
          orderBy: { date: 'desc' },
          take: 10
        },
        schedules: true
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching analytics report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, config, isPublic, isActive } = body;

    const existingReport = await db.analyticsReport.findUnique({
      where: { id: params.id }
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (existingReport.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (config !== undefined) updateData.config = JSON.stringify(config);
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isActive !== undefined) updateData.isActive = isActive;

    const report = await db.analyticsReport.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating analytics report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingReport = await db.analyticsReport.findUnique({
      where: { id: params.id }
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (existingReport.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.analyticsReport.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting analytics report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}