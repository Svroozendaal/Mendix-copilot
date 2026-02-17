import type { IComponent, StudioProApi } from "@mendix/extensions-api";
import { getStudioProApi } from "@mendix/extensions-api";
import {
  type WbBridgeMessage,
  type WbContextPayload,
  WB_EMBEDDED_MESSAGE_TYPE,
  WB_CONTEXT_MESSAGE_TYPE,
  WB_CONTEXT_REQUEST_MESSAGE_TYPE,
  createEmptyContextPayload,
  isContextMessage,
  normalizeWbContextPayload,
} from "../shared/context";

const FALLBACK_MESSAGE = "Copilot UI is not running. Start it with: npm run dev";
const DEFAULT_PORTS = ["5173", "3000"] as const;
const LOCAL_STORAGE_PORT_KEY = "wb.copilot.webUiPort";
const REQUEST_TIMEOUT_MS = 1500;

let latestContext: WbContextPayload = createEmptyContextPayload();
let iframe: HTMLIFrameElement | null = null;
let iframeOrigin = "*";
let messageHandlerRegistered = false;

function parsePort(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }

  return String(parsed);
}

function readRuntimePortSetting(): string | null {
  try {
    return parsePort(window.localStorage.getItem(LOCAL_STORAGE_PORT_KEY));
  } catch {
    return null;
  }
}

function collectCandidatePorts(componentInput: Readonly<Record<string, unknown>>): string[] {
  const fromQuery = parsePort(componentInput.webUiPort);
  const fromBuildTime = parsePort(process.env.WB_COPILOT_WEB_UI_PORT);
  const fromRuntime = readRuntimePortSetting();

  const ports: string[] = [];
  const pushPort = (candidate: string | null) => {
    if (!candidate || ports.includes(candidate)) {
      return;
    }
    ports.push(candidate);
  };

  pushPort(fromQuery);
  pushPort(fromBuildTime);
  pushPort(fromRuntime);
  DEFAULT_PORTS.forEach((port) => pushPort(port));

  return ports;
}

function candidateUrls(ports: string[]): string[] {
  return ports.map((port) => `http://localhost:${port}`);
}

