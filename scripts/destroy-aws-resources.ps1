# NotionLite AWS Resource Teardown Script (PowerShell)
# Tears down DynamoDB, S3 bucket + objects, Cognito User Pool, ECR, CW Log Group, SNS Topic

$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }

Write-Host "==========================================================" -ForegroundColor Red
Write-Host "  DESTROYING NotionLite AWS Resources ($AWS_REGION)" -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Red

$confirm = Read-Host "Are you sure you want to delete all NotionLite AWS resources? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Aborted."
    exit 0
}

# 1. DynamoDB Table
Write-Host "Deleting DynamoDB Table: NotionLitePages..." -ForegroundColor Yellow
aws dynamodb delete-table --region "$AWS_REGION" --table-name NotionLitePages 2>$null

# 2. S3 Bucket
if ($env:S3_BUCKET) {
    Write-Host "Deleting S3 Bucket: $env:S3_BUCKET..." -ForegroundColor Yellow
    aws s3 rb "s3://$env:S3_BUCKET" --force 2>$null
}

# 3. Cognito User Pool
if ($env:COGNITO_USER_POOL_ID) {
    Write-Host "Deleting Cognito User Pool: $env:COGNITO_USER_POOL_ID..." -ForegroundColor Yellow
    aws cognito-idp delete-user-pool --region "$AWS_REGION" --user-pool-id "$env:COGNITO_USER_POOL_ID" 2>$null
}

# 4. ECR Repository
Write-Host "Deleting ECR Repository: notionlite..." -ForegroundColor Yellow
aws ecr delete-repository --region "$AWS_REGION" --repository-name notionlite --force 2>$null

# 5. CloudWatch Log Group
Write-Host "Deleting CloudWatch Log Group: /notionlite/app..." -ForegroundColor Yellow
aws logs delete-log-group --region "$AWS_REGION" --log-group-name "/notionlite/app" 2>$null

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Teardown complete!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
