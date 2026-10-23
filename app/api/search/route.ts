import { NextRequest, NextResponse } from "next/server";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "@/lib/aws/dynamodb";
import { verifyAuth } from "@/lib/auth/verify";
import { SearchQuerySchema } from "@/lib/zod/schemas";
import { apiError, internalError, getZodErrorMessage } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const parseResult = SearchQuerySchema.safeParse({ q });
    if (!parseResult.success) {
      return apiError("VALIDATION_ERROR", getZodErrorMessage(parseResult.error), 400);
    }

    const query = parseResult.data.q;

    // Spec: "Search = Query on the user's partition with FilterExpression contains(title)."
    const command = new QueryCommand({
      TableName: DYNAMODB_TABLE,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "contains(#title, :query) AND isDeleted = :false",
      ExpressionAttributeNames: {
        "#title": "title",
      },
      ExpressionAttributeValues: {
        ":userId": user.userId,
        ":query": query,
        ":false": false,
      },
    });

    try {
      const result = await docClient.send(command);
      return NextResponse.json({ pages: result.Items || [] });
    } catch {
      const { localStore } = await import("@/lib/aws/localStore");
      const pages = localStore.query(user.userId, { search: query, isDeleted: false });
      return NextResponse.json({ pages });
    }
  } catch (err) {
    return internalError(err);
  }
}
