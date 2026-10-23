# NotionLite — Deployment Guide

This guide details the step-by-step production deployment for **NotionLite** on AWS.

---

## Architecture Overview

```
Client (HTTPS)
   └── Amazon CloudFront
         └── Amazon EC2 (t3.micro, Amazon Linux 2023, Port 80 from CloudFront only, Port 22 closed)
               └── Docker (Next.js standalone + awslogs driver)
                     ├── Amazon DynamoDB (NotionLitePages)
                     ├── Amazon S3 (notionlite-covers)
                     └── Amazon Cognito (User Pool & App Client)
```

---

## Step 1: Provision AWS Resources

Run the provisioning script using your local AWS CLI profile:

```bash
chmod +x scripts/create-aws-resources.sh scripts/destroy-aws-resources.sh
./scripts/create-aws-resources.sh
```

This script provisions:
- DynamoDB table `NotionLitePages` (on-demand)
- S3 private bucket `notionlite-covers-<account>-<suffix>` with CORS
- Cognito User Pool `notionlite-users` and client `notionlite-web-client`
- ECR repository `notionlite`
- CloudWatch log group `/notionlite/app`
- SNS topic `notionlite-cpu-alarms`

Subscribe your email to CPU alerts:
```bash
aws sns subscribe \
  --topic-arn <SNS_TOPIC_ARN> \
  --protocol email \
  --notification-endpoint developer@yourdomain.com
```

---

## Step 2: Create EC2 IAM Role

Create an IAM role for the EC2 instance using the least-privilege policy:

```bash
# 1. Create Trust Policy
cat <<'EOF' > /tmp/ec2-trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name NotionLiteEC2Role \
  --assume-role-policy-document file:///tmp/ec2-trust-policy.json

# 2. Attach Custom Policy
aws iam put-role-policy \
  --role-name NotionLiteEC2Role \
  --policy-name NotionLiteEC2Permissions \
  --policy-document file://infra/iam/ec2-role-policy.json

# 3. Create Instance Profile
aws iam create-instance-profile --instance-profile-name NotionLiteInstanceProfile
aws iam add-role-to-instance-profile \
  --instance-profile-name NotionLiteInstanceProfile \
  --role-name NotionLiteEC2Role
```

---

## Step 3: Configure Security Group (Port 22 Closed)

1. Find the **CloudFront Managed Prefix List ID** in your region:
```bash
CF_PREFIX_LIST_ID=$(aws ec2 describe-managed-prefix-lists \
  --filters "Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing" \
  --query "PrefixLists[0].PrefixListId" \
  --output text)
echo "CloudFront Prefix List: $CF_PREFIX_LIST_ID"
```

2. Create a security group:
```bash
VPC_ID=$(aws ec2 describe-vpcs --filter "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)

SG_ID=$(aws ec2 create-security-group \
  --group-name "notionlite-ec2-sg" \
  --description "Inbound HTTP from CloudFront only; SSH port 22 closed" \
  --vpc-id "$VPC_ID" \
  --query "GroupId" \
  --output text)

# Allow port 80 ONLY from CloudFront managed prefix list
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --ip-permissions IpProtocol=tcp,FromPort=80,ToPort=80,PrefixListIds=[{PrefixListId=$CF_PREFIX_LIST_ID}]
```

> **Security Note:** Port 22 is intentionally NOT open. All debugging, logs, and deployment happen via **AWS Systems Manager (SSM)**.

---

## Step 4: Launch EC2 Instance

Launch an Amazon Linux 2023 instance using the User Data script:

```bash
AMI_ID=$(aws ssm get-parameter \
  --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --query "Parameter.Value" \
  --output text)

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type t3.micro \
  --iam-instance-profile Name=NotionLiteInstanceProfile \
  --security-group-ids "$SG_ID" \
  --user-data file://scripts/ec2-user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=notionlite-app}]' \
  --query "Instances[0].InstanceId" \
  --output text)

echo "Launched EC2 Instance: $INSTANCE_ID"
```