async function canReach(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutHandle = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    await fetch(`${baseUrl}/`, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}

async function resolveWebUiUrl(ports: string[]): Promise<string | null> {
  const urls = candidateUrls(ports);

  for (const url of urls) {
    if (await canReach(url)) {
      return url;
    }
  }

  return null;
}

function ensureStyles(): void {
  if (document.getElementById("wb-copilot-pane-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "wb-copilot-pane-style";
  style.textContent = `
    :root {
      color-scheme: light;
      font-family: "Segoe UI", Tahoma, sans-serif;
    }
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #f3f6fb;
      color: #10213f;
    }
    #wb-copilot-pane-root {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .wb-pane-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border-bottom: 1px solid #d9e2f1;
      background: #ffffff;
      font-size: 12px;
    }
    .wb-pane-top strong {
      font-size: 13px;
    }
    .wb-pane-badge {
      border-radius: 999px;
      border: 1px solid #99b2dd;
      background: #e8f0ff;
      color: #0f2f74;
      padding: 3px 9px;
      font-weight: 600;
    }
    .wb-pane-body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .wb-pane-body iframe {
      width: 100%;
      height: 100%;
      border: 0;
      background: #ffffff;
    }
    .wb-fallback {
      margin: 16px;
      padding: 14px;
      border: 1px solid #d6ddee;
      border-radius: 10px;
      background: #ffffff;
      line-height: 1.45;
      font-size: 13px;
    }
    .wb-fallback code {
      display: block;
      margin-top: 6px;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #dfe6f6;
      background: #f6f8fe;
      font-size: 12px;
      white-space: pre-wrap;
    }
    .wb-fallback button {
      margin-top: 10px;
      border: 1px solid #1855d6;
      background: #2563eb;
      color: #ffffff;
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
    }
    .wb-loading {
      margin: 16px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid #d6ddee;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);
}

function ensureRoot(): HTMLDivElement {
  let root = document.getElementById("wb-copilot-pane-root") as HTMLDivElement | null;
  if (root) {
    return root;
  }

  root = document.createElement("div");
  root.id = "wb-copilot-pane-root";
  document.body.appendChild(root);
  return root;
}

function setTopBar(root: HTMLDivElement, activeUrl: string | null): HTMLDivElement {
  const header = document.createElement("div");
  header.className = "wb-pane-top";
  header.innerHTML = `
    <strong>WellBased Copilot Panel</strong>
    <span class="wb-pane-badge">${activeUrl ? `Embedded: ${activeUrl}` : "Embedded localhost UI"}</span>
  `;

  const body = document.createElement("div");
  body.className = "wb-pane-body";

  root.replaceChildren(header, body);
  return body;
}

function postContextToIframe(): void {
  if (!iframe?.contentWindow) {
    return;
  }

  iframe.contentWindow.postMessage(
    {
      type: WB_EMBEDDED_MESSAGE_TYPE,
      payload: { embedded: true, host: "studio-pro-extension" },
    },
    iframeOrigin
  );
  iframe.contentWindow.postMessage(
    {
      type: WB_CONTEXT_MESSAGE_TYPE,
      payload: latestContext,
    },
    iframeOrigin
  );
}

function renderLoading(root: HTMLDivElement, ports: string[]): void {
  const body = setTopBar(root, null);
  const panel = document.createElement("div");
  panel.className = "wb-loading";
  panel.textContent = `Checking Copilot UI on localhost ports: ${ports.join(", ")}...`;
  body.replaceChildren(panel);
}

function renderFallback(
  root: HTMLDivElement,
  ports: string[],
  onRetry: () => void
): void {
  const body = setTopBar(root, null);
  const panel = document.createElement("div");
  panel.className = "wb-fallback";

  const lines = candidateUrls(ports).join("\n");
  panel.innerHTML = `
    <strong>${FALLBACK_MESSAGE}</strong>
    <code>Checked:\n${lines}</code>
  `;

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "Retry";
  retryButton.addEventListener("click", onRetry);
  panel.appendChild(retryButton);

  body.replaceChildren(panel);
}

function renderIframe(root: HTMLDivElement, baseUrl: string): void {
  const embeddedUrl = new URL(baseUrl);
  embeddedUrl.searchParams.set("embedded", "1");

  const body = setTopBar(root, baseUrl);
  iframe = document.createElement("iframe");
  iframe.src = embeddedUrl.toString();
  iframe.title = "WellBased Copilot Embedded UI";
  iframeOrigin = embeddedUrl.origin;
  iframe.addEventListener("load", () => {
    postContextToIframe();
  });

  body.replaceChildren(iframe);
}

async function requestInitialContext(studioPro: StudioProApi): Promise<void> {
  await studioPro.ui.messagePassing.sendMessage<WbBridgeMessage, WbContextPayload>(
    { type: WB_CONTEXT_REQUEST_MESSAGE_TYPE },
    async (response) => {
      latestContext = normalizeWbContextPayload(response);
      postContextToIframe();
    }
  );
}

async function registerContextHandler(studioPro: StudioProApi): Promise<void> {
  if (messageHandlerRegistered) {
    return;
  }

  await studioPro.ui.messagePassing.addMessageHandler<WbBridgeMessage>(
    async ({ message }) => {
      if (!isContextMessage(message)) {
        return;
      }
      latestContext = normalizeWbContextPayload(message.payload);
      postContextToIframe();
    }
  );

  messageHandlerRegistered = true;
}

async function bootstrapPane(
  studioPro: StudioProApi,
  componentInput: Readonly<Record<string, unknown>>
): Promise<void> {
  ensureStyles();
  const root = ensureRoot();
  const ports = collectCandidatePorts(componentInput);
  renderLoading(root, ports);

  await registerContextHandler(studioPro);
  await requestInitialContext(studioPro);

  const resolvedUrl = await resolveWebUiUrl(ports);
  if (!resolvedUrl) {
    renderFallback(root, ports, () => {
      void bootstrapPane(studioPro, componentInput);
    });
    return;
  }

  renderIframe(root, resolvedUrl);
}

export const component: IComponent = {
  async loaded(componentContext, componentInput) {
    const studioPro = getStudioProApi(componentContext);
    await bootstrapPane(studioPro, componentInput);
  },
};
