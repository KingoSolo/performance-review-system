-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('RATING', 'TEXT', 'TASK_LIST');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'RATING';

-- CreateIndex
CREATE INDEX "questions_company_id_review_type_order_idx" ON "questions"("company_id", "review_type", "order");
