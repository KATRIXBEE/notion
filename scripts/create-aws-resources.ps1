# NotionLite AWS Resource Provisioning Script (PowerShell)
# Provisions: DynamoDB, S3 + CORS, Cognito User Pool + Client, ECR, CloudWatch Log Group, SNS Topic

$ErrorActionPreference = "Stop"

$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }

Write-Host "Checking AWS Identity..." -ForegroundColor Cyan
try {
    $ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text).Trim()
} catch {
    Write-Host "ERROR: Unable to locate AWS credentials. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

$TABLE_NAME = "NotionLitePages"
$POOL_NAME = "notionlite-users"
$CLIENT_NAME = "notionlite-web-client"
$ECR_REPO_NAME = "notionlite"
$LOG_GROUP_NAME = "/notionlite/app"
$SNS_TOPIC_NAME = "notionlite-cpu-alarms"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Provisioning NotionLite AWS Resources in $AWS_REGION" -ForegroundColor Green
Write-Host "  AWS Account: $ACCOUNT_ID" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. DynamoDB Table (On-Demand, PK=userId, SK=pageId)
Write-Host "[1/6] Checking DynamoDB Table: $TABLE_NAME..." -ForegroundColor Yellow
$tables = aws dynamodb list-tables --region "$AWS_REGION" --query "TableNames" --output text
if ($tables -match $TABLE_NAME) {
    Write-Host "DynamoDB table '$TABLE_NAME' already exists and is active." -ForegroundColor Green
} else {
    Write-Host "Creating DynamoDB Table: $TABLE_NAME..." -ForegroundColor Yellow
    aws dynamodb create-table `
      --region "$AWS_REGION" `
      --table-name "$TABLE_NAME" `
      --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=pageId,AttributeType=S `
      --key-schema AttributeName=userId,KeyType=HASH AttributeName=pageId,KeyType=RANGE `
      --billing-mode PAY_PER_REQUEST
    Write-Host "Waiting for DynamoDB table to become ACTIVE..." -ForegroundColor Gray
    aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$AWS_REGION"
}

# 2. S3 Bucket + CORS Configuration
Write-Host "[2/6] Checking S3 Private Bucket..." -ForegroundColor Yellow
$existingBucket = (aws s3api list-buckets --query "Buckets[?starts_with(Name, 'notionlite-covers-')].Name" --output text).Trim()
if ($existingBucket -and $existingBucket.Length -gt 3) {
    $BUCKET_NAME = $existingBucket.Split()[0].Trim()
    Write-Host "Reusing existing S3 bucket: $BUCKET_NAME" -ForegroundColor Green
} else {
    $RANDOM_SUFFIX = (-join ((48..57) + (97..122) | Get-Random -Count 6 | ForEach-Object {[char]$_}))
    $BUCKET_NAME = "notionlite-covers-$ACCOUNT_ID-$RANDOM_SUFFIX"
    Write-Host "Creating S3 Private Bucket: $BUCKET_NAME..." -ForegroundColor Yellow
    if ($AWS_REGION -eq "us-east-1") {
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION"
    } else {
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" --create-bucket-configuration LocationConstraint="$AWS_REGION"
    }
}

aws s3api put-public-access-block `
  --bucket "$BUCKET_NAME" `
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" 2>$null

$corsJson = '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","HEAD"],"AllowedOrigins":["*"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3000}]}'
Set-Content -Path "cors-temp.json" -Value $corsJson
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://cors-temp.json 2>$null
Remove-Item -Force "cors-temp.json" -ErrorAction SilentlyContinue

# 3. Cognito User Pool & Web Client
Write-Host "[3/6] Checking Cognito User Pool: $POOL_NAME..." -ForegroundColor Yellow
$existingPoolId = (aws cognito-idp list-user-pools --max-results 10 --region "$AWS_REGION" --query "UserPools[?Name=='$POOL_NAME'].Id" --output text).Trim()
if ($existingPoolId -and $existingPoolId.Length -gt 3) {
    $POOL_ID = $existingPoolId.Split()[0].Trim()
    Write-Host "Reusing existing Cognito User Pool: $POOL_ID" -ForegroundColor Green
} else {
    Write-Host "Creating Cognito User Pool: $POOL_NAME..." -ForegroundColor Yellow
    $POOL_ID = (aws cognito-idp create-user-pool `
      --region "$AWS_REGION" `
      --pool-name "$POOL_NAME" `
      --auto-verified-attributes email `
      --username-attributes email `
      --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" `
      --query "UserPool.Id" --output text).Trim()
    Write-Host "Created Cognito User Pool: $POOL_ID" -ForegroundColor Cyan
}

