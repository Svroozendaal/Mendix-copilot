import type { MendixCopilotConfig } from "../../config/index.js";
import type { ModelStatsInfo } from "../../mendix/client.js";
import { MendixClient } from "../../mendix/client.js";
import { CopilotCore } from "../../core/copilot-core.js";
import { ApiError } from "./errors.js";
import type { ApiStatusShape } from "./types.js";

interface ConnectOptions {
  appId?: string;
  branch?: string;
}

interface SessionState {
  appId: string;
  branch: string;
  connectedAt: string;
  counts: ModelStatsInfo;
}

function requiredToken(env: NodeJS.ProcessEnv): string {
  const token = env.MENDIX_TOKEN?.trim();
  if (!token) {
    throw new ApiError(
      400,
      "MENDIX_TOKEN ontbreekt. Zet deze environment variable server-side."
    );
  }
  return token;
}

export class CopilotSessionManager {
  private readonly env: NodeJS.ProcessEnv;
  private client: MendixClient | null = null;
  private core: CopilotCore | null = null;
  private state: SessionState | null = null;
  private connecting: Promise<void> | null = null;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.env = env;
  }

  private resolveConnection(options: ConnectOptions): { appId: string; branch: string; token: string } {
    const token = requiredToken(this.env);
    const appId = options.appId?.trim() || this.env.MENDIX_APP_ID?.trim();
    const branch = options.branch?.trim() || this.env.MENDIX_BRANCH?.trim() || "main";

    if (!appId) {
      throw new ApiError(
        400,
        "Geen appId opgegeven. Stuur appId mee in /api/connect of zet MENDIX_APP_ID."
      );
    }

    return { appId, branch, token };
  }

  private sameConnection(appId: string, branch: string): boolean {
    return Boolean(this.state && this.state.appId === appId && this.state.branch === branch);
  }

  async connect(options: ConnectOptions): Promise<ApiStatusShape> {
    const { appId, branch, token } = this.resolveConnection(options);

    if (this.sameConnection(appId, branch)) {
      return this.getStatus();
    }

    if (this.connecting) {
      await this.connecting;
      if (this.sameConnection(appId, branch)) {
        return this.getStatus();
      }
    }

    this.connecting = this.establishConnection({
      mendixToken: token,
      appId,
      branch,
    });

    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }

    return this.getStatus();
  }

  private async establishConnection(config: MendixCopilotConfig): Promise<void> {
    await this.disconnect();

    const client = new MendixClient(config);
    await client.connect();
    const counts = await client.getModelStats();

    this.client = client;
    this.core = new CopilotCore(client);
    this.state = {
      appId: config.appId,
      branch: config.branch,
      connectedAt: new Date().toISOString(),
      counts,
    };
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      this.core = null;
      this.state = null;
      return;
    }

    const currentClient = this.client;
    this.client = null;
    this.core = null;
    this.state = null;
    await currentClient.disconnect();
  }

  getStatus(): ApiStatusShape {
    if (!this.client || !this.state) {
      return {
        connected: false,
        modelLoaded: false,
      };
    }

    return {
      connected: true,
      appId: this.state.appId,
      branch: this.state.branch,
      modelLoaded: true,
      counts: this.state.counts,
      connectedAt: this.state.connectedAt,
    };
  }

  getCoreOrThrow(): CopilotCore {
    if (!this.core) {
      throw new ApiError(409, "Niet verbonden. Gebruik eerst POST /api/connect.");
    }
    return this.core;
  }
}
