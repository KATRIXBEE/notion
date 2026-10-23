#!/usr/bin/env bash
set -xeuo pipefail

# EC2 User Data script for Amazon Linux 2023 (t3.micro)
# Installs Docker, starts SSM agent, and creates the container runner script with awslogs driver

echo "=== Updating system and installing dependencies ==="
dnf update -y
dnf install -y docker amazon-ssm-agent

# Enable and start SSM agent (ensures port 22 SSH can remain completely closed)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Enable and start Docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Create deployment directory
mkdir -p /opt/notionlite
mkdir -p /opt/notionlite/env

# Create container launch script
cat <<'EOF' > /opt/notionlite/run.sh
#!/usr/bin/env bash
set -xeuo pipefail

IMAGE_NAME="${1:-notionlite:latest}"
AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region || echo "ap-south-1")

echo "Starting NotionLite container: $IMAGE_NAME"

# Run container with awslogs driver routing structured logs directly to CloudWatch
docker run -d \
  --name notionlite \
  --restart always \
  -p 80:3000 \
  --log-driver=awslogs \
  --log-opt awslogs-region="$AWS_REGION" \
  --log-opt awslogs-group="/notionlite/app" \
  --log-opt awslogs-create-group=true \
  --log-opt awslogs-stream="$(hostname)-$(date +%s)" \
  --env-file /opt/notionlite/env/app.env \
  "$IMAGE_NAME"

echo "NotionLite container started on port 80."
EOF

chmod +x /opt/notionlite/run.sh

echo "=== EC2 User Data bootstrap complete ==="
