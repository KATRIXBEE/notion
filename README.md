# NotionLite 📝

A simplified Notion clone featuring a **hand-drawn sketch UI kit** (off-white paper, wobbly ink borders via rough.js, handwritten typography via Patrick Hand, Phosphor icons) and a **100% AWS backend** (Cognito, DynamoDB, S3, CloudFront, EC2, CloudWatch, ECR).

---

## Features

1. **Authentication**: Cognito signup, confirmation code verification, login, logout, session refresh. Custom forms (no hosted UI). HttpOnly, Secure, SameSite=Lax cookies.
2. **Page Tree & Nesting**: Sidebar page tree with 1-level nested sub-pages, create, rename, and soft delete.
3. **Block Editor (Tiptap)**: Paragraph, heading 1/2/3, bullet list, numbered list, interactive to-do list, quote, code block, horizontal divider.
4. **Slash Command Menu**: Type `/` to insert any block format, styled like the hand-drawn sketch select dropdown.
5. **Debounced Auto-Save**: 800ms debounce with top bar "Saving…" / "Saved" status indicator.
6. **Emoji Picker**: Custom icon per page from curated sketch emoji picker.
7. **Favorites**: Star any page to pin it to the Favorites view.
8. **Trash Management**: Soft-delete pages, view paginated trash, Restore, or Delete forever.
9. **Search**: Instant title search using DynamoDB partition query with `contains(title)`.
10. **Cover Images**: Upload cover images directly to private S3 bucket via presigned PUT URLs (max 2 MB, images only) and view via presigned GET URLs.
11. **Dark Mode ("Chalkboard")**: Inverts paper (`#F7F5F1`) and ink (`#3A2F30`) to dark chalkboard aesthetic.
12. **Home Dashboard**: Dynamic greeting, interactive activity calendar with page creation dots, and 3 FlipCounters (Total pages, To-dos done, Words written).

---

## Design System

All UI components are custom built with `rough.js` and located in `components/sketch`:
- `SketchBox` (base container with stable seed and wobbly ink borders)
- `SketchButton` (outlined) & `SketchButtonDark` (solid ink fill, paper text)
- `IconButton` (square sketch button)
- `SketchInput` (with magnifier icon)
- `SketchSelect` (dropdown with up/down chevrons)
- `SketchTextarea`, `Stepper` (+/− buttons), `Toggle` (pill with OFF/ON labels)
- `Tabs` (active tab merges seamlessly with panel)
- `Slider` (horizontal & vertical variants with round knob), `Dial` (circular knob)
- `Tooltip` (dark sketch bubble), `Calendar` (month grid, today = filled dark square)
- `Pagination` (circled numbers, active = larger filled circle)
- `FlipCounter` & `FlipClock` (digit cards with colon separators)
- `ProfileCard`, `ListButton`, `ProgressDots`, `Skeleton`

Visit `/design` in your browser to inspect the full design system gallery comparing every component against the reference wireframe.

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- AWS CLI configured with your credentials (`aws configure`)

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Provision AWS Infrastructure
Run the provisioning script to create DynamoDB, S3, Cognito, ECR, CloudWatch Log Group, and SNS topic:
```bash
chmod +x scripts/create-aws-resources.sh scripts/destroy-aws-resources.sh
./scripts/create-aws-resources.sh
```

Copy the generated values into your `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local Next.js development server |
| `npm run build` | Build standalone production bundle |
| `npm run start` | Start standalone production server |
| `npm run lint` | Run ESLint validation |
| `npm run test` | Run Vitest unit & integration test suite |
| `npm run seed` | Seed 3 sample pages in DynamoDB for testing |

---

## Environment Variables

See `.env.example` for the complete list:
- `AWS_REGION`: AWS region (default: `ap-south-1`)
- `COGNITO_USER_POOL_ID`: Cognito user pool ID
- `COGNITO_CLIENT_ID`: Cognito app client ID
- `COGNITO_CLIENT_SECRET`: Optional client secret if configured
- `DYNAMODB_TABLE`: DynamoDB table name (default: `NotionLitePages`)
- `S3_BUCKET`: S3 bucket name for cover images
- `COOKIE_SECRET`: Secret used for signing cookies

---

## Deployment & DevOps

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions:
- Docker multi-stage build (`Dockerfile`)
- GitHub Actions CI/CD with AWS OIDC authentication (`.github/workflows/deploy.yml`)
- EC2 User Data bootstrap (`scripts/ec2-user-data.sh`)
- CloudFront distribution configuration (port 80 only from prefix list, port 22 closed)
- CloudWatch CPU alarm (> 70%) notifying SNS email topic
- Teardown & billing management (`scripts/destroy-aws-resources.sh`)
