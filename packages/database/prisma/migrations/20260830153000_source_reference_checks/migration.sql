SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[SourceReference] ADD CONSTRAINT [CK_SourceReference_sourceType]
CHECK ([sourceType] IN (N'web', N'academic', N'doi', N'citation', N'other'));

ALTER TABLE [dbo].[SourceReference] ADD CONSTRAINT [CK_SourceReference_verificationStatus]
CHECK ([verificationStatus] IN (N'verified', N'partially_verified', N'unverified', N'suspicious', N'broken'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
    ROLLBACK TRAN;

THROW;

END CATCH;
