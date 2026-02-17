-- Transition user identifiers to UUID and introduce business authorization mapping.
-- Drop legacy local robot registry table first; runtime now fetches live robot data from Autoxing.
DROP TABLE IF EXISTS "Robot";

-- Convert User.id from TEXT to UUID (existing values must be valid UUID strings).
ALTER TABLE "User"
  ALTER COLUMN "id" TYPE UUID USING "id"::uuid;

-- Create business authorization tables.
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessUserMapping" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "BusinessUserMapping_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessUserMapping_businessId_idx" ON "BusinessUserMapping"("businessId");
CREATE INDEX "BusinessUserMapping_userId_idx" ON "BusinessUserMapping"("userId");
CREATE UNIQUE INDEX "BusinessUserMapping_userId_businessId_key" ON "BusinessUserMapping"("userId", "businessId");

ALTER TABLE "BusinessUserMapping"
  ADD CONSTRAINT "BusinessUserMapping_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BusinessUserMapping"
  ADD CONSTRAINT "BusinessUserMapping_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
