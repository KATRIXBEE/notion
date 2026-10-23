#!/usr/bin/env bash
set -euo pipefail

# NotionLite AWS Resource Teardown Script
# Safely tears down DynamoDB, S3 bucket + objects, Cognito User Pool, ECR, CW Log Group, SNS Topic

AWS_REGION="${AWS_REGION:-ap-south-1}"

echo "=========================================================="
echo "  DESTROYING NotionLite AWS Resources ($AWS_REGION)"
echo "=========================================================="

read -p "Are you sure you want to delete all NotionLite AWS resources? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

# 1. DynamoDB Table
echo "Deleting DynamoDB Table: NotionLitePages..."
aws dynamodb delete-table --region "$AWS_REGION" --table-name NotionLitePages || true

# 2. S3 Bucket (force delete with objects)
if [ -n "${S3_BUCKET:-}" ]; then
  echo "Deleting S3 Bucket and objects: $S3_BUCKET..."
  aws s3 rb "s3://$S3_BUCKET" --force || true
else
  echo "Tip: Set S3_BUCKET=<name> to delete the S3 bucket automatically."
fi

# 3. Cognito User Pool
if [ -n "${COGNITO_USER_POOL_ID:-}" ]; then
  echo "Deleting Cognito User Pool: $COGNITO_USER_POOL_ID..."
  aws cognito-idp delete-user-pool --region "$AWS_REGION" --user-pool-id "$COGNITO_USER_POOL_ID" || true
else
  echo "Tip: Set COGNITO_USER_POOL_ID=<id> to delete the Cognito user pool."
fi

# 4. ECR Repository
echo "Deleting ECR Repository: notionlite..."
aws ecr delete-repository --region "$AWS_REGION" --repository-name notionlite --force || true

# 5. CloudWatch Log Group
echo "Deleting CloudWatch Log Group: /notionlite/app..."
aws logs delete-log-group --region "$AWS_REGION" --log-group-name "/notionlite/app" || true

# 6. SNS Topic
if [ -n "${SNS_TOPIC_ARN:-}" ]; then
  echo "Deleting SNS Topic: $SNS_TOPIC_ARN..."
  aws sns delete-topic --region "$AWS_REGION" --topic-arn "$SNS_TOPIC_ARN" || true
fi

echo "=========================================================="
echo "  Teardown complete!"
echo "=========================================================="
