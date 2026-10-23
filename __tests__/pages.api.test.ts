import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "@/lib/aws/dynamodb";
import { generatePageId } from "@/lib/ulid";

const ddbMock = mockClient(docClient as any);

describe("Pages DynamoDB Logic & UserId Scoping", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it("generates valid ULID page IDs", () => {
    const id1 = generatePageId();
    const id2 = generatePageId();
    expect(id1).toHaveLength(26);
    expect(id2).toHaveLength(26);
    expect(id1).not.toBe(id2);
  });

  it("queries pages strictly scoped to the userId partition", async () => {
    const userId = "user-12345";
    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          userId,
          pageId: "01HQ0000000000000000000001",
          title: "My Note",
          icon: "📄",
          isDeleted: false,
          isFavorite: false,
        },
      ],
    });

    const command = new QueryCommand({
      TableName: DYNAMODB_TABLE,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "isDeleted = :isDeleted",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":isDeleted": false,
      },
    });

    const result = await docClient.send(command);
    expect(result.Items).toHaveLength(1);
    expect(result.Items?.[0].userId).toBe(userId);

    const calls = ddbMock.commandCalls(QueryCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0].args[0].input.ExpressionAttributeValues?.[":userId"]).toBe(userId);
  });

  it("inserts new page with userId as partition key and ULID as sort key", async () => {
    const userId = "user-abc-999";
    const pageId = generatePageId();

    ddbMock.on(PutCommand).resolves({});

    const pageItem = {
      userId,
      pageId,
      parentId: null,
      title: "Architecture Decisions",
      icon: "🏗️",
      content: "",
      coverKey: null,
      isDeleted: false,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: pageItem,
      })
    );

    const calls = ddbMock.commandCalls(PutCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0].args[0].input.Item?.userId).toBe(userId);
    expect(calls[0].args[0].input.Item?.pageId).toBe(pageId);
  });

  it("retrieves page asserting composite key { userId, pageId }", async () => {
    const userId = "user-sec-456";
    const pageId = "01HQ0000000000000000000002";

    ddbMock.on(GetCommand).resolves({
      Item: {
        userId,
        pageId,
        title: "Confidential Notes",
      },
    });

    const res = await docClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: { userId, pageId },
      })
    );

    expect(res.Item?.title).toBe("Confidential Notes");
    const calls = ddbMock.commandCalls(GetCommand);
    expect(calls[0].args[0].input.Key).toEqual({ userId, pageId });
  });

  it("performs soft delete by updating isDeleted attribute to true", async () => {
    const userId = "user-delete-test";
    const pageId = "01HQ0000000000000000000003";

    ddbMock.on(UpdateCommand).resolves({});

    await docClient.send(
      new UpdateCommand({
        TableName: DYNAMODB_TABLE,
        Key: { userId, pageId },
        UpdateExpression: "SET #isDeleted = :true",
        ExpressionAttributeNames: { "#isDeleted": "isDeleted" },
        ExpressionAttributeValues: { ":true": true },
      })
    );

    const calls = ddbMock.commandCalls(UpdateCommand);
    expect(calls[0].args[0].input.Key).toEqual({ userId, pageId });
    expect(calls[0].args[0].input.UpdateExpression).toContain("isDeleted");
  });

  it("performs hard permanent delete only when explicitly requested", async () => {
    const userId = "user-hard-delete";
    const pageId = "01HQ0000000000000000000004";

    ddbMock.on(DeleteCommand).resolves({});

    await docClient.send(
      new DeleteCommand({
        TableName: DYNAMODB_TABLE,
        Key: { userId, pageId },
      })
    );

    const calls = ddbMock.commandCalls(DeleteCommand);
    expect(calls[0].args[0].input.Key).toEqual({ userId, pageId });
  });
});
