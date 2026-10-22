BEGIN;

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('USER', 'ADMIN', 'PRESIDENT', 'SYSTEM_OWNER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('FREE', 'ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskScope" AS ENUM ('TEAM', 'WHOLE_CLUB');

-- CreateEnum
CREATE TYPE "TaskAction" AS ENUM ('CREATED', 'CLAIMED', 'ASSIGNED', 'REASSIGNED', 'MOVED_STATUS', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'SENT_BACK', 'UPDATED', 'DELETED');

-- CreateEnum
CREATE TYPE "SubmissionOutcome" AS ENUM ('APPROVED', 'SENT_BACK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "SystemRole" NOT NULL DEFAULT 'USER',
    "position" TEXT,
    "githubUsername" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isTeamHead" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'FREE',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "scope" "TaskScope" NOT NULL DEFAULT 'WHOLE_CLUB',
    "teamId" TEXT,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "deadline" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "approvedById" TEXT,
    "isOnTime" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "TaskAction" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSubmission" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "note" TEXT,
    "prUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewerId" TEXT,
    "reviewComment" TEXT,
    "outcome" "SubmissionOutcome",
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminInvitation" (
    "id" TEXT NOT NULL,
    "hashedCode" TEXT NOT NULL,
    "intendedRole" "SystemRole" NOT NULL DEFAULT 'ADMIN',
    "intendedPosition" TEXT,
    "intendedTeamId" TEXT,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" TEXT NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubUsername_key" ON "User"("githubUsername");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "TeamMembership_userId_idx" ON "TeamMembership"("userId");

-- CreateIndex
CREATE INDEX "TeamMembership_teamId_idx" ON "TeamMembership"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_userId_teamId_key" ON "TeamMembership"("userId", "teamId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_teamId_idx" ON "Task"("teamId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_scope_idx" ON "Task"("scope");

-- CreateIndex
CREATE INDEX "Task_isDeleted_idx" ON "Task"("isDeleted");

-- CreateIndex
CREATE INDEX "Task_deadline_idx" ON "Task"("deadline");

-- CreateIndex
CREATE INDEX "Task_teamId_isDeleted_status_idx" ON "Task"("teamId", "isDeleted", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeId_isDeleted_status_idx" ON "Task"("assigneeId", "isDeleted", "status");

-- CreateIndex
CREATE INDEX "Task_completedById_completedAt_idx" ON "Task"("completedById", "completedAt");

-- CreateIndex
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");

-- CreateIndex
CREATE INDEX "Task_approvedById_idx" ON "Task"("approvedById");

-- CreateIndex
CREATE INDEX "TaskActivity_taskId_idx" ON "TaskActivity"("taskId");

-- CreateIndex
CREATE INDEX "TaskActivity_actorId_idx" ON "TaskActivity"("actorId");

-- CreateIndex
CREATE INDEX "TaskActivity_timestamp_idx" ON "TaskActivity"("timestamp");

-- CreateIndex
CREATE INDEX "TaskActivity_taskId_timestamp_idx" ON "TaskActivity"("taskId", "timestamp");

-- CreateIndex
CREATE INDEX "TaskSubmission_taskId_idx" ON "TaskSubmission"("taskId");

-- CreateIndex
CREATE INDEX "TaskSubmission_memberId_idx" ON "TaskSubmission"("memberId");

-- CreateIndex
CREATE INDEX "TaskSubmission_taskId_submittedAt_idx" ON "TaskSubmission"("taskId", "submittedAt");

-- CreateIndex
CREATE INDEX "TaskSubmission_reviewerId_idx" ON "TaskSubmission"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvitation_hashedCode_key" ON "AdminInvitation"("hashedCode");

-- CreateIndex
CREATE INDEX "AdminInvitation_expiresAt_idx" ON "AdminInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminInvitation_createdById_createdAt_idx" ON "AdminInvitation"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "AdminInvitation_usedById_idx" ON "AdminInvitation"("usedById");

-- CreateIndex
CREATE INDEX "AdminInvitation_intendedTeamId_idx" ON "AdminInvitation"("intendedTeamId");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "session"("expire");

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_intendedTeamId_fkey" FOREIGN KEY ("intendedTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Prisma 5 does not represent CHECK constraints or partial unique indexes.
-- Keep these invariants in migration SQL and exercise them against PostgreSQL.
ALTER TABLE "User" ADD CONSTRAINT "User_email_normalized"
  CHECK ("email" = lower(btrim("email")) AND length("email") > 0);

ALTER TABLE "Task" ADD CONSTRAINT "Task_scope_team_consistent"
  CHECK (("scope" = 'TEAM' AND "teamId" IS NOT NULL)
      OR ("scope" = 'WHOLE_CLUB' AND "teamId" IS NULL));
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignment_consistent"
  CHECK (("status" = 'FREE' AND "assigneeId" IS NULL)
      OR ("status" <> 'FREE' AND "assigneeId" IS NOT NULL));
ALTER TABLE "Task" ADD CONSTRAINT "Task_deletion_consistent"
  CHECK ("isDeleted" = ("deletedAt" IS NOT NULL));
ALTER TABLE "Task" ADD CONSTRAINT "Task_completion_consistent"
  CHECK (("status" = 'DONE' AND "completedAt" IS NOT NULL
          AND "completedById" IS NOT NULL AND "approvedById" IS NOT NULL AND "isOnTime" IS NOT NULL)
      OR ("status" <> 'DONE' AND "completedAt" IS NULL
          AND "completedById" IS NULL AND "approvedById" IS NULL AND "isOnTime" IS NULL));

ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_review_consistent"
  CHECK (("outcome" IS NULL AND "reviewerId" IS NULL AND "reviewedAt" IS NULL)
      OR ("outcome" IS NOT NULL AND "reviewerId" IS NOT NULL AND "reviewedAt" IS NOT NULL
          AND "reviewedAt" >= "submittedAt"));
CREATE UNIQUE INDEX "TaskSubmission_one_pending_per_task"
  ON "TaskSubmission" ("taskId") WHERE "outcome" IS NULL;

ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_role_allowed"
  CHECK ("intendedRole" IN ('ADMIN', 'PRESIDENT'));
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_expiry_valid"
  CHECK ("expiresAt" > "createdAt");
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_redemption_consistent"
  CHECK (("usedById" IS NULL AND "usedAt" IS NULL)
      OR ("usedById" IS NOT NULL AND "usedAt" IS NOT NULL
          AND "usedAt" >= "createdAt" AND "usedAt" <= "expiresAt"));

COMMIT;
