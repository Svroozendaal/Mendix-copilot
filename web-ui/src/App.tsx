import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  connect,
  disconnect,
  getAssociations,
  getBestPractices,
  getDomainModel,
  getEntityDetails,
  getMicroflowDetails,
  getPageStructure,
  getSecurityOverview,
  getStatus,
  listMicroflows,
  listModules,
  listPages,
  streamChat,
  type ApiStatus,
} from "./api-client";

type Tab = "explorer" | "chat" | "actions";

interface ModuleInfo {
  name: string;
  fromMarketplace: boolean;
}

interface ModuleListMeta {
  modules: ModuleInfo[];
}

interface DomainModelMeta {
  domainModel: {
    moduleName: string;
    microflowCount: number;
    pageCount: number;
  };
  entities: Array<{
    name: string;
    qualifiedName: string;
    attributeCount: number;
    associationCount: number;
  }>;
}

interface MicroflowListMeta {
  microflows: Array<{
    name: string;
    qualifiedName: string;
  }>;
}

interface PageListMeta {
  pages: Array<{
    name: string;
    qualifiedName: string;
  }>;
}

interface ExplorerState {
  modules: ModuleInfo[];
  entities: DomainModelMeta["entities"];
  microflows: MicroflowListMeta["microflows"];
  pages: PageListMeta["pages"];
}

interface DetailOutput {
  title: string;
  text: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface TraceEntry {
  timestamp: string;
  event: "tool_call" | "tool_result" | "error";
  message: string;
}

interface FinalPayload {
  answer?: string;
}

interface ToolCallPayload {
  toolName?: string;
  input?: Record<string, unknown>;
}

interface ToolResultPayload {
  toolName?: string;
  summary?: string;
  textLength?: number;
}

interface ErrorPayload {
  message?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function renderTraceCall(payload: ToolCallPayload): string {
  const name = payload.toolName ?? "onbekende-tool";
  const input = payload.input ? JSON.stringify(payload.input) : "{}";
  return `${name} ${input}`;
}

function renderTraceResult(payload: ToolResultPayload): string {
  const name = payload.toolName ?? "onbekende-tool";
  const summary = payload.summary ?? "afgerond";
  const length = typeof payload.textLength === "number" ? ` (${payload.textLength} chars)` : "";
  return `${name}: ${summary}${length}`;
}

function OutputBlock({ title, text }: DetailOutput) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(): Promise<void> {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="output-block">
      <header className="output-header">
        <h3>{title}</h3>
        <button type="button" onClick={() => void copyToClipboard()}>
          {copied ? "Gekopieerd" : "Copy"}
        </button>
      </header>
      <pre>{text}</pre>
    </section>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("explorer");
  const [status, setStatus] = useState<ApiStatus>({
    connected: false,
    modelLoaded: false,
  });
  const [connectAppId, setConnectAppId] = useState("");
  const [connectBranch, setConnectBranch] = useState("main");
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [explorer, setExplorer] = useState<ExplorerState>({
    modules: [],
    entities: [],
    microflows: [],
    pages: [],
  });
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedQualifiedName, setSelectedQualifiedName] = useState<string | null>(null);
  const [detailOutput, setDetailOutput] = useState<DetailOutput>({
    title: "Detail view",
    text: "Selecteer een module, entity, microflow of page in de Explorer.",
  });

  const [quickModule, setQuickModule] = useState("");
  const [quickMicroflow, setQuickMicroflow] = useState("");
  const [actionOutput, setActionOutput] = useState<DetailOutput>({
    title: "Quick action output",
    text: "Kies een quick action om output te genereren.",
  });

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [trace, setTrace] = useState<TraceEntry[]>([]);

  useEffect(() => {
    void refreshStatus();
  }, []);

  const statusText = useMemo(() => {
    if (!status.connected) {
      return "Niet verbonden";
    }
    const counts = status.counts;
    if (!counts) {
      return `Verbonden met ${status.appId ?? "onbekend"}`;
    }
    return `${counts.moduleCount} modules, ${counts.entityCount} entities, ${counts.microflowCount} microflows`;
  }, [status]);

  async function runWithLoading(label: string, fn: () => Promise<void>): Promise<void> {
    setLoadingLabel(label);
    setErrorMessage(null);
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setLoadingLabel(null);
    }
  }

  async function refreshStatus(): Promise<void> {
    const nextStatus = await getStatus();
    setStatus(nextStatus);
  }

  async function handleConnectClick(): Promise<void> {
    await runWithLoading("Verbinden met Mendix app...", async () => {
      const response = await connect(connectAppId || undefined, connectBranch || undefined);
      setStatus(response.status);
      await loadModules();
    });
  }

