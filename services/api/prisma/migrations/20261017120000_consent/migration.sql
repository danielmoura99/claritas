-- Plano 02 / LGPD: registro do aceite dos Termos de Uso e da Política de Privacidade (aditiva).

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_documentType_idx" ON "ConsentRecord"("userId", "documentType");

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

