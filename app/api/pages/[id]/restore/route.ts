import { NextRequest, NextResponse } from "next/server";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "@/lib/aws/dynamodb";
import { verifyAuth } from "@/lib/auth/verify";
import { apiError, internalError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { id } = params;

    const command = new UpdateCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        userId: user.userId,
        pageId: id,
      },
      UpdateExpression: "SET #isDeleted = :false, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#isDeleted": "isDeleted",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":false": false,
        ":now": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    });

    const response = await docClient.send(command);
    return NextResponse.json({ success: true, page: response.Attributes });
  } catch (err) {
    return internalError(err);
  }
}
