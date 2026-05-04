import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

// ── Connection config ─────────────────────────────────────────────────────────
const MINIO_ENDPOINT =
  process.env.MINIO_ENDPOINT ?? 'http://localhost:9000';
const BUCKET = process.env.STORAGE_BUCKET ?? 'graphclaw';
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID ?? 'graphclaw';
const SECRET_KEY =
  process.env.AWS_SECRET_ACCESS_KEY ?? 'graphclaw_dev';

// ── Storage paths ─────────────────────────────────────────────────────────────
// Mirrors StoragePaths class in graphclaw/src/graphclaw/storage/paths.py
export const StoragePaths = {
  agentProfile: (userId: string) => `${userId}/profile.md`,
  workingMemory: (userId: string) => `${userId}/memory/working.md`,
  episodicEntry: (userId: string, name: string) =>
    `${userId}/memory/episodic/${name}`,
  semanticTopic: (userId: string, topic: string) =>
    `${userId}/memory/semantic/${topic}.md`,
  authoredSkill: (userId: string, skillId: string) =>
    `${userId}/skills/authored/${skillId}/SKILL.md`,
};

// ── MinioClient ───────────────────────────────────────────────────────────────
/**
 * MinIO verification client using AWS SDK v3 with forcePathStyle=true.
 * All operations hit the REAL MinIO container — no mocks.
 *
 * Usage:
 *   const minio = new MinioClient();
 *   const exists = await minio.objectExists('USER-dev-001/profile.md');
 *   const content = await minio.readObject('USER-dev-001/profile.md');
 */
export class MinioClient {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(endpoint: string = MINIO_ENDPOINT, bucket: string = BUCKET) {
    this.bucket = bucket;
    this.s3 = new S3Client({
      endpoint,
      region: 'us-east-1', // MinIO ignores region but the SDK requires one
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO S3-compatible API
    });
  }

  /** Return true if the object key exists in the graphclaw bucket. */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (err: unknown) {
      // HeadObject throws when object not found
      if (
        err instanceof Error &&
        (err.name === 'NotFound' || err.name === 'NoSuchKey' ||
          (err as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode === 404)
      ) {
        return false;
      }
      throw err;
    }
  }

  /** Read object content as a UTF-8 string. */
  async readObject(key: string): Promise<string> {
    const res = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!res.Body) return '';
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  /** Delete an object — used in teardown to restore clean state. */
  async deleteObject(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /** List all object keys under a given prefix. */
  async listObjects(prefix: string): Promise<string[]> {
    const res = await this.s3.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );
    return (res.Contents ?? []).map((obj) => obj.Key ?? '').filter(Boolean);
  }
}
