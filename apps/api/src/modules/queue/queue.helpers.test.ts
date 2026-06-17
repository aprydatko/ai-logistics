import { describe, expect, it } from 'vitest';

import { BULLMQ_MAX_RETRIES_PER_REQUEST } from './queue.constants';
import { parseRedisUrl } from './queue.helpers';

describe('parseRedisUrl', () => {
  it('parses a full URL with credentials, port and db', () => {
    const options = parseRedisUrl(
      'redis://alice:s3cret@redis.example.com:6380/3'
    );

    expect(options).toEqual({
      db: 3,
      host: 'redis.example.com',
      maxRetriesPerRequest: BULLMQ_MAX_RETRIES_PER_REQUEST,
      password: 's3cret',
      port: 6380,
      username: 'alice',
    });
  });

  it('defaults port to 6379 when missing', () => {
    const options = parseRedisUrl('redis://localhost');

    expect(options.port).toBe(6379);
  });

  it('defaults db to 0 when path is empty', () => {
    const options = parseRedisUrl('redis://localhost:6379/');

    expect(options.db).toBe(0);
  });

  it('defaults db to 0 when path has no numeric segment', () => {
    const options = parseRedisUrl('redis://localhost:6379');

    expect(options.db).toBe(0);
  });

  it('maps empty username/password to undefined', () => {
    const options = parseRedisUrl('redis://localhost:6379/0');

    expect(options.username).toBeUndefined();
    expect(options.password).toBeUndefined();
  });

  it('always sets maxRetriesPerRequest to the BullMQ-required null literal', () => {
    const options = parseRedisUrl('redis://localhost:6379/0');

    expect(options.maxRetriesPerRequest).toBeNull();
  });
});

describe('BULLMQ_MAX_RETRIES_PER_REQUEST', () => {
  it('is exactly `null` so BullMQ workers can use blocking commands', () => {
    // Locked in by test: changing this value will break BullMQ workers
    // (they rely on ioredis retrying the connection instead of the command).
    expect(BULLMQ_MAX_RETRIES_PER_REQUEST).toBeNull();
  });
});
