SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[AiUsageRecord] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [analysisRunId] UNIQUEIDENTIFIER NOT NULL,
    [provider] NVARCHAR(64) NOT NULL,
    [model] NVARCHAR(128) NOT NULL,
    [promptId] NVARCHAR(64) NOT NULL,
    [promptVersion] NVARCHAR(64) NOT NULL,
    [inputTokens] INT NOT NULL,
    [outputTokens] INT NOT NULL,
    [estimatedCost] DECIMAL(12, 6) NOT NULL,
    [latencyMs] INT NOT NULL,
    [recordedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AiUsageRecord_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AiUsageRecord_analysisRunId_fkey] FOREIGN KEY ([analysisRunId]) REFERENCES [dbo].[AnalysisRun]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [CK_AiUsageRecord_tokens] CHECK ([inputTokens] >= 0 AND [outputTokens] >= 0 AND [latencyMs] >= 0),
    CONSTRAINT [CK_AiUsageRecord_cost] CHECK ([estimatedCost] >= 0)
);

CREATE NONCLUSTERED INDEX [AiUsageRecord_analysisRunId_idx] ON [dbo].[AiUsageRecord]([analysisRunId]);
CREATE NONCLUSTERED INDEX [AiUsageRecord_recordedAt_idx] ON [dbo].[AiUsageRecord]([recordedAt]);
CREATE NONCLUSTERED INDEX [AiUsageRecord_promptId_recordedAt_idx] ON [dbo].[AiUsageRecord]([promptId], [recordedAt]);

CREATE TABLE [dbo].[OperationalEvent] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [kind] NVARCHAR(32) NOT NULL,
    [requestId] NVARCHAR(64) NULL,
    [userId] UNIQUEIDENTIFIER NULL,
    [articleId] UNIQUEIDENTIFIER NULL,
    [analysisRunId] UNIQUEIDENTIFIER NULL,
    [jobId] UNIQUEIDENTIFIER NULL,
    [durationMs] INT NULL,
    [status] NVARCHAR(64) NOT NULL,
    [message] NVARCHAR(500) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [OperationalEvent_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CK_OperationalEvent_kind] CHECK ([kind] IN (N'api_error', N'worker_failure', N'ai_provider_failure', N'database_failure', N'slow_query')),
    CONSTRAINT [CK_OperationalEvent_duration] CHECK ([durationMs] IS NULL OR [durationMs] >= 0)
);

CREATE NONCLUSTERED INDEX [OperationalEvent_kind_createdAt_idx] ON [dbo].[OperationalEvent]([kind], [createdAt]);
CREATE NONCLUSTERED INDEX [OperationalEvent_createdAt_idx] ON [dbo].[OperationalEvent]([createdAt]);

CREATE TABLE [dbo].[SystemHeartbeat] (
    [component] NVARCHAR(32) NOT NULL,
    [lastSeenAt] DATETIME2 NOT NULL,
    [status] NVARCHAR(32) NOT NULL,
    CONSTRAINT [SystemHeartbeat_pkey] PRIMARY KEY CLUSTERED ([component])
);

CREATE NONCLUSTERED INDEX [AnalysisRun_createdAt_idx] ON [dbo].[AnalysisRun]([createdAt]);
CREATE NONCLUSTERED INDEX [AnalysisRun_status_createdAt_idx] ON [dbo].[AnalysisRun]([status], [createdAt]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
    ROLLBACK TRAN;

THROW;

END CATCH;
