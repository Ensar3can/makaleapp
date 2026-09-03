import { AuditAction } from './enums';
import { InvalidAuditLogError } from './errors';
import type { AuditLogId, UserId } from './ids';

const ACTION_MAX = 128;
const ENTITY_TYPE_MAX = 64;
const ENTITY_ID_MAX = 36;
const METADATA_MAX = 16_000;
const IP_HASH_LENGTH = 64;

export interface AuditLogProps {
  readonly id: AuditLogId;
  readonly actorUserId: UserId | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly metadata: string;
  readonly ipHash: string | null;
  readonly createdAt: Date;
}

export class AuditLog {
  public readonly id: AuditLogId;
  public readonly actorUserId: UserId | null;
  public readonly action: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly metadata: string;
  public readonly ipHash: string | null;
  public readonly createdAt: Date;

  private constructor(props: AuditLogProps) {
    this.id = props.id;
    this.actorUserId = props.actorUserId;
    this.action = props.action;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.metadata = props.metadata;
    this.ipHash = props.ipHash;
    this.createdAt = props.createdAt;
  }

  public static record(props: AuditLogProps): AuditLog {
    const action = props.action.trim();
    const entityType = props.entityType.trim();
    const entityId = props.entityId.trim();
    const metadata = props.metadata.trim().length === 0 ? '{}' : props.metadata;

    if (action.length === 0 || action.length > ACTION_MAX) {
      throw new InvalidAuditLogError('Audit action is required');
    }

    if (entityType.length === 0 || entityType.length > ENTITY_TYPE_MAX) {
      throw new InvalidAuditLogError('Audit entity type is required');
    }

    if (entityId.length === 0 || entityId.length > ENTITY_ID_MAX) {
      throw new InvalidAuditLogError('Audit entity id is required');
    }

    if (metadata.length > METADATA_MAX) {
      throw new InvalidAuditLogError('Audit metadata is too large');
    }

    assertJsonObject(metadata);

    if (props.ipHash !== null && props.ipHash.length !== IP_HASH_LENGTH) {
      throw new InvalidAuditLogError('Audit IP hash must be a 64-character SHA-256 hex digest');
    }

    return new AuditLog({
      ...props,
      action,
      entityType,
      entityId,
      metadata,
    });
  }

  public static reconstitute(props: AuditLogProps): AuditLog {
    return AuditLog.record(props);
  }

  public isSystemAction(): boolean {
    return this.actorUserId === null;
  }

  public isAction(action: AuditAction | string): boolean {
    return this.action === action;
  }
}

function assertJsonObject(value: string): void {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new InvalidAuditLogError('Audit metadata must be valid JSON');
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new InvalidAuditLogError('Audit metadata must be a JSON object');
  }
}
