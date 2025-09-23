import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if workflow exists and user has access
    const workflow = await db.workflow.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workflow.workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const executions = await db.workflowExecution.findMany({
      where: {
        workflowId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("Error fetching workflow executions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if workflow exists and user has access
    const workflow = await db.workflow.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (!workflow.isActive) {
      return NextResponse.json({ error: "Workflow is not active" }, { status: 400 });
    }

    const userWorkspace = await db.userWorkspace.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workflow.workspaceId,
      },
    });

    if (!userWorkspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { triggerData } = body;

    // Create workflow execution
    const execution = await db.workflowExecution.create({
      data: {
        workflowId: params.id,
        userId: session.user.id,
        triggerData: triggerData ? JSON.stringify(triggerData) : null,
        status: "running",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Execute workflow asynchronously
    executeWorkflowAsync(params.id, execution.id, triggerData);

    return NextResponse.json(execution);
  } catch (error) {
    console.error("Error executing workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Async workflow execution function
async function executeWorkflowAsync(workflowId: string, executionId: string, triggerData?: any) {
  try {
    // Fetch workflow details
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      await db.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "failed",
          errorMessage: "Workflow not found",
          completedAt: new Date(),
        },
      });
      return;
    }

    // Parse workflow configuration
    const actions = JSON.parse(workflow.actions);
    const triggerConfig = JSON.parse(workflow.triggerConfig);

    let results: any[] = [];
    let errorMessage: string | null = null;

    try {
      // Execute each action in sequence
      for (const action of actions) {
        try {
          const result = await executeAction(action, triggerData);
          results.push({ action: action.type, result: "success", data: result });
        } catch (error) {
          console.error(`Error executing action ${action.type}:`, error);
          results.push({ action: action.type, result: "error", error: error.message });
          throw error; // Stop execution on first error
        }
      }

      // Mark execution as completed
      await db.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "completed",
          result: JSON.stringify({ results }),
          completedAt: new Date(),
        },
      });
    } catch (error) {
      // Mark execution as failed
      await db.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          result: JSON.stringify({ results }),
          completedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Error in workflow execution:", error);
    await db.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });
  }
}

// Action execution function
async function executeAction(action: any, triggerData: any): Promise<any> {
  switch (action.type) {
    case "send_email":
      return await executeSendEmail(action.config, triggerData);
    case "create_task":
      return await executeCreateTask(action.config, triggerData);
    case "send_message":
      return await executeSendMessage(action.config, triggerData);
    case "create_document":
      return await executeCreateDocument(action.config, triggerData);
    case "update_user":
      return await executeUpdateUser(action.config, triggerData);
    case "api_call":
      return await executeApiCall(action.config, triggerData);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

// Action implementations
async function executeSendEmail(config: any, triggerData: any): Promise<any> {
  // Simulate email sending
  console.log("Sending email to:", config.to);
  console.log("Subject:", config.subject);
  console.log("Body:", config.body);
  
  // In a real implementation, you would integrate with an email service
  // For now, just return success
  return { message: "Email sent successfully" };
}

async function executeCreateTask(config: any, triggerData: any): Promise<any> {
  // Simulate task creation
  console.log("Creating task:", config.title);
  console.log("Description:", config.description);
  console.log("Assignee:", config.assignee);
  
  // In a real implementation, you would create the task in the database
  return { message: "Task created successfully", taskId: "generated-task-id" };
}

async function executeSendMessage(config: any, triggerData: any): Promise<any> {
  // Simulate message sending
  console.log("Sending message to channel:", config.channelId);
  console.log("Message:", config.message);
  
  // In a real implementation, you would send the message via WebSocket
  return { message: "Message sent successfully", messageId: "generated-message-id" };
}

async function executeCreateDocument(config: any, triggerData: any): Promise<any> {
  // Simulate document creation
  console.log("Creating document:", config.title);
  console.log("Content:", config.content);
  
  // In a real implementation, you would create the document in the database
  return { message: "Document created successfully", documentId: "generated-document-id" };
}

async function executeUpdateUser(config: any, triggerData: any): Promise<any> {
  // Simulate user update
  console.log("Updating user:", config.userId);
  console.log("Updates:", config.updates);
  
  // In a real implementation, you would update the user in the database
  return { message: "User updated successfully" };
}

async function executeApiCall(config: any, triggerData: any): Promise<any> {
  // Simulate API call
  console.log("Making API call to:", config.url);
  console.log("Method:", config.method);
  console.log("Data:", config.data);
  
  // In a real implementation, you would make the actual HTTP request
  return { message: "API call completed successfully", status: 200 };
}