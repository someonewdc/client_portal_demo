-- CreateIndex
CREATE UNIQUE INDEX "RequestFile_requestId_fileName_key" ON "RequestFile"("requestId", "fileName");
