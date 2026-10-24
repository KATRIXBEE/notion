import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

ASSETS_DIR = os.path.join(os.getcwd(), "report_assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

# Common styling
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10

def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    # Background canvas
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    # Title
    ax.text(5, 6.6, "NotionLite: High-Level AWS Cloud Architecture", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#1e293b')

    # Boxes: Client
    client_box = patches.FancyBboxPatch((0.5, 3.8), 2.0, 1.6, boxstyle="round,pad=0.1", ec="#334155", fc="#f1f5f9", lw=1.5)
    ax.add_patch(client_box)
    ax.text(1.5, 4.8, "Client Browser", ha='center', va='center', fontweight='bold', fontsize=11, color='#0f172a')
    ax.text(1.5, 4.3, "• Next.js App Shell\n• rough.js Canvas\n• Tiptap Block Editor\n• httpOnly Cookies", ha='center', va='center', fontsize=8, color='#475569')

    # Route 53 / CloudFront
    cf_box = patches.FancyBboxPatch((3.2, 3.8), 1.8, 1.6, boxstyle="round,pad=0.1", ec="#2563eb", fc="#eff6ff", lw=1.5)
    ax.add_patch(cf_box)
    ax.text(4.1, 4.8, "Amazon CloudFront", ha='center', va='center', fontweight='bold', fontsize=10, color='#1e40af')
    ax.text(4.1, 4.2, "• Global Edge Network\n• SSL/TLS Termination\n• DDoS Mitigation\n• Static Caching", ha='center', va='center', fontsize=8, color='#3b82f6')

    # Compute: EC2 Docker
    ec2_box = patches.FancyBboxPatch((5.7, 3.5), 2.2, 2.2, boxstyle="round,pad=0.1", ec="#d97706", fc="#fffbeb", lw=1.5)
    ax.add_patch(ec2_box)
    ax.text(6.8, 5.3, "Amazon EC2 (t3.micro)", ha='center', va='center', fontweight='bold', fontsize=10, color='#92400e')
    ax.text(6.8, 4.4, "Next.js Standalone Docker\n• Node.js 20 Alpine\n• App Router API\n• IAM Instance Role\n• AWS SDK v3 Clients", ha='center', va='center', fontsize=8, color='#78350f')

    # AWS Services on the right
    # Cognito
    cog_box = patches.FancyBboxPatch((8.4, 4.8), 1.5, 1.2, boxstyle="round,pad=0.1", ec="#7c3aed", fc="#f5f3ff", lw=1.5)
    ax.add_patch(cog_box)
    ax.text(9.15, 5.6, "Amazon Cognito", ha='center', va='center', fontweight='bold', fontsize=9, color='#5b21b6')
    ax.text(9.15, 5.1, "User Pool & Client\nJWT Tokens", ha='center', va='center', fontsize=7.5, color='#6d28d9')

    # DynamoDB
    ddb_box = patches.FancyBboxPatch((8.4, 3.2), 1.5, 1.2, boxstyle="round,pad=0.1", ec="#059669", fc="#ecfdf5", lw=1.5)
    ax.add_patch(ddb_box)
    ax.text(9.15, 4.0, "Amazon DynamoDB", ha='center', va='center', fontweight='bold', fontsize=9, color='#065f46')
    ax.text(9.15, 3.5, "NotionLitePages\nOn-Demand, ULID PK", ha='center', va='center', fontsize=7.5, color='#047857')

    # S3
    s3_box = patches.FancyBboxPatch((8.4, 1.6), 1.5, 1.2, boxstyle="round,pad=0.1", ec="#dc2626", fc="#fef2f2", lw=1.5)
    ax.add_patch(s3_box)
    ax.text(9.15, 2.4, "Amazon S3", ha='center', va='center', fontweight='bold', fontsize=9, color='#991b1b')
    ax.text(9.15, 1.9, "Private Covers Bucket\nPresigned PUT/GET", ha='center', va='center', fontsize=7.5, color='#b91c1c')

    # ECR & CloudWatch Bottom
    cw_box = patches.FancyBboxPatch((5.7, 1.6), 2.2, 1.2, boxstyle="round,pad=0.1", ec="#475569", fc="#f8fafc", lw=1.2)
    ax.add_patch(cw_box)
    ax.text(6.8, 2.4, "Observability & Registry", ha='center', va='center', fontweight='bold', fontsize=9, color='#1e293b')
    ax.text(6.8, 1.9, "• Amazon ECR (Images)\n• CloudWatch (awslogs)\n• SSM Run Command", ha='center', va='center', fontsize=8, color='#475569')

    # Arrows
    arrow_props = dict(arrowstyle="->", color="#334155", lw=1.5)
    ax.annotate("", xy=(3.2, 4.6), xytext=(2.5, 4.6), arrowprops=arrow_props)
    ax.annotate("", xy=(5.7, 4.6), xytext=(5.0, 4.6), arrowprops=arrow_props)
    ax.annotate("", xy=(8.4, 5.4), xytext=(7.9, 5.0), arrowprops=dict(arrowstyle="<->", color="#7c3aed", lw=1.5))
    ax.annotate("", xy=(8.4, 3.8), xytext=(7.9, 4.2), arrowprops=dict(arrowstyle="<->", color="#059669", lw=1.5))
    ax.annotate("", xy=(8.4, 2.2), xytext=(7.9, 3.6), arrowprops=dict(arrowstyle="<->", color="#dc2626", lw=1.5))
    ax.annotate("", xy=(6.8, 3.5), xytext=(6.8, 2.8), arrowprops=dict(arrowstyle="<->", color="#475569", lw=1.2))

    # Direct client to S3 arrow for presigned PUT
    ax.annotate("Direct S3 PUT (Presigned)", xy=(8.4, 1.8), xytext=(2.5, 3.8),
                arrowprops=dict(arrowstyle="->", color="#dc2626", lw=1.2, linestyle="--", connectionstyle="arc3,rad=-0.2"),
                fontsize=8, color="#dc2626", fontweight='bold')

    plt.tight_layout()
    output_path = os.path.join(ASSETS_DIR, "fig1_architecture.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", output_path)

def generate_auth_flow_diagram():
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    ax.text(5, 5.6, "Amazon Cognito Authentication & Token Lifecycle", 
            ha='center', va='center', fontsize=13, fontweight='bold', color='#1e293b')

    cols = ["Client Browser", "Next.js API Route", "Amazon Cognito", "Client Cookie Jar"]
    col_x = [1.2, 3.8, 6.6, 9.0]
    for x, title in zip(col_x, cols):
        ax.plot([x, x], [0.8, 5.0], color='#cbd5e1', linestyle='--', lw=1.2)
        ax.text(x, 5.15, title, ha='center', va='center', fontweight='bold', fontsize=9.5, 
                bbox=dict(boxstyle="square,pad=0.3", fc="#f1f5f9", ec="#94a3b8"))

    steps = [
        (4.4, 1.2, 3.8, "1. POST /api/auth/login {email, password}", "#2563eb", "->"),
        (3.8, 3.8, 6.6, "2. InitiateAuthCommand(USER_PASSWORD_AUTH)", "#7c3aed", "->"),
        (3.2, 6.6, 3.8, "3. Return IdToken, AccessToken, RefreshToken", "#7c3aed", "->"),
        (2.6, 3.8, 9.0, "4. setAuthCookies(res, tokens) [httpOnly, SameSite=Lax]", "#059669", "->"),
        (2.0, 3.8, 1.2, "5. Response 200 { success: true, user }", "#059669", "->"),
        (1.4, 1.2, 3.8, "6. Authenticated API Request (Cookie attached)", "#334155", "->"),
        (0.8, 3.8, 3.8, "7. verifyAuth(): CognitoJwtVerifier.verify(idToken)", "#d97706", "self"),
    ]

    for y, x1, x2, label, color, direction in steps:
        if direction == "self":
            ax.annotate(label, xy=(x1, y), xytext=(x1 + 0.1, y - 0.25),
                        arrowprops=dict(arrowstyle="->", color=color, lw=1.2),
                        fontsize=8, fontweight='bold', color=color)
        else:
            ax.annotate("", xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle=direction, color=color, lw=1.4))
            mid_x = (x1 + x2) / 2
            ax.text(mid_x, y + 0.12, label, ha='center', va='bottom', fontsize=7.8, fontweight='bold', color=color)

    plt.tight_layout()
    output_path = os.path.join(ASSETS_DIR, "fig2_auth_flow.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", output_path)

def generate_dynamodb_schema_diagram():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.5)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    ax.text(5, 6.1, "Amazon DynamoDB: Single-Table Architecture (NotionLitePages)", 
            ha='center', va='center', fontsize=13, fontweight='bold', color='#1e293b')

    schema_box = patches.FancyBboxPatch((0.5, 2.8), 9.0, 2.9, boxstyle="round,pad=0.1", ec="#059669", fc="#f0fdf4", lw=1.5)
    ax.add_patch(schema_box)

    headers = ["Attribute", "Type", "Key Role", "Description / Constraints", "Example Value"]
    col_x = [1.2, 2.5, 3.8, 6.2, 8.5]
    y_start = 5.3

    for x, h in zip(col_x, headers):
        ax.text(x, y_start, h, ha='center', va='center', fontweight='bold', fontsize=9, color='#065f46')
    ax.plot([0.7, 9.3], [y_start - 0.25, y_start - 0.25], color='#10b981', lw=1.2)

    rows = [
        ("userId", "String (S)", "Partition Key (PK)", "Cognito immutable user UUID", "usr_9d81f4a2-11e9"),
        ("pageId", "String (S)", "Sort Key (SK)", "Chronologically sortable 26-char ULID", "01JAX000000000000000000001"),
        ("parentId", "String (S | null)", "Attribute", "Enables 1-level hierarchical nesting", "null or parent pageId"),
        ("title", "String (S)", "Attribute", "Indexed via DynamoDB FilterExpression", "Welcome to NotionLite 🚀"),
        ("content", "String (S)", "Attribute", "Serialized ProseMirror / Tiptap JSON doc", "{\"type\":\"doc\",\"content\":[...]}"),
        ("icon / coverKey", "String (S | null)", "Attribute", "Emoji character or private S3 object key", "🚀 / usr_123/cover_456.jpg"),
        ("isDeleted / isFav", "Boolean (BOOL)", "Attribute", "Soft delete flag & favorites toggle", "false / true"),
        ("createdAt / updAt", "String (S)", "Attribute", "ISO 8601 UTC timestamp", "2026-10-23T14:30:00.000Z"),
    ]

    curr_y = y_start - 0.55
    for r in rows:
        for x, val in zip(col_x, r):
            ax.text(x, curr_y, val, ha='center', va='center', fontsize=7.5, color='#1e293b')
        curr_y -= 0.28

    pattern_box = patches.FancyBboxPatch((0.5, 0.4), 9.0, 2.1, boxstyle="round,pad=0.1", ec="#2563eb", fc="#eff6ff", lw=1.2)
    ax.add_patch(pattern_box)
    ax.text(5, 2.2, "Core Query Access Patterns Supported", ha='center', va='center', fontweight='bold', fontsize=9.5, color='#1e40af')

    patterns = [
        "1. List All Active User Pages: Query(PK=userId, Filter: isDeleted=false, ScanIndexForward=false)",
        "2. Fetch Specific Page: GetItem(PK=userId, SK=pageId) with microsecond latency",
        "3. Soft-Delete Page: UpdateItem(PK=userId, SK=pageId, SET isDeleted=true, updatedAt=now())",
        "4. View Trash Archive: Query(PK=userId, Filter: isDeleted=true)",
        "5. Substring Page Search: Query(PK=userId, Filter: contains(title, :query))",
    ]
    p_y = 1.8
    for p in patterns:
        ax.text(0.8, p_y, p, ha='left', va='center', fontsize=8, color='#1e3a8a')
        p_y -= 0.32

    plt.tight_layout()
    output_path = os.path.join(ASSETS_DIR, "fig3_dynamodb_schema.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", output_path)

