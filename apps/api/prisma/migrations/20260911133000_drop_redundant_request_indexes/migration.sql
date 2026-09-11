-- Unique composites already cover requestId lookups; nobody filters Request by status.
DROP INDEX "Request_status_idx";
DROP INDEX "RequestSpecLine_requestId_idx";
DROP INDEX "RequestFile_requestId_idx";
DROP INDEX "RequestStageHistory_requestId_idx";
