using System.Text.Json;

namespace WellBased.Copilot.StudioPro10;

internal static class CopilotPanelHtml
{
    public static string Render(string? configuredPort)
    {
        var configuredPortJson = JsonSerializer.Serialize(configuredPort ?? string.Empty);
        var localStoragePortKeyJson = JsonSerializer.Serialize(CopilotConstants.LocalStoragePortKey);
        var defaultPortAJson = JsonSerializer.Serialize(CopilotConstants.DefaultWebUiPortA);
        var defaultPortBJson = JsonSerializer.Serialize(CopilotConstants.DefaultWebUiPortB);
        var embeddedHostJson = JsonSerializer.Serialize(CopilotConstants.EmbeddedHost);
        var fallbackMessageJson = JsonSerializer.Serialize("Copilot UI is not running. Start it with: npm run dev");
        var contextMessageTypeJson = JsonSerializer.Serialize(CopilotConstants.ContextMessageType);
        var contextRequestTypeJson = JsonSerializer.Serialize(CopilotConstants.ContextRequestMessageType);
        var embeddedMessageTypeJson = JsonSerializer.Serialize(CopilotConstants.EmbeddedMessageType);
        var listenerRegisteredJson = JsonSerializer.Serialize(CopilotConstants.MessageListenerRegistered);

        return $$"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>WellBased Copilot Panel</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Segoe UI", Tahoma, sans-serif;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #f3f6fb;
      color: #10213f;
    }
    #root {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-bottom: 1px solid #d9e2f1;
      background: #ffffff;
      font-size: 12px;
    }
    .topbar strong {
      font-size: 13px;
    }
    .badge {
      border-radius: 999px;
      border: 1px solid #99b2dd;
      background: #e8f0ff;
      color: #0f2f74;
      padding: 3px 9px;
      font-weight: 600;
    }
    .body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .body iframe {
      width: 100%;
      height: 100%;
      border: 0;
      background: #ffffff;
    }
    .card {
      margin: 16px;
      padding: 14px;
      border: 1px solid #d6ddee;
      border-radius: 10px;
      background: #ffffff;
      line-height: 1.45;
      font-size: 13px;
    }
    .card code {
      display: block;
      margin-top: 6px;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #dfe6f6;
      background: #f6f8fe;
      font-size: 12px;
      white-space: pre-wrap;
    }
    .card button {
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
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const FALLBACK_MESSAGE = {{fallbackMessageJson}};
    const DEFAULT_PORTS = [{{defaultPortAJson}}, {{defaultPortBJson}}];
    const LOCAL_STORAGE_PORT_KEY = {{localStoragePortKeyJson}};
    const REQUEST_TIMEOUT_MS = 1500;
    const configuredPort = {{configuredPortJson}};
    const embeddedHost = {{embeddedHostJson}};
    const contextMessageType = {{contextMessageTypeJson}};
    const contextRequestType = {{contextRequestTypeJson}};
    const embeddedMessageType = {{embeddedMessageTypeJson}};
    const listenerRegisteredMessage = {{listenerRegisteredJson}};

    let iframeElement = null;
    let iframeOrigin = "*";
    let latestContext = { selectedType: null };

    function asRecord(value) {
      return value && typeof value === "object" ? value : null;
    }

    function parsePort(rawValue) {
      if (typeof rawValue !== "string") {
        return null;
      }
      const parsed = Number.parseInt(rawValue.trim(), 10);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
        return null;
      }
      return String(parsed);
    }

    function collectCandidatePorts() {
      const candidates = [];
      const pushPort = (candidate) => {
        if (!candidate || candidates.includes(candidate)) {
          return;
        }
        candidates.push(candidate);
      };

      pushPort(parsePort(configuredPort));

      try {
        pushPort(parsePort(window.localStorage.getItem(LOCAL_STORAGE_PORT_KEY)));
      } catch (error) {
        console.warn("Failed to read local storage port", error);
      }

      for (const port of DEFAULT_PORTS) {
        pushPort(parsePort(port));
      }

      return candidates;
    }

    function candidateUrls(ports) {
      return ports.map((port) => `http://localhost:${port}`);
    }

    async function canReach(baseUrl) {
      const controller = new AbortController();
      const timeoutHandle = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        await fetch(`${baseUrl}/`, {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal
        });
        return true;
      } catch (error) {
        console.warn("Copilot UI reachability check failed", baseUrl, error);
        return false;
      } finally {
        window.clearTimeout(timeoutHandle);
      }
    }

    async function resolveWebUiUrl(ports) {
      const urls = candidateUrls(ports);
      for (const url of urls) {
        if (await canReach(url)) {
          return url;
        }
      }
      return null;
    }

    function normalizeContext(payload) {
      const record = asRecord(payload) || {};
      const rawSelectedType = record.selectedType;
      const selectedType = rawSelectedType === "module" ||
        rawSelectedType === "entity" ||
        rawSelectedType === "microflow" ||
        rawSelectedType === "page" ||
        rawSelectedType === null
        ? rawSelectedType
        : null;

      const qualifiedName =
        typeof record.qualifiedName === "string" && record.qualifiedName.trim().length > 0
          ? record.qualifiedName.trim()
          : undefined;
      const moduleName =
        typeof record.module === "string" && record.module.trim().length > 0
          ? record.module.trim()
          : undefined;

      const context = { selectedType };
      if (qualifiedName) {
        context.qualifiedName = qualifiedName;
      }
      if (moduleName) {
        context.module = moduleName;
      }
      return context;
    }

    function sendToStudio(message, data) {
      if (window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage({ message, data });
      }
    }

    function postContextToIFrame() {
      if (!iframeElement || !iframeElement.contentWindow) {
        return;
      }

      iframeElement.contentWindow.postMessage(
        {
          type: embeddedMessageType,
          payload: { embedded: true, host: embeddedHost }
        },
        iframeOrigin
      );

      iframeElement.contentWindow.postMessage(
        {
          type: contextMessageType,
          payload: latestContext
        },
        iframeOrigin
      );
    }

    function handleStudioMessage(messageEnvelope) {
      const envelope = asRecord(messageEnvelope);
      if (!envelope || typeof envelope.message !== "string") {
        return;
      }

      if (envelope.message === contextMessageType) {
        latestContext = normalizeContext(envelope.data);
        postContextToIFrame();
      }
    }

    function renderLayout(activeUrl) {
      const root = document.getElementById("root");
      root.replaceChildren();

      const topbar = document.createElement("div");
      topbar.className = "topbar";
      topbar.innerHTML =
        `<strong>WellBased Copilot Panel</strong>` +
        `<span class="badge">${activeUrl ? `Embedded: ${activeUrl}` : "Embedded localhost UI"}</span>`;

      const body = document.createElement("div");
      body.className = "body";

      root.appendChild(topbar);
      root.appendChild(body);
      return body;
    }

    function renderLoading(ports) {
      const body = renderLayout(null);
      const panel = document.createElement("div");
      panel.className = "card";
      panel.textContent = `Checking Copilot UI on localhost ports: ${ports.join(", ")}...`;
      body.appendChild(panel);
    }

    function renderFallback(ports) {
      const body = renderLayout(null);
      const panel = document.createElement("div");
      panel.className = "card";
      panel.innerHTML =
        `<strong>${FALLBACK_MESSAGE}</strong>` +
        `<code>Checked:\n${candidateUrls(ports).join("\n")}</code>`;

      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.textContent = "Retry";
      retryButton.addEventListener("click", () => {
        void bootstrap();
      });

      panel.appendChild(retryButton);
      body.appendChild(panel);
    }

    function renderIFrame(baseUrl) {
      const body = renderLayout(baseUrl);
      const embeddedUrl = new URL(baseUrl);
      embeddedUrl.searchParams.set("embedded", "1");

      iframeElement = document.createElement("iframe");
      iframeElement.src = embeddedUrl.toString();
      iframeElement.title = "WellBased Copilot Embedded UI";
      iframeOrigin = embeddedUrl.origin;
      iframeElement.addEventListener("load", postContextToIFrame);

      body.appendChild(iframeElement);
    }

    function registerBridge() {
      if (window.chrome && window.chrome.webview) {
        window.chrome.webview.addEventListener("message", (event) => handleStudioMessage(event.data));
        sendToStudio(listenerRegisteredMessage);
        sendToStudio(contextRequestType);
      }

      window.addEventListener("message", (event) => {
        if (!iframeElement || event.source !== iframeElement.contentWindow) {
          return;
        }
        const iframeMessage = asRecord(event.data);
        if (!iframeMessage || iframeMessage.type !== contextRequestType) {
          return;
        }
        sendToStudio(contextRequestType);
      });
    }

    async function bootstrap() {
      const ports = collectCandidatePorts();
      renderLoading(ports);

      const baseUrl = await resolveWebUiUrl(ports);
      if (!baseUrl) {
        renderFallback(ports);
        return;
      }

      renderIFrame(baseUrl);
      postContextToIFrame();
    }

    registerBridge();
    void bootstrap();
  </script>
</body>
</html>
""";
    }
}
