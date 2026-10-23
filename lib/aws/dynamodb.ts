import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";

export const ddbClient = new DynamoDBClient({
  region,
});

export const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || "NotionLitePages";
