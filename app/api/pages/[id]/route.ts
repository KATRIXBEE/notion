import { NextRequest, NextResponse } from "next/server";
import {
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "@/lib/aws/dynamodb";
import { verifyAuth } from "@/lib/auth/verify";
import { UpdatePageSchema } from "@/lib/zod/schemas";
import { apiError, internalError, getZodErrorMessage } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { id } = params;
    const command = new GetCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        userId: user.userId,
        pageId: id,
      },
    });

    try {
      const result = await docClient.send(command);
      if (!result.Item) {
        return apiError("NOT_FOUND", "Page not found", 404);
      }
      return NextResponse.json({ page: result.Item });
    } catch {
      const { localStore } = await import("@/lib/aws/localStore");
      const item = localStore.get(user.userId, id);
      if (!item) {
        return apiError("NOT_FOUND", "Page not found", 404);
      }
      return NextResponse.json({ page: item });
    }
  } catch (err) {
    return internalError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { id } = params;
    const body = await req.json();
    const result = UpdatePageSchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION_ERROR", getZodErrorMessage(result.error), 400);
    }

    const updates = result.data;
    const updateKeys = Object.keys(updates);
    if (updateKeys.length === 0) {
      return apiError("BAD_REQUEST", "No updates provided", 400);
    }

    // Build update expression
    const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
    const expressionAttributeNames: Record<string, string> = {
      "#updatedAt": "updatedAt",
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ":updatedAt": new Date().toISOString(),
    };

    for (const key of updateKeys) {
      const val = (updates as Record<string, unknown>)[key];
      if (val !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = val;
      }
    }

    const command = new UpdateCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        userId: user.userId,
        pageId: id,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    try {
      const response = await docClient.send(command);
      return NextResponse.json({ page: response.Attributes });
    } catch {
      const { localStore } = await import("@/lib/aws/localStore");
      const updated = localStore.update(user.userId, id, updates);
      return NextResponse.json({ page: updated });
    }
  } catch (err) {
    return internalError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const isPermanent = searchParams.get("permanent") === "true";

    try {
      if (isPermanent) {
        // Hard delete
        await docClient.send(
          new DeleteCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              userId: user.userId,
              pageId: id,
            },
          })
        );
      } else {
        // Soft delete
        await docClient.send(
          new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
              userId: user.userId,
              pageId: id,
            },
            UpdateExpression: "SET #isDeleted = :true, #updatedAt = :now",
            ExpressionAttributeNames: {
              "#isDeleted": "isDeleted",
              "#updatedAt": "updatedAt",
            },
            ExpressionAttributeValues: {
              ":true": true,
              ":now": new Date().toISOString(),
            },
          })
        );
      }
    } catch {
      const { localStore } = await import("@/lib/aws/localStore");
      if (isPermanent) {
        localStore.delete(user.userId, id);
      } else {
        localStore.update(user.userId, id, { isDeleted: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return internalError(err);
  }
}