def generate_test_metrics_chart():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), dpi=300)
    fig.patch.set_facecolor('#ffffff')

    suites = ['Pages API', 'Auth Helpers', 'S3 Uploads', 'Search API']
    tests_count = [6, 6, 3, 2]
    colors = ['#2563eb', '#7c3aed', '#059669', '#d97706']

    bars = ax1.bar(suites, tests_count, color=colors, width=0.55, edgecolor='#334155', lw=1.2)
    ax1.set_title("Vitest Unit & Integration Tests (17/17 Passed)", fontsize=11, fontweight='bold', color='#1e293b')
    ax1.set_ylabel("Number of Tests", fontsize=9, fontweight='bold')
    ax1.set_ylim(0, 8)
    ax1.grid(axis='y', linestyle='--', alpha=0.5)

    for bar in bars:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 0.2, f"{int(yval)} Passed", ha='center', va='bottom', fontsize=8.5, fontweight='bold')

    categories = ['Design System\n(22 rough.js)', 'AWS Serverless\n(Cognito/DDB/S3)', 'DevOps & CI/CD\n(Docker/GitHub)', 'Editor & Shell\n(Tiptap/Pages)']
    sizes = [30, 35, 20, 15]
    donut_colors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6']

    wedges, texts, autotexts = ax2.pie(sizes, labels=categories, autopct='%1.0f%%', startangle=140, 
                                       colors=donut_colors, textprops=dict(fontsize=8, color='#0f172a'),
                                       wedgeprops=dict(width=0.4, edgecolor='#ffffff', lw=2))
    for at in autotexts:
        at.set_fontweight('bold')
    ax2.set_title("Codebase Architectural Distribution", fontsize=11, fontweight='bold', color='#1e293b')

    plt.tight_layout()
    output_path = os.path.join(ASSETS_DIR, "fig4_test_metrics.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", output_path)

