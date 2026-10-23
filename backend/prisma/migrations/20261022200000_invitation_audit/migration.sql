-- AlterTable
ALTER TABLE "AdminInvitation" ADD COLUMN     "intendedEmail" TEXT;

-- CreateTable
CREATE TABLE "AdminEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminEvent_resourceId_createdAt_idx" ON "AdminEvent"("resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminEvent_actorId_createdAt_idx" ON "AdminEvent"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminEvent" ADD CONSTRAINT "AdminEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