  async function handleDisconnectClick(): Promise<void> {
    await runWithLoading("Verbinding afsluiten...", async () => {
      await disconnect();
      await refreshStatus();
      setExplorer({
        modules: [],
        entities: [],
        microflows: [],
        pages: [],
      });
      setSelectedModule(null);
      setSelectedQualifiedName(null);
      setDetailOutput({
        title: "Detail view",
        text: "Verbinding gesloten.",
      });
    });
  }

  async function loadModules(): Promise<void> {
    await runWithLoading("Modules ophalen...", async () => {
      const modulesResponse = await listModules<ModuleListMeta>();
      setExplorer((previous) => ({
        ...previous,
        modules: modulesResponse.meta.modules,
      }));
      setDetailOutput({
        title: "Modules",
        text: modulesResponse.text,
      });
    });
  }

  async function selectModule(moduleName: string): Promise<void> {
    await runWithLoading(`Module ${moduleName} laden...`, async () => {
      setSelectedModule(moduleName);
      setSelectedQualifiedName(null);

      const [domainModelResponse, microflowResponse, pageResponse] = await Promise.all([
        getDomainModel<DomainModelMeta>(moduleName, true),
        listMicroflows<MicroflowListMeta>(moduleName),
        listPages<PageListMeta>(moduleName),
      ]);

      setExplorer((previous) => ({
        ...previous,
        entities: domainModelResponse.meta.entities,
        microflows: microflowResponse.meta.microflows,
        pages: pageResponse.meta.pages,
      }));
      setQuickModule(moduleName);
      setDetailOutput({
        title: `Module ${moduleName}`,
        text: domainModelResponse.text,
      });
    });
  }

  async function openEntity(qualifiedName: string): Promise<void> {
    await runWithLoading(`Entity ${qualifiedName} openen...`, async () => {
      setSelectedQualifiedName(qualifiedName);
      const [entityResponse, associationResponse] = await Promise.all([
        getEntityDetails<unknown>(qualifiedName),
        getAssociations<unknown>(qualifiedName),
      ]);

      setDetailOutput({
        title: `Entity ${qualifiedName}`,
        text: `${entityResponse.text}\n\n${associationResponse.text}`,
      });
    });
  }

  async function openMicroflow(qualifiedName: string): Promise<void> {
    await runWithLoading(`Microflow ${qualifiedName} openen...`, async () => {
      setSelectedQualifiedName(qualifiedName);
      setQuickMicroflow(qualifiedName);
      const response = await getMicroflowDetails<unknown>(qualifiedName);
      setDetailOutput({
        title: `Microflow ${qualifiedName}`,
        text: response.text,
      });
    });
  }

  async function openPage(qualifiedName: string): Promise<void> {
    await runWithLoading(`Page ${qualifiedName} openen...`, async () => {
      setSelectedQualifiedName(qualifiedName);
      const response = await getPageStructure<unknown>(qualifiedName);
      setDetailOutput({
        title: `Page ${qualifiedName}`,
        text: response.text,
      });
    });
  }

  async function runReviewModule(): Promise<void> {
    if (!quickModule.trim()) {
      setErrorMessage("Vul eerst een module in voor review.");
      return;
    }

    await runWithLoading(`Review module ${quickModule}...`, async () => {
      const moduleName = quickModule.trim();
      const [domainModelResponse, microflowResponse, securityResponse, bestPracticeResponse] =
        await Promise.all([
          getDomainModel<DomainModelMeta>(moduleName, true),
          listMicroflows<MicroflowListMeta>(moduleName),
          getSecurityOverview<unknown>(moduleName),
          getBestPractices<unknown>(moduleName),
        ]);

      const report = [
        `# Review module ${moduleName}`,
        "",
        "## Domain model",
        domainModelResponse.text,
        "",
        "## Microflows",
        microflowResponse.text,
        "",
        "## Security",
        securityResponse.text,
        "",
        "## Best practices",
        bestPracticeResponse.text,
      ].join("\n");

      setActionOutput({
        title: `Review module ${moduleName}`,
        text: report,
      });
    });
  }

  async function runSecurityAudit(): Promise<void> {
    await runWithLoading("Security audit uitvoeren...", async () => {
      const moduleName = quickModule.trim() || undefined;
      const [securityResponse, bestPracticeResponse] = await Promise.all([
        getSecurityOverview<unknown>(moduleName),
        getBestPractices<unknown>(moduleName),
      ]);

      const report = [
        moduleName ? `# Security audit (${moduleName})` : "# Security audit (app)",
        "",
        "## Security overview",
        securityResponse.text,
        "",
        "## Best practices",
        bestPracticeResponse.text,
      ].join("\n");

      setActionOutput({
        title: moduleName ? `Security audit ${moduleName}` : "Security audit",
        text: report,
      });
    });
  }

