import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  connect,
  createPlan,
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
  streamPlanExecute,
  validatePlan,
  type ChangePlan,
  type PlanPreview,
  type ApiStatus,
} from "./api-client";

type Tab = "explorer" | "chat" | "actions";
type ExecutionView = "progress" | "log";

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

interface ExecutionLogEntry {
  timestamp: string;
  event:
    | "command_start"
    | "command_success"
    | "command_failed"
    | "commit_done"
    | "postcheck_results"
    | "error";
  message: string;
  commandText?: string;
}

interface ActivePlanState {
  prompt: string;
  changePlan: ChangePlan;
  preview: PlanPreview;
  validationWarnings: string[];
  validationErrors: string[];
}

interface ErrorPayload {
  message?: string;
}

interface CommandEventPayload {
  commandIndex?: number;
  totalCommands?: number;
  command?: Record<string, unknown>;
  notes?: string[];
  error?: string;
}

interface CommitDonePayload {
  commitMessage?: string;
}

interface PostcheckPayload {
  affectedModules?: string[];
  postCheck?: Array<{ module?: string; findingCount?: number }>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function renderCommand(command: unknown): string | undefined {
  if (!command || typeof command !== "object") {
    return undefined;
  }

  try {
    return JSON.stringify(command, null, 2);
  } catch {
    return undefined;
  }
}

function riskClass(impactLevel: ChangePlan["risk"]["impactLevel"]): string {
  if (impactLevel === "high") {
    return "risk-high";
  }
  if (impactLevel === "medium") {
    return "risk-medium";
  }
  return "risk-low";
}

function OutputBlock({ title, text }: DetailOutput) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
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
  const [chatBusy, setChatBusy] = useState(false);
  const [activePlan, setActivePlan] = useState<ActivePlanState | null>(null);
  const [planStatus, setPlanStatus] = useState<"none" | "preview" | "running" | "completed">("none");
  const [approvalToken, setApprovalToken] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([]);
  const [executionSummary, setExecutionSummary] = useState<string>("");
  const [executionView, setExecutionView] = useState<ExecutionView>("progress");

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

  const expectedConfirmText = activePlan ? confirmationTarget(activePlan.changePlan) : "";
  const needsDestructiveConfirm = Boolean(activePlan?.preview.destructive);
  const destructiveConfirmMatches = !needsDestructiveConfirm || confirmText.trim() === expectedConfirmText;
  const canApprove =
    Boolean(activePlan) &&
    status.connected &&
    planStatus === "preview" &&
    !chatBusy &&
    approvalToken.trim().length > 0 &&
    destructiveConfirmMatches;

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
      resetPlanFlow();
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

  function confirmationTarget(plan: ChangePlan): string {
    return plan.target.microflow || plan.target.entity || plan.target.module || plan.planId;
  }

  function pushExecutionLog(
    eventName: ExecutionLogEntry["event"],
    message: string,
    commandText?: string
  ): void {
    setExecutionLog((previous) =>
      [
        ...previous,
        {
          timestamp: new Date().toISOString(),
          event: eventName,
          message,
          commandText,
        },
      ].slice(-400)
    );
  }

  function appendExecutionSummary(line: string): void {
    setExecutionSummary((previous) => (previous ? `${previous}\n${line}` : line));
  }

  function resetPlanFlow(): void {
    setActivePlan(null);
    setPlanStatus("none");
    setConfirmText("");
    setExecutionLog([]);
    setExecutionSummary("");
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatBusy) {
      return;
    }
    if (!status.connected) {
      setErrorMessage("Verbind eerst met een Mendix app.");
      return;
    }
    if (planStatus !== "none") {
      setErrorMessage("Er is al een actief plan. Gebruik Reject, Edit Prompt of Nieuw plan.");
      return;
    }

    setChatBusy(true);
    setErrorMessage(null);
    setExecutionLog([]);
    setExecutionSummary("");
    setExecutionView("progress");

