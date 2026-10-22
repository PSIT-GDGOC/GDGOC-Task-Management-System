-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleSubject" TEXT;

-- CreateTable
CREATE TABLE "OAuthAttempt" (
    "stateHash" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAttempt_pkey" PRIMARY KEY ("stateHash")
);

-- CreateIndex
CREATE INDEX "OAuthAttempt_expiresAt_idx" ON "OAuthAttempt"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");