  async function runExplainMicroflow(): Promise<void> {
    if (!quickMicroflow.trim()) {
      setErrorMessage("Vul eerst een microflow qualified name in.");
      return;
    }

    await runWithLoading(`Microflow ${quickMicroflow} uitleggen...`, async () => {
      const qualifiedName = quickMicroflow.trim();
      const response = await getMicroflowDetails<unknown>(qualifiedName);
      setActionOutput({
        title: `Explain microflow ${qualifiedName}`,
        text: response.text,
      });
    });
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatBusy) {
      return;
    }

    setChatInput("");
    setChatBusy(true);
    setChatDraft("");
    setErrorMessage(null);
    setChatMessages((previous) => [...previous, { role: "user", text: message }]);

    let finalAnswer = "";
    const pushTrace = (eventName: TraceEntry["event"], messageText: string, timestamp?: string): void => {
      setTrace((previous) =>
        [
          ...previous,
          {
            timestamp: timestamp ?? new Date().toLocaleTimeString(),
            event: eventName,
            message: messageText,
          },
        ].slice(-200)
      );
    };

    try {
      await streamChat(
        {
          message,
          mode: "assistant",
          context: {
            module: selectedModule ?? undefined,
            qualifiedName: selectedQualifiedName ?? undefined,
          },
        },
        (streamEvent) => {
          const now = new Date().toLocaleTimeString();

          if (streamEvent.event === "assistant_token") {
            if (typeof streamEvent.data === "string") {
              setChatDraft((previous) => previous + streamEvent.data);
            }
            return;
          }

          if (streamEvent.event === "tool_call") {
            const record = asRecord(streamEvent.data);
            const payload: ToolCallPayload = {
              toolName: typeof record?.toolName === "string" ? record.toolName : undefined,
              input: asRecord(record?.input) ?? undefined,
            };
            pushTrace("tool_call", renderTraceCall(payload), now);
            return;
          }

          if (streamEvent.event === "tool_result") {
            const record = asRecord(streamEvent.data);
            const payload: ToolResultPayload = {
              toolName: typeof record?.toolName === "string" ? record.toolName : undefined,
              summary: typeof record?.summary === "string" ? record.summary : undefined,
              textLength: typeof record?.textLength === "number" ? record.textLength : undefined,
            };
            pushTrace("tool_result", renderTraceResult(payload), now);
            return;
          }

          if (streamEvent.event === "final") {
            const record = asRecord(streamEvent.data) as FinalPayload | null;
            if (record?.answer) {
              finalAnswer = record.answer;
            }
            return;
          }

          if (streamEvent.event === "error") {
            const record = asRecord(streamEvent.data) as ErrorPayload | null;
            const messageText = record?.message ?? "Onbekende chatfout.";
            pushTrace("error", messageText, now);
            setErrorMessage(messageText);
          }
        }
      );
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      setErrorMessage(messageText);
      pushTrace("error", messageText);
    } finally {
      setChatBusy(false);
      setChatDraft("");
    }

