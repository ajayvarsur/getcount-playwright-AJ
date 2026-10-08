import { APIRequestContext, request } from "@playwright/test";
import fs from "fs";
import path from "path";
import { ENV } from "../utils/env";

export interface TestEntityRecord {
  type: "invoice" | "bill" | "transaction" | "customer" | "vendor";
  id?: string;
  reference: string;
  createdAt: string;
}

/**
 * In-memory registry of entities created during the test run
 * to facilitate tracking and cleanup/teardown.
 */
class EntityRegistry {
  private entities: TestEntityRecord[] = [];
  private filePath = path.resolve(process.cwd(), ".test-entities.json");

  track(entity: Omit<TestEntityRecord, "createdAt">): void {
    const record: TestEntityRecord = {
      ...entity,
      createdAt: new Date().toISOString(),
    };
    this.entities.push(record);

    try {
      let existing: TestEntityRecord[] = [];
      if (fs.existsSync(this.filePath)) {
        existing = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      }
      existing.push(record);
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(existing, null, 2),
        "utf-8",
      );
    } catch {
      // Best effort file sync
    }
  }

  getAll(): TestEntityRecord[] {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      }
    } catch {
      // Fallback to in-memory
    }
    return [...this.entities];
  }

  getByType(type: TestEntityRecord["type"]): TestEntityRecord[] {
    return this.getAll().filter((e) => e.type === type);
  }

  clear(): void {
    this.entities = [];
    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
    } catch {
      // Best effort cleanup
    }
  }
}

export const entityRegistry = new EntityRegistry();

/**
 * CountApiClient — API layer for COUNT
 *
 * Utilizes saved storage state (JWT access-token / refresh-token)
 * to interact directly with backend endpoints for fast data setup,
 * health checks, and test entity teardown.
 */
export class CountApiClient {
  private context: APIRequestContext | null = null;

  /**
   * Initializes or returns the authenticated Playwright APIRequestContext.
   */
  async getContext(): Promise<APIRequestContext> {
    if (this.context) {
      return this.context;
    }

    const storagePath = path.resolve(process.cwd(), ENV.AUTH_FILE);
    let extraHTTPHeaders: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (fs.existsSync(storagePath)) {
      try {
        const raw = fs.readFileSync(storagePath, "utf-8");
        const state = JSON.parse(raw);
        const cookies = state.cookies || [];
        const cookieHeader = cookies
          .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
          .join("; ");

        if (cookieHeader) {
          extraHTTPHeaders["Cookie"] = cookieHeader;
        }

        const tokenCookie = cookies.find(
          (c: { name: string; value: string }) => c.name === "access-token",
        );
        if (tokenCookie) {
          extraHTTPHeaders["Authorization"] = `Bearer ${tokenCookie.value}`;
        }
      } catch (err) {
        console.warn(
          `[CountApiClient] Could not load cookies from ${storagePath}:`,
          err,
        );
      }
    }

    this.context = await request.newContext({
      baseURL: ENV.BASE_URL,
      extraHTTPHeaders,
    });

    return this.context;
  }

  /**
   * Check backend health / status.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const ctx = await this.getContext();
      const res = await ctx.get("/api/health").catch(() => null);
      return res ? res.ok() : false;
    } catch {
      return false;
    }
  }

  /**
   * Dispose API context.
   */
  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }
}

export const countApi = new CountApiClient();
