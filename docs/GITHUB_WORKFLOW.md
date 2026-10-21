# GDGOC Club Task Management System — GitHub Workflow & Integration

This document defines the Git conventions, PR requirements, task mapping, and GitHub Webhook integration for the project.

---

## 1. Branch Naming Conventions

Every member's branch must reference the associated Task ID. This allows both humans and backend webhook workers to accurately map Pull Requests to tasks.

### Accepted Branch Patterns:
- `feature/task-<task_id>`
- `fix/task-<task_id>`
- `chore/task-<task_id>`

### Example:
```bash
git checkout -b feature/task-cm1a2b3c4d5e
```

---

## 2. Commit & PR Conventions

### Commit Messages:
Follow Conventional Commits:
```
feat(board): add atomic task claim handler [task-cm1a2b3c4d5e]
fix(auth): prevent session race on logout
docs: update API contract and webhook setup
```

### Pull Request Title:
Always include the Task ID in brackets:
```
[TASK-cm1a2b3c4d5e] Implement responsive column layout
```

---

## 3. Member Development Workflow

1. **Pull Latest Main:**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create Feature Branch:**
   ```bash
   git checkout -b feature/task-<task_id>
   ```
3. **Claim Task on Board:**
   - Move task from **Free** to **Assigned** (or click "Claim" button).
4. **Develop & Test:**
   - Typecheck: `npm run typecheck`
   - Test: `npm run test`
5. **Push and Open PR:**
   - Push branch to origin.
   - Open Pull Request targeting `main`.
   - Complete the PR template checklist.
6. **Submit Task for Review:**
   - On the web board, click **"Submit PR"** on your task, paste the GitHub PR URL, and add any testing notes.
   - Task transitions to **In Review**.

---

## 4. Admin Review Workflow

1. Admin or Team Head reviews code in GitHub PR.
2. Checks automated tests and CI.
3. On the Club Task Board:
   - **Approve:** Marks task as **Done**, stamps `completedAt`, `approvedBy`, and calculates `isOnTime`.
   - **Send Back:** Sends task back to **In Progress** with specific review comments for the member to address.

> ⚠️ **Important Security Rule:** A task is **never** automatically marked as Done solely based on an untrusted webhook event or browser client request. An authorized Admin or designated Team Head must explicitly approve the submission.

---

## 5. GitHub Webhook Configuration

### Setting up Webhooks in GitHub:
1. Navigate to: **Repository Settings → Webhooks → Add webhook**
2. **Payload URL:** `https://<your-backend-domain>/api/v1/webhooks/github`
3. **Content type:** `application/json`
4. **Secret:** Configure the same secret defined in backend `GITHUB_WEBHOOK_SECRET`.
5. **Events to trigger:** Select **"Pull requests"** and **"Pings"**.

### Webhook Signature Verification:
- All incoming webhook payloads are verified using HMAC SHA-256 with the shared secret.
- Uses `crypto.timingSafeEqual` to prevent timing attacks.
- Irrelevant events are acknowledged with `200 OK` without triggering side effects.
