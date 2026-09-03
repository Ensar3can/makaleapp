SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;

BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[Session] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [tokenHash] NVARCHAR(64) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [revokedAt] DATETIME2,
    [ipHash] NVARCHAR(64),
    [userAgent] NVARCHAR(512),
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Session_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

CREATE TABLE [dbo].[AuthToken] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [purpose] NVARCHAR(32) NOT NULL,
    [tokenHash] NVARCHAR(64) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [consumedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [AuthToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AuthToken_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

CREATE TABLE [dbo].[LoginAttempt] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [succeeded] BIT NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [LoginAttempt_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE NONCLUSTERED INDEX [Session_userId_idx] ON [dbo].[Session]([userId]);
CREATE NONCLUSTERED INDEX [Session_expiresAt_idx] ON [dbo].[Session]([expiresAt]);
CREATE NONCLUSTERED INDEX [AuthToken_userId_purpose_idx] ON [dbo].[AuthToken]([userId], [purpose]);
CREATE NONCLUSTERED INDEX [LoginAttempt_email_createdAt_idx] ON [dbo].[LoginAttempt]([email], [createdAt]);

ALTER TABLE [dbo].[Session] ADD CONSTRAINT [Session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[AuthToken] ADD CONSTRAINT [AuthToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[AuthToken] ADD CONSTRAINT [CK_AuthToken_purpose] CHECK ([purpose] IN (N'EMAIL_VERIFICATION', N'PASSWORD_RESET'));

CREATE UNIQUE INDEX [UX_AuthToken_ActiveUserPurpose]
ON [dbo].[AuthToken]([userId], [purpose])
WHERE [consumedAt] IS NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