Wait for the instance to become healthy in SSM:
```bash
aws ssm wait instance-online --instance-ids "$INSTANCE_ID"
```

---

## Step 5: Configure CloudWatch CPU Alarm

Create a CloudWatch alarm that notifies the SNS topic when CPU > 70%:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "notionlite-high-cpu-alarm" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 70.0 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=InstanceId,Value="$INSTANCE_ID" \
  --evaluation-periods 2 \
  --alarm-actions "$SNS_TOPIC_ARN"
```

---

## Step 6: Create CloudFront Distribution

1. Obtain the public DNS of your EC2 instance:
```bash
EC2_DNS=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query "Reservations[0].Instances[0].PublicDnsName" --output text)
```

2. Create a CloudFront distribution pointing to `$EC2_DNS` on HTTP port 80:
- **Origin Protocol**: HTTP only
- **Cache Policy**: `Managed-CachingDisabled` (`4135ea2d-6df8-44a3-9df3-4b5a84be39ad`)
- **Origin Request Policy**: `Managed-AllViewerAndCloudFrontHeaders-2022-06` (`33f36d7e-f396-46d0-ad2e-0459b70d795b`) to forward cookies, authorization headers, and host headers.

---

## Step 7: Configure GitHub Actions CI/CD (OIDC)

### 1. Create GitHub OIDC Provider in IAM (if not present)
```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" || true
```

### 2. Create GitHub Actions Role
Create a trust policy for your GitHub repository (`github-trust.json`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<YOUR_GITHUB_USER>/<REPO>:*"
        }
      }
    }
  ]
}
```

Attach `infra/iam/github-oidc-policy.json` to this role.

### 3. Add GitHub Repository Secrets
Under **Settings > Secrets and variables > Actions**:
- `AWS_ROLE_ARN`: ARN of the GitHub OIDC role
- `AWS_REGION`: `ap-south-1` (or your configured region)
- `EC2_INSTANCE_ID`: Your EC2 instance ID
- `APP_HOST`: CloudFront domain (or EC2 Public DNS for initial testing)

---

## Step 8: Verification & Health Check

Test the live deployment:
```bash
curl -i https://<YOUR_CLOUDFRONT_DOMAIN>/api/health
```
Expected response:
```json
HTTP/2 200
content-type: application/json

{"status":"ok"}
```

---

## Rollback Procedure

If a deployed version has an issue:
1. Identify the previous working commit SHA in GitHub.
2. In the AWS console (or via SSM CLI), redeploy the specific tagged image:
```bash
aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker stop notionlite || true", "docker rm notionlite || true", "/opt/notionlite/run.sh <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/notionlite:<PREVIOUS_COMMIT_SHA>"]'
```

---

## Teardown (Stop Billing)

To delete all provisioned resources and stop any ongoing AWS charges:

```bash
export S3_BUCKET="<your-bucket-name>"
export COGNITO_USER_POOL_ID="<your-user-pool-id>"
export SNS_TOPIC_ARN="<your-sns-topic-arn>"

./scripts/destroy-aws-resources.sh
aws ec2 terminate-instances --instance-ids "$INSTANCE_ID"
```

---

## Billing Warning

> **Estimated monthly cost**:
> - **EC2 t3.micro**: Eligible for AWS Free Tier (750 hrs/month for first 12 months). Afterward: ~$7.50/month.
> - **DynamoDB**: On-Demand pricing (free tier includes 25 GB storage + 2.5M reads/writes).
> - **S3**: 5 GB free tier, then standard per-GB pricing.
> - **Cognito**: 50,000 monthly active users (MAUs) free tier.
> - **CloudFront**: 1 TB free tier outbound data transfer.
> - **CloudWatch**: Free tier covers 10 metrics + 5GB logs.
>
> Remember to terminate the EC2 instance and run `scripts/destroy-aws-resources.sh` when testing is complete.