def generate_cicd_pipeline_diagram():
    fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    ax.text(5, 4.6, "Automated CI/CD Deployment Pipeline (.github/workflows/deploy.yml)", 
            ha='center', va='center', fontsize=12, fontweight='bold', color='#1e293b')

    stages = [
        ("1. Commit & Push", "Developer pushes\nto 'main' branch\non GitHub", "#f8fafc", "#475569"),
        ("2. Validation Gate", "• ESLint verification\n• 17 Vitest tests\n• Standalone build", "#eff6ff", "#2563eb"),
        ("3. AWS OIDC Auth", "AssumeRole via\nGitHub OIDC\n(Zero secrets stored)", "#f5f3ff", "#7c3aed"),
        ("4. Container Image", "Docker Build\n& Push to Amazon\nECR Repository", "#fffbeb", "#d97706"),
        ("5. EC2 SSM Deploy", "AWS SSM RunCommand:\nPull image & docker run\nVerify /api/health", "#ecfdf5", "#059669"),
    ]

    box_w = 1.6
    box_h = 2.4
    x_positions = [0.4, 2.3, 4.2, 6.1, 8.0]

    for (title, desc, fc, ec), x in zip(stages, x_positions):
        box = patches.FancyBboxPatch((x, 1.2), box_w, box_h, boxstyle="round,pad=0.1", ec=ec, fc=fc, lw=1.5)
        ax.add_patch(box)
        ax.text(x + box_w/2, 3.2, title, ha='center', va='center', fontweight='bold', fontsize=8.5, color=ec)
        ax.plot([x + 0.1, x + box_w - 0.1], [3.0, 3.0], color=ec, lw=1)
        ax.text(x + box_w/2, 2.1, desc, ha='center', va='center', fontsize=7.2, color='#334155')

    for i in range(len(x_positions) - 1):
        x1 = x_positions[i] + box_w
        x2 = x_positions[i+1]
        ax.annotate("", xy=(x2, 2.4), xytext=(x1, 2.4),
                    arrowprops=dict(arrowstyle="->", color="#334155", lw=1.5))

    plt.tight_layout()
    output_path = os.path.join(ASSETS_DIR, "fig5_cicd_pipeline.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved:", output_path)

if __name__ == "__main__":
    generate_architecture_diagram()
    generate_auth_flow_diagram()
    generate_dynamodb_schema_diagram()
    generate_test_metrics_chart()
    generate_cicd_pipeline_diagram()
    print("All diagrams generated successfully!")
