SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[ModerationReview] ADD [articleVersionId] UNIQUEIDENTIFIER NOT NULL;

CREATE NONCLUSTERED INDEX [ModerationReview_articleVersionId_idx] ON [dbo].[ModerationReview]([articleVersionId]);

DROP INDEX [ModerationReview_articleId_idx] ON [dbo].[ModerationReview];

CREATE NONCLUSTERED INDEX [ModerationReview_articleId_createdAt_idx] ON [dbo].[ModerationReview]([articleId], [createdAt]);

ALTER TABLE [dbo].[ModerationReview] ADD CONSTRAINT [ModerationReview_articleVersionId_fkey]
FOREIGN KEY ([articleVersionId]) REFERENCES [dbo].[ArticleVersion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE NONCLUSTERED INDEX [Article_currentContentHash_idx] ON [dbo].[Article]([currentContentHash]);

ALTER TABLE [dbo].[ModerationReview] ADD CONSTRAINT [CK_ModerationReview_decision]
CHECK ([decision] IN (N'APPROVE', N'REQUEST_REVISION', N'REJECT'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
    ROLLBACK TRAN;

THROW;

END CATCH;
