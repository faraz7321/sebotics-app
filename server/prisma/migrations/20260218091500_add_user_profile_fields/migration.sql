ALTER TABLE "User"
  ADD COLUMN "firstName" VARCHAR(10),
  ADD COLUMN "lastName" VARCHAR(10),
  ADD COLUMN "email" VARCHAR(254);

UPDATE "User"
SET
  "firstName" = COALESCE(NULLIF(LEFT("firstName", 10), ''), 'User'),
  "lastName" = COALESCE(NULLIF(LEFT("lastName", 10), ''), 'Account'),
  "email" = COALESCE(
    NULLIF("email", ''),
    CONCAT(
      LOWER(LEFT(REGEXP_REPLACE(COALESCE("username", 'user'), '[^A-Za-z0-9]', '', 'g'), 24)),
      '+',
      REPLACE(LEFT("id"::text, 8), '-', ''),
      '@local.invalid'
    )
  );

ALTER TABLE "User"
  ALTER COLUMN "firstName" SET NOT NULL,
  ALTER COLUMN "lastName" SET NOT NULL,
  ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
