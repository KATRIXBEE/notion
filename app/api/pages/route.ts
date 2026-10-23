import { NextRequest, NextResponse } from "next/server";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "@/lib/aws/dynamodb";
import { verifyAuth } from "@/lib/auth/verify";
import { CreatePageSchema } from "@/lib/zod/schemas";
import { generatePageId } from "@/lib/ulid";
import { apiError, internalError, getZodErrorMessage } from "@/lib/errors";

export interface NotionLitePageItem {
  userId: string;
  pageId: string;
  parentId: string | null;
  title: string;
  icon: string;
  content: string;
  coverKey: string | null;
  isDeleted: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { searchParams } = new URL(req.url);
    const isTrash = searchParams.get("trash") === "true";
    const isFavorites = searchParams.get("favorites") === "true";

    let filterExpression = "isDeleted = :isDeleted";
    const expressionAttributeValues: Record<string, unknown> = {
      ":userId": user.userId,
      ":isDeleted": isTrash,
    };

    if (isFavorites && !isTrash) {
      filterExpression += " AND isFavorite = :isFavorite";
      expressionAttributeValues[":isFavorite"] = true;
    }

    const command = new QueryCommand({
      TableName: DYNAMODB_TABLE,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    try {
      const result = await docClient.send(command);
      const pages = (result.Items || []) as NotionLitePageItem[];
      pages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return NextResponse.json({ pages });
    } catch {
      const { localStore } = await import("@/lib/aws/localStore");
      const pages = localStore.query(user.userId, {
        isDeleted: isTrash,
        isFavorite: isFavorites ? true : undefined,
      });
      pages.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return NextResponse.json({ pages });
    }
  } catch (err) {
    return internalError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const body = await req.json();
    const result = CreatePageSchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION_ERROR", getZodErrorMessage(result.error), 400);
    }

    const { title, parentId, icon, content, coverKey } = result.data;
    const now = new Date().toISOString();
    const pageId = generatePageId();

    const pageItem: NotionLitePageItem = {
      userId: user.userId,
      pageId,
      parentId: parentId || null,
      title: title || "Untitled",
      icon: icon || "📄",
      content: content || "",
      coverKey: coverKey || null,
      isDeleted: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: pageItem,
        })
      );
    } catch {
      const { localStore } = await import("@/lib/aws/localStore");
      localStore.put(pageItem);
    }

    return NextResponse.json({ page: pageItem }, { status: 201 });
  } catch (err) {
    return internalError(err);
  }
}
