-- CreateTable
CREATE TABLE IF NOT EXISTS "RoleKey" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "position" TEXT NOT NULL,
    "keyCode" TEXT NOT NULL,
    "label" TEXT,
    "teamSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RoleKey_position_key" ON "RoleKey"("position");
