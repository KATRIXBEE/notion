import { NextRequest, NextResponse } from "next/server";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "@/lib/aws/dynamodb";
import { verifyAuth } from "@/lib/auth/verify";
import { apiError, internalError } from "@/lib/errors";
import { NotionLitePageItem } from "../pages/route";

function countWordsAndTodos(content: string): { words: number; todosDone: number } {
  if (!content) return { words: 0, todosDone: 0 };

  let words = 0;
  let todosDone = 0;

  try {
    const json = JSON.parse(content);

    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const n = node as Record<string, unknown>;

      if (n.type === "text" && typeof n.text === "string") {
        const matches = n.text.trim().split(/\s+/).filter(Boolean);
        words += matches.length;
      }

      if (
        n.type === "taskItem" &&
        n.attrs &&
        typeof n.attrs === "object" &&
        (n.attrs as Record<string, unknown>).checked === true
      ) {
        todosDone += 1;
      }

      if (Array.isArray(n.content)) {
        for (const child of n.content) {
          walk(child);
        }
      }
    }

    walk(json);
  } catch {
    // If not JSON, treat as plain text
    const textWords = content.trim().split(/\s+/).filter(Boolean).length;
    words = textWords;
    // Look for markdown style checkboxes [x]
    const checkMatches = content.match(/\[x\]/gi);
    todosDone = checkMatches ? checkMatches.length : 0;
  }

  return { words, todosDone };
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const command = new QueryCommand({
      TableName: DYNAMODB_TABLE,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "isDeleted = :false",
      ExpressionAttributeValues: {
        ":userId": user.userId,
        ":false": false,
      },
    });

    let pages: NotionLitePageItem[] = [];
    try {
      const result = await docClient.send(command);
      pages = (result.Items || []) as NotionLitePageItem[];
    } catch {
      const { localStore } = await import("@/lib/aws/localStore");
      pages = localStore.query(user.userId, { isDeleted: false });
    }

    let totalWords = 0;
    let totalTodosDone = 0;
    const markedDays: number[] = [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (const page of pages) {
      const { words, todosDone } = countWordsAndTodos(page.content);
      totalWords += words;
      totalTodosDone += todosDone;

      if (page.createdAt) {
        const createdDate = new Date(page.createdAt);
        if (
          createdDate.getFullYear() === currentYear &&
          createdDate.getMonth() === currentMonth
        ) {
          const day = createdDate.getDate();
          if (!markedDays.includes(day)) {
            markedDays.push(day);
          }
        }
      }
    }

    // Recent 5 pages
    const recentPages = [...pages]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      )
      .slice(0, 5)
      .map((p) => ({
        pageId: p.pageId,
        title: p.title,
        icon: p.icon,
        updatedAt: p.updatedAt,
      }));

    return NextResponse.json({
      totalPages: pages.length,
      todosDone: totalTodosDone,
      wordsWritten: totalWords,
      markedDays,
      recentPages,
    });
  } catch (err) {
    return internalError(err);
  }
}
