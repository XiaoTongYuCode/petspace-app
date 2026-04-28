export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

type CacheOptions = {
  tags?: string[];
  ttlMs?: number;
};

type CacheEntry<T> = {
  expiresAt: number;
  tags: Set<string>;
  value: T;
};

export class InMemoryCache {
  private entries = new Map<string, CacheEntry<unknown>>();
  private keyTags = new Map<string, Set<string>>();
  private keyVersions = new Map<string, number>();
  private pending = new Map<string, Promise<unknown>>();
  private tagIndex = new Map<string, Set<string>>();

  constructor(private readonly defaultTtlMs = DEFAULT_CACHE_TTL_MS) {}

  get<T>(key: string) {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, options: CacheOptions = {}) {
    this.removeEntry(key);

    const tags = new Set((options.tags ?? []).filter(Boolean));
    const entry: CacheEntry<T> = {
      expiresAt: Date.now() + (options.ttlMs ?? this.defaultTtlMs),
      tags,
      value,
    };

    this.entries.set(key, entry);
    this.replaceTags(key, tags);

    return value;
  }

  async getOrSet<T>(
    key: string,
    load: () => Promise<T>,
    options: CacheOptions = {},
  ) {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const pending = this.pending.get(key);

    if (pending) {
      return pending as Promise<T>;
    }

    const version = this.keyVersions.get(key) ?? 0;
    this.replaceTags(key, new Set((options.tags ?? []).filter(Boolean)));
    const promise = load()
      .then((value) => {
        if ((this.keyVersions.get(key) ?? 0) !== version) {
          return value;
        }

        return this.set(key, value, options);
      })
      .finally(() => {
        if (this.pending.get(key) === promise) {
          this.pending.delete(key);
        }

        if (!this.entries.has(key)) {
          this.removeTags(key);
        }
      });

    this.pending.set(key, promise);
    return promise;
  }

  delete(key: string) {
    this.removeEntry(key);
    this.bumpVersion(key);
    this.pending.delete(key);
  }

  invalidateTag(tag: string) {
    const keys = this.tagIndex.get(tag);

    if (!keys) {
      return;
    }

    for (const key of Array.from(keys)) {
      this.delete(key);
    }
  }

  invalidateTags(tags: string[]) {
    for (const tag of tags) {
      this.invalidateTag(tag);
    }
  }

  clear() {
    this.entries.clear();
    this.keyTags.clear();
    this.pending.clear();
    this.tagIndex.clear();
    this.keyVersions.clear();
  }

  private bumpVersion(key: string) {
    this.keyVersions.set(key, (this.keyVersions.get(key) ?? 0) + 1);
  }

  private removeEntry(key: string) {
    this.entries.delete(key);
    this.removeTags(key);
  }

  private removeTags(key: string) {
    const tags = this.keyTags.get(key);

    if (!tags) {
      return;
    }

    for (const tag of tags) {
      const taggedKeys = this.tagIndex.get(tag);

      if (!taggedKeys) {
        continue;
      }

      taggedKeys.delete(key);

      if (taggedKeys.size === 0) {
        this.tagIndex.delete(tag);
      }
    }

    this.keyTags.delete(key);
  }

  private replaceTags(key: string, tags: Set<string>) {
    this.removeTags(key);

    if (tags.size === 0) {
      return;
    }

    this.keyTags.set(key, tags);

    for (const tag of tags) {
      const taggedKeys = this.tagIndex.get(tag) ?? new Set<string>();

      taggedKeys.add(key);
      this.tagIndex.set(tag, taggedKeys);
    }
  }
}

const globalForCache = globalThis as typeof globalThis & {
  __petspaceDataCache?: InMemoryCache;
};

export const dataCache =
  globalForCache.__petspaceDataCache ?? new InMemoryCache();

globalForCache.__petspaceDataCache = dataCache;
