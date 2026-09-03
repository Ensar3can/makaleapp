SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY

BEGIN TRAN;

CREATE NONCLUSTERED INDEX [Article_status_language_publishedAt_idx]
ON [dbo].[Article]([status], [language], [publishedAt]);

CREATE NONCLUSTERED INDEX [Article_authorId_updatedAt_idx]
ON [dbo].[Article]([authorId], [updatedAt]);

CREATE NONCLUSTERED INDEX [Article_status_updatedAt_idx]
ON [dbo].[Article]([status], [updatedAt]);

CREATE NONCLUSTERED INDEX [AnalysisJob_status_queuedAt_idx]
ON [dbo].[AnalysisJob]([status], [queuedAt]);

CREATE NONCLUSTERED INDEX [Category_isActive_name_idx]
ON [dbo].[Category]([isActive], [name]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
    ROLLBACK TRAN;

THROW;

END CATCH;
