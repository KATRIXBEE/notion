# NotionLite Automated EC2 Deployment Script
# Provisions IAM Role, Security Group, and launches an EC2 instance hosting NotionLite

$ErrorActionPreference = "Stop"

$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }
$INSTANCE_TYPE = "t3.micro"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Deploying NotionLite to AWS EC2 in $AWS_REGION" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Fetch AWS Identity & Default VPC
Write-Host "[1/6] Fetching VPC and Subnet..." -ForegroundColor Yellow
$ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text).Trim()
$VPC_ID = (aws ec2 describe-vpcs --region "$AWS_REGION" --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text).Trim()
$SUBNET_ID = (aws ec2 describe-subnets --region "$AWS_REGION" --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[0].SubnetId" --output text).Trim()
Write-Host "VPC: $VPC_ID | Subnet: $SUBNET_ID" -ForegroundColor Cyan

# 2. Setup IAM Role & Instance Profile
Write-Host "[2/6] Configuring EC2 IAM Role..." -ForegroundColor Yellow
$ROLE_NAME = "NotionLiteEC2Role"
$PROFILE_NAME = "NotionLiteInstanceProfile"

$trustPolicy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
Set-Content -Path "ec2-trust.json" -Value $trustPolicy

try {
    aws iam get-role --role-name "$ROLE_NAME" 2>$null
    Write-Host "IAM Role '$ROLE_NAME' already exists." -ForegroundColor Gray
} catch {
    aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file://ec2-trust.json
    Write-Host "Created IAM Role: $ROLE_NAME" -ForegroundColor Cyan
}
Remove-Item -Force "ec2-trust.json" -ErrorAction SilentlyContinue

# Attach custom least-privilege policy
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name NotionLiteEC2Permissions --policy-document file://infra/iam/ec2-role-policy.json
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" 2>$null

try {
    aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" 2>$null
    Write-Host "Instance Profile '$PROFILE_NAME' already exists." -ForegroundColor Gray
} catch {
    aws iam create-instance-profile --instance-profile-name "$PROFILE_NAME"
    aws iam add-role-to-instance-profile --instance-profile-name "$PROFILE_NAME" --role-name "$ROLE_NAME"
    Write-Host "Created and linked Instance Profile: $PROFILE_NAME" -ForegroundColor Cyan
    Start-Sleep -Seconds 5
}

# 3. Setup Security Group (HTTP Port 80, Port 3000)
Write-Host "[3/6] Configuring Security Group..." -ForegroundColor Yellow
$SG_NAME = "notionlite-web-sg"
$existingSg = (aws ec2 describe-security-groups --region "$AWS_REGION" --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[0].GroupId" --output text).Trim()

if ($existingSg -and $existingSg -ne "None") {
    $SG_ID = $existingSg
    Write-Host "Reusing Security Group: $SG_ID" -ForegroundColor Green
} else {
    $SG_ID = (aws ec2 create-security-group --region "$AWS_REGION" --group-name "$SG_NAME" --description "NotionLite HTTP Web Inbound" --vpc-id "$VPC_ID" --query "GroupId" --output text).Trim()
    Write-Host "Created Security Group: $SG_ID" -ForegroundColor Cyan
    
    # Ingress rules: Port 80 and Port 3000
    aws ec2 authorize-security-group-ingress --region "$AWS_REGION" --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --region "$AWS_REGION" --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --region "$AWS_REGION" --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0
}

# 4. Get Latest Amazon Linux 2023 AMI
Write-Host "[4/6] Finding latest Amazon Linux 2023 AMI..." -ForegroundColor Yellow
$AMI_ID = (aws ssm get-parameter --region "$AWS_REGION" --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --query "Parameter.Value" --output text).Trim()
Write-Host "AMI ID: $AMI_ID" -ForegroundColor Cyan

# 5. Build User Data script
Write-Host "[5/6] Generating User Data startup script..." -ForegroundColor Yellow
$COGNITO_USER_POOL_ID = "ap-south-1_kvrGS6pqU"
$COGNITO_CLIENT_ID = "3at640i6hd35suetn8ghugnjt2"
$DYNAMODB_TABLE = "NotionLitePages"
$S3_BUCKET = "notionlite-covers-771336637660-b7ay1r"

$userDataContent = @"
#!/usr/bin/env bash
set -xeuo pipefail
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== Initializing NotionLite on Amazon EC2 ==="
dnf update -y
dnf install -y git docker amazon-ssm-agent

systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

systemctl enable docker
systemctl start docker

# Clone repository
mkdir -p /opt/app
cd /opt/app
git clone https://github.com/KATRIXBEE/notion.git .

# Configure environment variables
cat <<'EOF' > .env.local
AWS_REGION=$AWS_REGION
COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
COGNITO_CLIENT_SECRET=
DYNAMODB_TABLE=$DYNAMODB_TABLE
S3_BUCKET=$S3_BUCKET
COOKIE_SECRET=notionlite_super_secret_cookie_key_32chars
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF

# Build Docker image
echo "=== Building NotionLite Docker container ==="
docker build -t notionlite:latest .

# Run container on port 80
echo "=== Launching NotionLite container on port 80 ==="
docker run -d \
  --name notionlite \
  --restart always \
  -p 80:3000 \
  --env-file .env.local \
  notionlite:latest

echo "=== NotionLite successfully deployed and running on port 80 ==="
"@

Set-Content -Path "ec2-userdata.sh" -Value $userDataContent

# 6. Launch EC2 Instance
Write-Host "[6/6] Launching EC2 instance ($INSTANCE_TYPE)..." -ForegroundColor Yellow
$INSTANCE_ID = (aws ec2 run-instances `
  --region "$AWS_REGION" `
  --image-id "$AMI_ID" `
  --instance-type "$INSTANCE_TYPE" `
  --iam-instance-profile Name="$PROFILE_NAME" `
  --security-group-ids "$SG_ID" `
  --subnet-id "$SUBNET_ID" `
  --user-data file://ec2-userdata.sh `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=notionlite-app}]' `
  --query "Instances[0].InstanceId" --output text).Trim()

Remove-Item -Force "ec2-userdata.sh" -ErrorAction SilentlyContinue

Write-Host "EC2 Instance launched: $INSTANCE_ID" -ForegroundColor Cyan
Write-Host "Waiting for EC2 instance to enter 'running' state..." -ForegroundColor Gray
aws ec2 wait instance-running --region "$AWS_REGION" --instance-ids "$INSTANCE_ID"

# Get Public IP & DNS
$PUBLIC_IP = (aws ec2 describe-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" --query "Reservations[0].Instances[0].PublicIpAddress" --output text).Trim()
$PUBLIC_DNS = (aws ec2 describe-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" --query "Reservations[0].Instances[0].PublicDnsName" --output text).Trim()

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL! NotionLite is Live on AWS" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Instance ID:  $INSTANCE_ID"
Write-Host "Public IPv4:  $PUBLIC_IP"
Write-Host "Public DNS:   $PUBLIC_DNS"
Write-Host ""
Write-Host "Your Live Public Web Application URL:" -ForegroundColor Cyan
Write-Host "http://$PUBLIC_IP" -ForegroundColor Yellow
Write-Host "http://$PUBLIC_DNS" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Note: It takes ~2-3 minutes for the instance to install Docker and build the container."
Write-Host "You can track progress in AWS Console -> EC2 -> Instances -> notionlite-app."
