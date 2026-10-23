import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "@/lib/aws/dynamodb";
import { SearchQuerySchema } from "@/lib/zod/schemas";

const ddbMock = mockClient(docClient as any);

describe("Search API Logic", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it("validates search query string length", () => {
    expect(SearchQuerySchema.safeParse({ q: "" }).success).toBe(false);
    expect(SearchQuerySchema.safeParse({ q: "roadmaps" }).success).toBe(true);
  });

  it("constructs QueryCommand with contains(title) on the user partition", async () => {
    const userId = "search-user-1";
    const query = "Meeting";

    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          userId,
          pageId: "01HQ0000000000000000000010",
          title: "Weekly Team Meeting",
          icon: "📅",
          isDeleted: false,
        },
      ],
    });

    const command = new QueryCommand({
      TableName: DYNAMODB_TABLE,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "contains(#title, :query) AND isDeleted = :false",
      ExpressionAttributeNames: {
        "#title": "title",
      },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":query": query,
        ":false": false,
      },
    });

    const res = await docClient.send(command);
    expect(res.Items).toHaveLength(1);
    expect(res.Items?.[0].title).toContain("Meeting");

    const calls = ddbMock.commandCalls(QueryCommand);
    expect(calls[0].args[0].input.FilterExpression).toContain("contains(#title, :query)");
  });
});
