SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;

BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [passwordHash] NVARCHAR(255) NOT NULL,
    [role] NVARCHAR(16) NOT NULL,
    [status] NVARCHAR(16) NOT NULL,
    [emailVerifiedAt] DATETIME2,
    [lastLoginAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Profile] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [displayName] NVARCHAR(80) NOT NULL,
    [username] NVARCHAR(160) NOT NULL,
    [bio] NVARCHAR(500) NOT NULL,
    [avatarUrl] NVARCHAR(2048),
    [websiteUrl] NVARCHAR(2048),
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Profile_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Profile_userId_key] UNIQUE NONCLUSTERED ([userId]),
    CONSTRAINT [Profile_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(80) NOT NULL,
    [slug] NVARCHAR(160) NOT NULL,
    [description] NVARCHAR(400) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [Category_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Tag] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(40) NOT NULL,
    [slug] NVARCHAR(160) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [Tag_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tag_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Article] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [authorId] UNIQUEIDENTIFIER NOT NULL,
    [slug] NVARCHAR(160) NOT NULL,
    [language] NVARCHAR(2) NOT NULL,
    [status] NVARCHAR(32) NOT NULL,
    [currentVersionId] UNIQUEIDENTIFIER NOT NULL,
    [currentVersionNumber] INT NOT NULL,
    [currentContentHash] NVARCHAR(64) NOT NULL,
    [publishedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Article_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Article_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[ArticleVersion] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [versionNumber] INT NOT NULL,
    [title] NVARCHAR(200) NOT NULL,
    [abstract] NVARCHAR(2000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [contentHash] NVARCHAR(64) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [ArticleVersion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ArticleVersion_articleId_versionNumber_key] UNIQUE NONCLUSTERED ([articleId],[versionNumber])
);

-- CreateTable
CREATE TABLE [dbo].[ArticleFile] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [storageKey] NVARCHAR(512) NOT NULL,
    [originalFilename] NVARCHAR(255) NOT NULL,
    [mimeType] NVARCHAR(127) NOT NULL,
    [fileSize] INT NOT NULL,
    [checksum] NVARCHAR(64) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [ArticleFile_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ArticleCategory] (
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [categoryId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [ArticleCategory_pkey] PRIMARY KEY CLUSTERED ([articleId],[categoryId])
);

-- CreateTable
CREATE TABLE [dbo].[ArticleTag] (
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [tagId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [ArticleTag_pkey] PRIMARY KEY CLUSTERED ([articleId],[tagId])
);

-- CreateTable
CREATE TABLE [dbo].[AnalysisJob] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [articleVersionId] UNIQUEIDENTIFIER NOT NULL,
    [status] NVARCHAR(16) NOT NULL,
    [attemptCount] INT NOT NULL,
    [queuedAt] DATETIME2 NOT NULL,
    [startedAt] DATETIME2,
    [completedAt] DATETIME2,
    [failureReason] NVARCHAR(2000),
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AnalysisJob_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AnalysisRun] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [articleVersionId] UNIQUEIDENTIFIER NOT NULL,
    [status] NVARCHAR(16) NOT NULL,
    [pipelineVersion] NVARCHAR(64) NOT NULL,
    [promptVersion] NVARCHAR(64) NOT NULL,
    [modelProvider] NVARCHAR(64) NOT NULL,
    [modelName] NVARCHAR(128) NOT NULL,
    [startedAt] DATETIME2,
    [completedAt] DATETIME2,
    [tokenUsage] INT,
    [estimatedCost] DECIMAL(12,6),
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [AnalysisRun_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AnalysisMetric] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [analysisRunId] UNIQUEIDENTIFIER NOT NULL,
    [metricType] NVARCHAR(32) NOT NULL,
    [score] DECIMAL(5,2) NOT NULL,
    [confidence] DECIMAL(5,2) NOT NULL,
    [explanation] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [AnalysisMetric_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AnalysisMetric_analysisRunId_metricType_key] UNIQUE NONCLUSTERED ([analysisRunId],[metricType])
);

-- CreateTable
CREATE TABLE [dbo].[AnalysisEvidence] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [analysisRunId] UNIQUEIDENTIFIER NOT NULL,
    [metricType] NVARCHAR(32) NOT NULL,
    [evidenceType] NVARCHAR(64) NOT NULL,
    [claim] NVARCHAR(max) NOT NULL,
    [evidence] NVARCHAR(max) NOT NULL,
    [sourceUrl] NVARCHAR(2048),
    [sourceTitle] NVARCHAR(500),
    [reliability] DECIMAL(5,2),
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [AnalysisEvidence_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SourceReference] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [analysisRunId] UNIQUEIDENTIFIER NOT NULL,
    [url] NVARCHAR(2048) NOT NULL,
    [title] NVARCHAR(500) NOT NULL,
    [publisher] NVARCHAR(255),
    [doi] NVARCHAR(128),
    [sourceType] NVARCHAR(64) NOT NULL,
    [verificationStatus] NVARCHAR(32) NOT NULL,
    [reliabilityScore] DECIMAL(5,2),
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [SourceReference_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ScoreSnapshot] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [articleVersionId] UNIQUEIDENTIFIER NOT NULL,
    [analysisRunId] UNIQUEIDENTIFIER NOT NULL,
    [qualityScore] DECIMAL(5,2) NOT NULL,
    [authorshipRisk] DECIMAL(5,2) NOT NULL,
    [authorshipConfidence] DECIMAL(5,2) NOT NULL,
    [authorshipIntegrity] DECIMAL(5,2) NOT NULL,
    [authorshipClassification] NVARCHAR(16) NOT NULL,
    [overallScore] DECIMAL(5,2) NOT NULL,
    [scoringPolicyVersion] NVARCHAR(32) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [ScoreSnapshot_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ScoreSnapshot_analysisRunId_key] UNIQUE NONCLUSTERED ([analysisRunId])
);

-- CreateTable
CREATE TABLE [dbo].[ScoringPolicy] (
    [version] NVARCHAR(32) NOT NULL,
    [qualityWeights] NVARCHAR(max) NOT NULL,
    [qualityWeight] DECIMAL(9,8) NOT NULL,
    [authorshipIntegrityWeight] DECIMAL(9,8) NOT NULL,
    [authorshipConfidenceThreshold] DECIMAL(5,2) NOT NULL,
    [authorshipClassificationThresholds] NVARCHAR(max) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [ScoringPolicy_isActive_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ScoringPolicy_pkey] PRIMARY KEY CLUSTERED ([version])
);

-- CreateTable
CREATE TABLE [dbo].[ModerationReview] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [moderatorId] UNIQUEIDENTIFIER NOT NULL,
    [decision] NVARCHAR(32) NOT NULL,
    [reason] NVARCHAR(2000) NOT NULL,
    [notes] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [ModerationReview_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Bookmark] (
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [Bookmark_pkey] PRIMARY KEY CLUSTERED ([userId],[articleId])
);

-- CreateTable
CREATE TABLE [dbo].[ArticleView] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER,
    [sessionHash] NVARCHAR(64),
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [ArticleView_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [actorUserId] UNIQUEIDENTIFIER,
    [action] NVARCHAR(128) NOT NULL,
    [entityType] NVARCHAR(64) NOT NULL,
    [entityId] NVARCHAR(36) NOT NULL,
    [metadata] NVARCHAR(max) NOT NULL,
    [ipHash] NVARCHAR(64),
    [createdAt] DATETIME2 NOT NULL,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Article_status_idx] ON [dbo].[Article]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Article_authorId_idx] ON [dbo].[Article]([authorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Article_publishedAt_idx] ON [dbo].[Article]([publishedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Article_status_publishedAt_idx] ON [dbo].[Article]([status], [publishedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Article_currentVersionId_idx] ON [dbo].[Article]([currentVersionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ArticleVersion_contentHash_idx] ON [dbo].[ArticleVersion]([contentHash]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ArticleFile_articleId_idx] ON [dbo].[ArticleFile]([articleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ArticleCategory_categoryId_idx] ON [dbo].[ArticleCategory]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ArticleTag_tagId_idx] ON [dbo].[ArticleTag]([tagId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AnalysisJob_status_idx] ON [dbo].[AnalysisJob]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AnalysisJob_articleId_idx] ON [dbo].[AnalysisJob]([articleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AnalysisJob_articleVersionId_status_idx] ON [dbo].[AnalysisJob]([articleVersionId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AnalysisRun_articleVersionId_idx] ON [dbo].[AnalysisRun]([articleVersionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AnalysisRun_status_idx] ON [dbo].[AnalysisRun]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AnalysisEvidence_analysisRunId_idx] ON [dbo].[AnalysisEvidence]([analysisRunId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SourceReference_articleId_idx] ON [dbo].[SourceReference]([articleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SourceReference_analysisRunId_idx] ON [dbo].[SourceReference]([analysisRunId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScoreSnapshot_articleVersionId_createdAt_idx] ON [dbo].[ScoreSnapshot]([articleVersionId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ScoreSnapshot_overallScore_idx] ON [dbo].[ScoreSnapshot]([overallScore]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ModerationReview_articleId_idx] ON [dbo].[ModerationReview]([articleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ModerationReview_moderatorId_idx] ON [dbo].[ModerationReview]([moderatorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Bookmark_articleId_idx] ON [dbo].[Bookmark]([articleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ArticleView_articleId_createdAt_idx] ON [dbo].[ArticleView]([articleId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_entityType_entityId_idx] ON [dbo].[AuditLog]([entityType], [entityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_actorUserId_createdAt_idx] ON [dbo].[AuditLog]([actorUserId], [createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[Profile] ADD CONSTRAINT [Profile_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Article] ADD CONSTRAINT [Article_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ArticleVersion] ADD CONSTRAINT [ArticleVersion_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ArticleFile] ADD CONSTRAINT [ArticleFile_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ArticleCategory] ADD CONSTRAINT [ArticleCategory_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ArticleCategory] ADD CONSTRAINT [ArticleCategory_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ArticleTag] ADD CONSTRAINT [ArticleTag_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ArticleTag] ADD CONSTRAINT [ArticleTag_tagId_fkey] FOREIGN KEY ([tagId]) REFERENCES [dbo].[Tag]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AnalysisJob] ADD CONSTRAINT [AnalysisJob_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AnalysisJob] ADD CONSTRAINT [AnalysisJob_articleVersionId_fkey] FOREIGN KEY ([articleVersionId]) REFERENCES [dbo].[ArticleVersion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AnalysisRun] ADD CONSTRAINT [AnalysisRun_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AnalysisRun] ADD CONSTRAINT [AnalysisRun_articleVersionId_fkey] FOREIGN KEY ([articleVersionId]) REFERENCES [dbo].[ArticleVersion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AnalysisMetric] ADD CONSTRAINT [AnalysisMetric_analysisRunId_fkey] FOREIGN KEY ([analysisRunId]) REFERENCES [dbo].[AnalysisRun]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AnalysisEvidence] ADD CONSTRAINT [AnalysisEvidence_analysisRunId_fkey] FOREIGN KEY ([analysisRunId]) REFERENCES [dbo].[AnalysisRun]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SourceReference] ADD CONSTRAINT [SourceReference_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SourceReference] ADD CONSTRAINT [SourceReference_analysisRunId_fkey] FOREIGN KEY ([analysisRunId]) REFERENCES [dbo].[AnalysisRun]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [ScoreSnapshot_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [ScoreSnapshot_articleVersionId_fkey] FOREIGN KEY ([articleVersionId]) REFERENCES [dbo].[ArticleVersion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [ScoreSnapshot_analysisRunId_fkey] FOREIGN KEY ([analysisRunId]) REFERENCES [dbo].[AnalysisRun]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ModerationReview] ADD CONSTRAINT [ModerationReview_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ModerationReview] ADD CONSTRAINT [ModerationReview_moderatorId_fkey] FOREIGN KEY ([moderatorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bookmark] ADD CONSTRAINT [Bookmark_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bookmark] ADD CONSTRAINT [Bookmark_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ArticleView] ADD CONSTRAINT [ArticleView_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[Article]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ArticleView] ADD CONSTRAINT [ArticleView_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_actorUserId_fkey] FOREIGN KEY ([actorUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE UNIQUE INDEX [UX_AnalysisJob_ActiveArticleVersion]
ON [dbo].[AnalysisJob]([articleVersionId])
WHERE [status] IN (N'QUEUED', N'RUNNING');

CREATE UNIQUE INDEX [UX_ScoringPolicy_OneActive]
ON [dbo].[ScoringPolicy]([isActive])
WHERE [isActive] = 1;

ALTER TABLE [dbo].[User] ADD CONSTRAINT [CK_User_role] CHECK ([role] IN (N'USER', N'MODERATOR', N'ADMIN'));
ALTER TABLE [dbo].[User] ADD CONSTRAINT [CK_User_status] CHECK ([status] IN (N'ACTIVE', N'SUSPENDED', N'DELETED'));
ALTER TABLE [dbo].[Article] ADD CONSTRAINT [CK_Article_status] CHECK ([status] IN (
    N'DRAFT', N'SUBMITTED', N'QUEUED_FOR_ANALYSIS', N'PROCESSING', N'ANALYSIS_COMPLETED',
    N'READY_FOR_PUBLICATION', N'REQUIRES_REVIEW', N'REJECTED', N'PUBLISHED', N'ANALYSIS_FAILED',
    N'ARCHIVED', N'REMOVED'
));
ALTER TABLE [dbo].[AnalysisJob] ADD CONSTRAINT [CK_AnalysisJob_status] CHECK ([status] IN (N'QUEUED', N'RUNNING', N'COMPLETED', N'FAILED', N'CANCELLED'));
ALTER TABLE [dbo].[AnalysisRun] ADD CONSTRAINT [CK_AnalysisRun_status] CHECK ([status] IN (N'PENDING', N'RUNNING', N'COMPLETED', N'FAILED'));
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [CK_ScoreSnapshot_classification] CHECK ([authorshipClassification] IN (N'very_low', N'low', N'uncertain', N'elevated', N'high'));
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [CK_ScoreSnapshot_qualityScore] CHECK ([qualityScore] >= 0 AND [qualityScore] <= 100);
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [CK_ScoreSnapshot_authorshipRisk] CHECK ([authorshipRisk] >= 0 AND [authorshipRisk] <= 100);
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [CK_ScoreSnapshot_authorshipConfidence] CHECK ([authorshipConfidence] >= 0 AND [authorshipConfidence] <= 100);
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [CK_ScoreSnapshot_authorshipIntegrity] CHECK ([authorshipIntegrity] >= 0 AND [authorshipIntegrity] <= 100);
ALTER TABLE [dbo].[ScoreSnapshot] ADD CONSTRAINT [CK_ScoreSnapshot_overallScore] CHECK ([overallScore] >= 0 AND [overallScore] <= 100);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

