import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "../lib/aws/dynamodb";
import { generatePageId } from "../lib/ulid";

/**
 * Seed script creating 3 sample pages in DynamoDB for a given user.
 * Usage:
 *   npx tsx scripts/seed.ts <userId>
 * Or:
 *   USER_ID=my-user-sub npm run seed
 */
async function seed() {
  const userId =
    process.argv[2] || process.env.USER_ID || "dev-sample-user";

  console.log(`🌱 Seeding NotionLite pages for userId: "${userId}" in table: "${DYNAMODB_TABLE}"...`);

  const now = new Date().toISOString();

  // Page 1: Welcome & Quick Start
  const page1Id = generatePageId();
  const page1 = {
    userId,
    pageId: page1Id,
    parentId: null,
    title: "Welcome to NotionLite 🚀",
    icon: "🚀",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Welcome to NotionLite!" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "A distraction-free, sketch-themed workspace with a 100% AWS serverless backend. Everything you see here is rendered using rough.js wobbly ink outlines and handwritten typography.",
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Simplicity is the ultimate sophistication. Type '/' anywhere in this document to open the block command menu.",
                },
              ],
            },
          ],
        },
      ],
    }),
    coverKey: null,
    isDeleted: false,
    isFavorite: true,
    createdAt: now,
    updatedAt: now,
  };

  // Page 2: Nested Sub-page with To-Dos
  const page2Id = generatePageId();
  const page2 = {
    userId,
    pageId: page2Id,
    parentId: page1Id,
    title: "Project Roadmap & Checklist",
    icon: "🎯",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Sprint Priorities" }],
        },
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Design sketch component system" }] }],
            },
            {
              type: "taskItem",
              attrs: { checked: true },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Implement DynamoDB partition-scoped storage" }] }],
            },
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Upload header banner to S3" }] }],
            },
          ],
        },
      ],
    }),
    coverKey: null,
    isDeleted: false,
    isFavorite: true,
    createdAt: now,
    updatedAt: now,
  };

  // Page 3: Architecture & Code Snippets
  const page3Id = generatePageId();
  const page3 = {
    userId,
    pageId: page3Id,
    parentId: null,
    title: "AWS Architecture Notes",
    icon: "☁️",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Backend Architecture Overview" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "All data operations run with zero AWS keys in the codebase. Local development relies on your AWS CLI profile, while EC2 relies on IAM instance roles.",
            },
          ],
        },
        {
          type: "codeBlock",
          attrs: { language: "typescript" },
          content: [
            {
              type: "text",
              text: "const query = new QueryCommand({\n  TableName: 'NotionLitePages',\n  KeyConditionExpression: 'userId = :userId',\n});",
            },
          ],
        },
      ],
    }),
    coverKey: null,
    isDeleted: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await docClient.send(new PutCommand({ TableName: DYNAMODB_TABLE, Item: page1 }));
    console.log(`✓ Created Page 1: "${page1.title}" (${page1.pageId})`);

    await docClient.send(new PutCommand({ TableName: DYNAMODB_TABLE, Item: page2 }));
    console.log(`✓ Created Sub-page 2: "${page2.title}" (${page2.pageId})`);

    await docClient.send(new PutCommand({ TableName: DYNAMODB_TABLE, Item: page3 }));
    console.log(`✓ Created Page 3: "${page3.title}" (${page3.pageId})`);

    console.log("\n🎉 Sample pages seeded successfully!");
  } catch (error) {
    console.error("Failed to seed pages into DynamoDB:", error);
    process.exit(1);
  }
}

seed();