    const assistantText = finalAnswer || "Geen antwoord ontvangen.";
    setChatMessages((previous) => [...previous, { role: "assistant", text: assistantText }]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Mendix Copilot UI</h1>
          <p>Localhost Copilot naast Studio Pro, gebaseerd op dezelfde Mendix core.</p>
        </div>
      </header>

      <section className="connect-panel">
        <div className="connect-fields">
          <label>
            App ID
            <input
              type="text"
              value={connectAppId}
              onChange={(event) => setConnectAppId(event.target.value)}
              placeholder="App ID (optioneel als MENDIX_APP_ID server-side staat)"
            />
          </label>
          <label>
            Branch
            <input
              type="text"
              value={connectBranch}
              onChange={(event) => setConnectBranch(event.target.value)}
              placeholder="main"
            />
          </label>
        </div>
        <div className="connect-actions">
          <button type="button" onClick={() => void handleConnectClick()} disabled={Boolean(loadingLabel)}>
            Connect
          </button>
          <button
            type="button"
            onClick={() => void handleDisconnectClick()}
            disabled={!status.connected || Boolean(loadingLabel)}
          >
            Disconnect
          </button>
          <button type="button" onClick={() => void refreshStatus()} disabled={Boolean(loadingLabel)}>
            Refresh status
          </button>
        </div>
        <div className={`status-badge ${status.connected ? "connected" : "disconnected"}`}>
          <strong>Status:</strong> {statusText}
        </div>
      </section>

      {loadingLabel ? <p className="banner loading">{loadingLabel}</p> : null}
      {errorMessage ? <p className="banner error">{errorMessage}</p> : null}

      <main className="content-grid">
        <aside className="sidebar">
          <header className="sidebar-header">
            <h2>Explorer</h2>
            <button type="button" onClick={() => void loadModules()} disabled={!status.connected || Boolean(loadingLabel)}>
              Reload modules
            </button>
          </header>

          <section>
            <h3>Modules</h3>
            <ul>
              {explorer.modules.map((moduleInfo) => (
                <li key={moduleInfo.name}>
                  <button
                    type="button"
                    className={selectedModule === moduleInfo.name ? "selected" : ""}
                    onClick={() => void selectModule(moduleInfo.name)}
                  >
                    {moduleInfo.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Entities</h3>
            <ul>
              {explorer.entities.map((entity) => (
                <li key={entity.qualifiedName}>
                  <button
                    type="button"
                    className={selectedQualifiedName === entity.qualifiedName ? "selected" : ""}
                    onClick={() => void openEntity(entity.qualifiedName)}
                  >
                    {entity.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Microflows</h3>
            <ul>
              {explorer.microflows.map((microflow) => (
                <li key={microflow.qualifiedName}>
                  <button
                    type="button"
                    className={selectedQualifiedName === microflow.qualifiedName ? "selected" : ""}
                    onClick={() => void openMicroflow(microflow.qualifiedName)}
                  >
                    {microflow.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Pages</h3>
            <ul>
              {explorer.pages.map((page) => (
                <li key={page.qualifiedName}>
                  <button
                    type="button"
                    className={selectedQualifiedName === page.qualifiedName ? "selected" : ""}
                    onClick={() => void openPage(page.qualifiedName)}
                  >
                    {page.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className="main-pane">
          <nav className="tabs">
            <button
              type="button"
              className={activeTab === "explorer" ? "active" : ""}
              onClick={() => setActiveTab("explorer")}
            >
              Explorer
            </button>
            <button
              type="button"
              className={activeTab === "chat" ? "active" : ""}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>
            <button
              type="button"
              className={activeTab === "actions" ? "active" : ""}
              onClick={() => setActiveTab("actions")}
            >
              Actions
            </button>
          </nav>

          {activeTab === "explorer" ? <OutputBlock title={detailOutput.title} text={detailOutput.text} /> : null}

          {activeTab === "actions" ? (
            <div className="actions-layout">
              <section className="action-controls">
                <h3>Quick actions</h3>
                <label>
                  Module
                  <input
                    type="text"
                    value={quickModule}
                    onChange={(event) => setQuickModule(event.target.value)}
                    placeholder="bijv. Sales"
                  />
                </label>
                <label>
                  Microflow qualified name
                  <input
                    type="text"
                    value={quickMicroflow}
                    onChange={(event) => setQuickMicroflow(event.target.value)}
                    placeholder="bijv. Sales.ACT_Order_Create"
                  />
                </label>
                <button type="button" onClick={() => void runReviewModule()}>
                  Review module
                </button>
                <button type="button" onClick={() => void runSecurityAudit()}>
                  Security audit
                </button>
                <button type="button" onClick={() => void runExplainMicroflow()}>
                  Explain microflow
                </button>
              </section>
              <OutputBlock title={actionOutput.title} text={actionOutput.text} />
            </div>
          ) : null}

          {activeTab === "chat" ? (
            <div className="chat-layout">
              <section className="chat-panel">
                <div className="chat-messages">
                  {chatMessages.map((message, index) => (
                    <article key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                      <h4>{message.role === "user" ? "You" : "Copilot"}</h4>
                      <pre>{message.text}</pre>
                    </article>
                  ))}
                  {chatBusy && chatDraft ? (
                    <article className="chat-message assistant">
                      <h4>Copilot</h4>
                      <pre>{chatDraft}</pre>
                    </article>
                  ) : null}
                </div>

                <form className="chat-input" onSubmit={(event) => void handleChatSubmit(event)}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Stel een vraag over je Mendix model..."
                    disabled={chatBusy}
                  />
                  <button type="submit" disabled={chatBusy || !status.connected}>
                    {chatBusy ? "Running..." : "Send"}
                  </button>
                </form>
              </section>

              <aside className="trace-panel">
                <header>
                  <h3>Tool trace</h3>
                  <button type="button" onClick={() => setTrace([])}>
                    Clear
                  </button>
                </header>
                <ul>
                  {trace.map((entry, index) => (
                    <li key={`${entry.timestamp}-${index}`} className={entry.event}>
                      <span>{entry.timestamp}</span>
                      <strong>{entry.event}</strong>
                      <p>{entry.message}</p>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