$clientRaw = aws cognito-idp list-user-pool-clients --user-pool-id "$POOL_ID" --region "$AWS_REGION" --query "UserPoolClients[?ClientName=='$CLIENT_NAME'].ClientId" --output text
$existingClientId = if ($clientRaw) { ("" + $clientRaw).Trim() } else { "" }
if ($existingClientId -and $existingClientId.Length -gt 3) {
    $CLIENT_ID = $existingClientId.Split()[0].Trim()
    Write-Host "Reusing existing Cognito App Client: $CLIENT_ID" -ForegroundColor Green
} else {
    Write-Host "Creating Cognito App Client: $CLIENT_NAME..." -ForegroundColor Yellow
    $CLIENT_ID = (aws cognito-idp create-user-pool-client `
      --region "$AWS_REGION" `
      --user-pool-id "$POOL_ID" `
      --client-name "$CLIENT_NAME" `
      --no-generate-secret `
      --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH `
      --query "UserPoolClient.ClientId" --output text).Trim()
    Write-Host "Created Cognito App Client: $CLIENT_ID" -ForegroundColor Cyan
}

# 4. Amazon ECR Repository
Write-Host "[4/6] Checking Amazon ECR Repository: $ECR_REPO_NAME..." -ForegroundColor Yellow
try {
    aws ecr create-repository --region "$AWS_REGION" --repository-name "$ECR_REPO_NAME" --image-scanning-configuration scanOnPush=true 2>$null
} catch {
    Write-Host "ECR repository ready." -ForegroundColor Gray
}

# 5. CloudWatch Log Group
Write-Host "[5/6] Checking CloudWatch Log Group: $LOG_GROUP_NAME..." -ForegroundColor Yellow
try {
    aws logs create-log-group --region "$AWS_REGION" --log-group-name "$LOG_GROUP_NAME" 2>$null
} catch {
    Write-Host "Log group ready." -ForegroundColor Gray
}

# 6. SNS Topic
Write-Host "[6/6] Checking SNS Alert Topic: $SNS_TOPIC_NAME..." -ForegroundColor Yellow
try {
    $TOPIC_ARN = (aws sns create-topic --region "$AWS_REGION" --name "$SNS_TOPIC_NAME" --query "TopicArn" --output text).Trim()
} catch {
    $TOPIC_ARN = "arn:aws:sns:$AWS_REGION`:$ACCOUNT_ID`:$SNS_TOPIC_NAME"
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS! NotionLite AWS Resources Created Successfully" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Region:               $AWS_REGION"
Write-Host "DynamoDB Table:       $TABLE_NAME"
Write-Host "S3 Bucket:            $BUCKET_NAME"
Write-Host "Cognito User Pool ID: $POOL_ID"
Write-Host "Cognito Client ID:    $CLIENT_ID"
Write-Host "ECR Repository:       $ECR_REPO_NAME"
Write-Host "CloudWatch Logs:      $LOG_GROUP_NAME"
Write-Host "SNS Topic ARN:        $TOPIC_ARN"
Write-Host "==========================================================" -ForegroundColor Green

# Generate .env.local file automatically
$ENV_CONTENT = @"
AWS_REGION=$AWS_REGION
COGNITO_USER_POOL_ID=$POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID
COGNITO_CLIENT_SECRET=
DYNAMODB_TABLE=$TABLE_NAME
S3_BUCKET=$BUCKET_NAME
COOKIE_SECRET=notionlite_super_secret_cookie_key_32chars
NEXT_PUBLIC_BASE_URL=http://localhost:3000
"@

Set-Content -Path ".env.local" -Value $ENV_CONTENT
Write-Host "Saved configuration directly to .env.local!" -ForegroundColor Cyan