    try {
      const planned = await createPlan(message, {
        module: selectedModule ?? undefined,
      });

      setActivePlan({
        prompt: message,
        changePlan: planned.changePlan,
        preview: planned.preview,
        validationWarnings: [],
        validationErrors: [],
      });
      setPlanStatus("preview");
      pushExecutionLog("command_start", `Plan generated: ${planned.changePlan.planId}`);
      setChatInput("");
      setConfirmText("");
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      setErrorMessage(messageText);
      pushExecutionLog("error", messageText);
    } finally {
      setChatBusy(false);
    }
  }

  async function handleApprovePlan(): Promise<void> {
    if (!activePlan || planStatus !== "preview") {
      return;
    }
    if (!approvalToken.trim()) {
      setErrorMessage("Approval token is verplicht.");
      return;
    }

    if (needsDestructiveConfirm && !destructiveConfirmMatches) {
      setErrorMessage(`Type exact '${expectedConfirmText}' om destructive wijzigingen te bevestigen.`);
      return;
    }

    setChatBusy(true);
    setErrorMessage(null);
    setExecutionView("progress");

    try {
      const validation = await validatePlan(activePlan.changePlan.planId);
      setActivePlan((previous) =>
        previous
          ? {
              ...previous,
              validationWarnings: validation.warnings,
              validationErrors: validation.errors,
              preview: validation.preview,
            }
          : previous
      );

      if (validation.errors.length > 0) {
        setErrorMessage("Plan validatie faalde. Corrigeer de prompt en genereer opnieuw.");
        pushExecutionLog("error", `Validation errors: ${validation.errors.join(" | ")}`);
        return;
      }

      if (validation.warnings.length > 0) {
        pushExecutionLog("postcheck_results", `Validation warnings: ${validation.warnings.join(" | ")}`);
      }

      setPlanStatus("running");
      appendExecutionSummary("Execution gestart.");

      let finalReceived = false;

      await streamPlanExecute(
        {
          planId: activePlan.changePlan.planId,
          approvalToken: approvalToken.trim(),
          confirmText: needsDestructiveConfirm ? confirmText.trim() : undefined,
        },
        (streamEvent) => {
          const record = asRecord(streamEvent.data);

          if (streamEvent.event === "command_start") {
            const payload = record as CommandEventPayload | null;
            const commandType = payload?.command?.type;
            const commandLabel = typeof commandType === "string" ? commandType : "unknown";
            const idx = typeof payload?.commandIndex === "number" ? payload.commandIndex + 1 : "?";
            const total = typeof payload?.totalCommands === "number" ? payload.totalCommands : "?";
            pushExecutionLog(
              "command_start",
              `Start command ${idx}/${total}: ${commandLabel}`,
              renderCommand(payload?.command)
            );
            return;
          }

          if (streamEvent.event === "command_success") {
            const payload = record as CommandEventPayload | null;
            const commandType = payload?.command?.type;
            const commandLabel = typeof commandType === "string" ? commandType : "unknown";
            const notes = payload?.notes?.join(" | ") ?? "completed";
            pushExecutionLog(
              "command_success",
              `${commandLabel}: ${notes}`,
              renderCommand(payload?.command)
            );
            return;
          }

          if (streamEvent.event === "command_failed") {
            const payload = record as CommandEventPayload | null;
            const commandType = payload?.command?.type;
            const commandLabel = typeof commandType === "string" ? commandType : "unknown";
            const messageText = payload?.error ?? "failed";
            pushExecutionLog(
              "command_failed",
              `${commandLabel}: ${messageText}`,
              renderCommand(payload?.command)
            );
            setErrorMessage(messageText);
            setPlanStatus("preview");
            return;
          }

          if (streamEvent.event === "commit_done") {
            const payload = record as CommitDonePayload | null;
            const commitMessage = payload?.commitMessage ?? "Commit afgerond.";
            pushExecutionLog("commit_done", commitMessage);
            appendExecutionSummary(`Commit: ${commitMessage}`);
            return;
          }

          if (streamEvent.event === "postcheck_results") {
            const payload = record as PostcheckPayload | null;
            const postChecks =
              payload?.postCheck?.map(
                (item) => `${item.module ?? "unknown"}: ${item.findingCount ?? 0} findings`
              ) ?? [];
            const summaryText =
              postChecks.length > 0 ? postChecks.join(" | ") : "Geen post-check resultaten.";
            pushExecutionLog(
              "postcheck_results",
              summaryText
            );
            appendExecutionSummary(`Post-check: ${summaryText}`);
            return;
          }

          if (streamEvent.event === "final") {
            finalReceived = true;
            setPlanStatus("completed");
            pushExecutionLog("commit_done", "Execution voltooid.");
            return;
          }

          if (streamEvent.event === "error") {
            const payload = record as ErrorPayload | null;
            const messageText = payload?.message ?? "Onbekende execution-fout.";
            setErrorMessage(messageText);
            pushExecutionLog("error", messageText);
            setPlanStatus("preview");
          }
        }
      );

      if (!finalReceived) {
        setPlanStatus((previous) => (previous === "running" ? "completed" : previous));
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      setErrorMessage(messageText);
      pushExecutionLog("error", messageText);
      setPlanStatus("preview");
    } finally {
      setChatBusy(false);
    }
  }

  function handleRejectPlan(): void {
    pushExecutionLog("error", "Plan rejected door gebruiker.");
    resetPlanFlow();
  }

  function handleEditPrompt(): void {
    if (activePlan) {
      setChatInput(activePlan.prompt);
    }
    resetPlanFlow();
  }

  function handleStartNewPlan(): void {
    resetPlanFlow();
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
              <section className="chat-panel plan-panel">
                <form className="chat-input" onSubmit={(event) => void handleChatSubmit(event)}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Beschrijf de wijziging die je wilt plannen..."
                    disabled={chatBusy || planStatus === "running"}
                  />
                  <button
                    type="submit"
                    disabled={chatBusy || !status.connected || !chatInput.trim() || planStatus !== "none"}
                  >
                    {chatBusy ? "Running..." : "Generate plan"}
                  </button>
                </form>

                <p className="mode-banner">Mode: Plan only. Geen auto-execute.</p>

                {activePlan ? (
                  <section className="plan-preview-card">
                    <header className="plan-preview-header">
                      <div>
                        <h3>Plan preview</h3>
                        <p>{activePlan.changePlan.planId}</p>
                      </div>
                      <div className="plan-badges">
                        <span className={`risk-badge ${riskClass(activePlan.changePlan.risk.impactLevel)}`}>
                          Risk: {activePlan.changePlan.risk.impactLevel}
                        </span>
                        {activePlan.preview.destructive ? (
                          <span className="destructive-badge">Destructive</span>
                        ) : null}
                        <span className={`plan-status-badge ${planStatus}`}>Status: {planStatus}</span>
                      </div>
                    </header>

                    <div className="plan-preview-grid">
                      <section>
                        <h4>Prompt</h4>
                        <pre>{activePlan.prompt}</pre>
                      </section>
                      <section>
                        <h4>Summary</h4>
                        <ul className="plain-list">
                          {activePlan.preview.summary.map((line, index) => (
                            <li key={`${line}-${index}`}>{line}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h4>Affected artifacts</h4>
                        <ul className="plain-list">
                          {activePlan.preview.affectedArtifacts.map((artifact) => (
                            <li key={artifact}>
                              <code>{artifact}</code>
                            </li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h4>Risk notes</h4>
                        <ul className="plain-list">
                          {activePlan.changePlan.risk.notes.map((note, index) => (
                            <li key={`${note}-${index}`}>{note}</li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    {activePlan.validationWarnings.length > 0 ? (
                      <div className="validation-box warnings">
                        <h4>Validation warnings</h4>
                        <ul className="plain-list">
                          {activePlan.validationWarnings.map((warning, index) => (
                            <li key={`${warning}-${index}`}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {activePlan.validationErrors.length > 0 ? (
                      <div className="validation-box errors">
                        <h4>Validation errors</h4>
                        <ul className="plain-list">
                          {activePlan.validationErrors.map((validationError, index) => (
                            <li key={`${validationError}-${index}`}>{validationError}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="approval-form">
                      <label>
                        Approval token
                        <input
                          type="password"
                          value={approvalToken}
                          onChange={(event) => setApprovalToken(event.target.value)}
                          placeholder="Verplicht voor execute"
                          disabled={chatBusy || planStatus === "running"}
                        />
                      </label>

                      {needsDestructiveConfirm ? (
                        <label>
                          Type exact '{expectedConfirmText}' to confirm destructive change
                          <input
                            type="text"
                            value={confirmText}
                            onChange={(event) => setConfirmText(event.target.value)}
                            placeholder={expectedConfirmText}
                            disabled={chatBusy || planStatus === "running"}
                          />
                        </label>
                      ) : null}
                    </div>

                    <div className="plan-actions">
                      <button type="button" onClick={() => void handleApprovePlan()} disabled={!canApprove}>
                        Approve
                      </button>
                      <button type="button" onClick={handleRejectPlan} disabled={chatBusy || planStatus === "running"}>
                        Reject
                      </button>
                      <button type="button" onClick={handleEditPrompt} disabled={chatBusy || planStatus === "running"}>
                        Edit Prompt
                      </button>
                      <button
                        type="button"
                        onClick={handleStartNewPlan}
                        disabled={chatBusy || planStatus === "running"}
                      >
                        Nieuw plan
                      </button>
                    </div>
                  </section>
                ) : (
                  <p className="empty-plan">
                    Start met een NL prompt in de chat input. De UI genereert alleen een plan totdat je expliciet op
                    Approve klikt.
                  </p>
                )}

                {executionSummary ? (
                  <section className="execution-summary">
                    <header>
                      <h3>Execution summary</h3>
                      <button type="button" onClick={() => void navigator.clipboard.writeText(executionSummary)}>
                        Copy
                      </button>
                    </header>
                    <pre>{executionSummary}</pre>
                  </section>
                ) : null}
              </section>

              <aside className="trace-panel execution-panel">
                <header className="execution-header">
                  <h3>Execution</h3>
                  <button type="button" onClick={() => setExecutionLog([])}>
                    Clear
                  </button>
                </header>
                <nav className="execution-tabs">
                  <button
                    type="button"
                    className={executionView === "progress" ? "active" : ""}
                    onClick={() => setExecutionView("progress")}
                  >
                    Progress
                  </button>
                  <button
                    type="button"
                    className={executionView === "log" ? "active" : ""}
                    onClick={() => setExecutionView("log")}
                  >
                    Execution Log
                  </button>
                </nav>
                <ul>
                  {executionLog.map((entry, index) => (
                    <li key={`${entry.timestamp}-${index}`} className={entry.event}>
                      <span>{entry.timestamp}</span>
                      <strong>{entry.event}</strong>
                      <p>{entry.message}</p>
                      {executionView === "log" && entry.commandText ? (
                        <pre className="execution-command">{entry.commandText}</pre>
                      ) : null}
                    </li>
                  ))}
                  {executionLog.length === 0 ? <li className="empty-log">Nog geen events.</li> : null}
                </ul>
              </aside>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
