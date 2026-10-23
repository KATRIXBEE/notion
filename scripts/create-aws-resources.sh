#!/usr/bin/env bash
set -euo pipefail

# NotionLite AWS Resource Provisioning Script
# Provisions: DynamoDB, S3 + CORS, Cognito User Pool + Client, ECR, CloudWatch Log Group, SNS Topic

AWS_REGION="${AWS_REGION:-ap-south-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
RANDOM_SUFFIX=$(head /dev/urandom | tr -dc a-z0-9 | head -c 6 || echo "nl$RANDOM")

TABLE_NAME="NotionLitePages"
BUCKET_NAME="notionlite-covers-${ACCOUNT_ID}-${RANDOM_SUFFIX}"
POOL_NAME="notionlite-users"
CLIENT_NAME="notionlite-web-client"
ECR_REPO_NAME="notionlite"
LOG_GROUP_NAME="/notionlite/app"
SNS_TOPIC_NAME="notionlite-cpu-alarms"

echo "=========================================================="
echo "  Provisioning NotionLite AWS Resources in $AWS_REGION"
echo "  Account: $ACCOUNT_ID"
echo "=========================================================="

# 1. DynamoDB Table (On-Demand, PK=userId, SK=pageId)
echo "[1/6] Creating DynamoDB Table: $TABLE_NAME..."
aws dynamodb create-table \
  --region "$AWS_REGION" \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=pageId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=pageId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  || echo "Table already exists or error occurred."

# 2. S3 Bucket + CORS Configuration
echo "[2/6] Creating S3 Private Bucket: $BUCKET_NAME..."
if [ "$AWS_REGION" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION"
else
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION"
fi

# Enable S3 bucket private block public access
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Configure CORS on S3 Bucket
cat <<'EOF' > /tmp/notionlite-s3-cors.json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file:///tmp/notionlite-s3-cors.json
rm -f /tmp/notionlite-s3-cors.json

# 3. Cognito User Pool + App Client
echo "[3/6] Creating Cognito User Pool..."
POOL_ID=$(aws cognito-idp create-user-pool \
  --region "$AWS_REGION" \
  --pool-name "$POOL_NAME" \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies 'PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}' \
  --query "UserPool.Id" \
  --output text)

echo "User Pool Created: $POOL_ID"

echo "Creating Cognito App Client (custom form, no secret)..."
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --region "$AWS_REGION" \
  --user-pool-id "$POOL_ID" \
  --client-name "$CLIENT_NAME" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --query "UserPoolClient.ClientId" \
  --output text)

echo "App Client Created: $CLIENT_ID"

# 4. Amazon ECR Repository
echo "[4/6] Creating ECR Repository: $ECR_REPO_NAME..."
aws ecr create-repository \
  --region "$AWS_REGION" \
  --repository-name "$ECR_REPO_NAME" \
  --image-scanning-configuration scanOnPush=true \
  || echo "ECR repository already exists."

# 5. CloudWatch Log Group
echo "[5/6] Creating CloudWatch Log Group: $LOG_GROUP_NAME..."
aws logs create-log-group \
  --region "$AWS_REGION" \
  --log-group-name "$LOG_GROUP_NAME" \
  || echo "Log group already exists."

aws logs put-retention-policy \
  --region "$AWS_REGION" \
  --log-group-name "$LOG_GROUP_NAME" \
  --retention-in-days 14

# 6. SNS Topic for CPU Alarms
echo "[6/6] Creating SNS Topic for CloudWatch Alarms: $SNS_TOPIC_NAME..."
SNS_TOPIC_ARN=$(aws sns create-topic \
  --region "$AWS_REGION" \
  --name "$SNS_TOPIC_NAME" \
  --query "TopicArn" \
  --output text)

echo ""
echo "=========================================================="
echo "  RESOURCES CREATED SUCCESSFULLY!"
echo "=========================================================="
echo ""
echo "Copy these values into your .env.local file:"
echo ""
echo "AWS_REGION=$AWS_REGION"
echo "DYNAMODB_TABLE=$TABLE_NAME"
echo "S3_BUCKET=$BUCKET_NAME"
echo "COGNITO_USER_POOL_ID=$POOL_ID"
echo "COGNITO_CLIENT_ID=$CLIENT_ID"
echo "SNS_TOPIC_ARN=$SNS_TOPIC_ARN"
echo "ECR_REPOSITORY_URI=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"
echo ""
echo "To subscribe your email to alarms:"
echo "  aws sns subscribe --topic-arn $SNS_TOPIC_ARN --protocol email --notification-endpoint your-email@example.com"
echo "=========================================================="
