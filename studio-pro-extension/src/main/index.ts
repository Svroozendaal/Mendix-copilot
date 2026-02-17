import type {
  ActiveDocumentInfo,
  DockablePaneHandle,
  IComponent,
  Menu,
  StudioProApi,
} from "@mendix/extensions-api";
import { getStudioProApi } from "@mendix/extensions-api";
import {
  type WbBridgeMessage,
  type WbContextPayload,
  WB_CONTEXT_MESSAGE_TYPE,
  createEmptyContextPayload,
  isContextRequestMessage,
  normalizeWbContextPayload,
} from "../shared/context";

const PANE_TITLE = "WellBased Copilot Panel";
const PANE_INITIAL_POSITION = "right";
const COMPONENT_NAME = "extension/wellbased-copilot-panel";
const UI_ENTRYPOINT = "dockablepane";

const ROOT_MENU_ID = "wellbased-copilot-panel.root";
const OPEN_MENU_ID = "wellbased-copilot-panel.open";
const CLOSE_MENU_ID = "wellbased-copilot-panel.close";

let paneHandlePromise: Promise<DockablePaneHandle> | null = null;
let latestContext: WbContextPayload = createEmptyContextPayload();
let menuRegistered = false;
let bridgeRegistered = false;

function parsePort(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }

  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
    return undefined;
  }

  return String(parsed);
}

function contextFromActiveDocument(info: ActiveDocumentInfo | null): WbContextPayload {
  if (!info) {
    return createEmptyContextPayload();
  }

  const moduleName = info.moduleName ?? undefined;
  const documentName = info.documentName ?? undefined;
  const documentType = info.documentType ?? "";

  let selectedType: WbContextPayload["selectedType"] = null;
  if (documentType === "DomainModels$Entity") {
    selectedType = "entity";
  } else if (documentType === "Microflows$Microflow") {
    selectedType = "microflow";
  } else if (documentType === "Pages$Page") {
    selectedType = "page";
  } else if (documentType === "DomainModels$DomainModel" || moduleName) {
    selectedType = "module";
  }

  const qualifiedName =
    selectedType === "module"
      ? moduleName
      : moduleName && documentName
        ? `${moduleName}.${documentName}`
        : undefined;

  return normalizeWbContextPayload({
    selectedType,
    module: moduleName,
    qualifiedName,
  });
}

async function publishContext(studioPro: StudioProApi, payload: WbContextPayload): Promise<void> {
  latestContext = normalizeWbContextPayload(payload);
  await studioPro.ui.messagePassing.sendMessage({
    type: WB_CONTEXT_MESSAGE_TYPE,
    payload: latestContext,
  });
}

async function refreshAndPublishContext(studioPro: StudioProApi): Promise<void> {
  try {
    const activeDocument = await studioPro.ui.editors.getActiveDocument();
    await publishContext(studioPro, contextFromActiveDocument(activeDocument));
  } catch {
    await publishContext(studioPro, createEmptyContextPayload());
  }
}

async function registerContextBridge(studioPro: StudioProApi): Promise<void> {
  if (bridgeRegistered) {
    return;
  }

  try {
    studioPro.ui.editors.addEventListener("activeDocumentChanged", ({ info }) => {
      void publishContext(studioPro, contextFromActiveDocument(info));
    });
  } catch {
    await publishContext(studioPro, createEmptyContextPayload());
  }

  await studioPro.ui.messagePassing.addMessageHandler<WbBridgeMessage>(
    async ({ messageId, message }) => {
      if (!isContextRequestMessage(message)) {
        return;
      }
      await studioPro.ui.messagePassing.sendResponse(messageId, latestContext);
    }
  );

  bridgeRegistered = true;
  await refreshAndPublishContext(studioPro);
}

function buildMenu(studioPro: StudioProApi, handle: DockablePaneHandle): Menu {
  return {
    caption: PANE_TITLE,
    menuId: ROOT_MENU_ID,
    subMenus: [
      {
        caption: "Open Panel",
        menuId: OPEN_MENU_ID,
        action: async () => {
          await studioPro.ui.panes.open(handle);
          await refreshAndPublishContext(studioPro);
        },
      },
      {
        caption: "Close Panel",
        menuId: CLOSE_MENU_ID,
        action: async () => {
          await studioPro.ui.panes.close(handle);
        },
      },
    ],
  };
}

function isAlreadyRegisteredError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("already") || message.includes("exists");
}

async function registerMenu(studioPro: StudioProApi, handle: DockablePaneHandle): Promise<void> {
  if (menuRegistered) {
    return;
  }

  try {
    await studioPro.ui.extensionsMenu.add(buildMenu(studioPro, handle));
    menuRegistered = true;
  } catch (error) {
    if (isAlreadyRegisteredError(error)) {
      menuRegistered = true;
      return;
    }
    throw error;
  }
}

function registerPane(studioPro: StudioProApi): Promise<DockablePaneHandle> {
  if (paneHandlePromise) {
    return paneHandlePromise;
  }

  const queryParams: Record<string, string> = {
    embedded: "1",
  };

  const configuredPort = parsePort(process.env.WB_COPILOT_WEB_UI_PORT);
  if (configuredPort) {
    queryParams.webUiPort = configuredPort;
  }

  paneHandlePromise = studioPro.ui.panes.register(
    {
      title: PANE_TITLE,
      initialPosition: PANE_INITIAL_POSITION,
    },
    {
      componentName: COMPONENT_NAME,
      uiEntrypoint: UI_ENTRYPOINT,
      queryParams,
    }
  );

  return paneHandlePromise;
}

export const component: IComponent = {
  async loaded(componentContext) {
    const studioPro = getStudioProApi(componentContext);

    try {
      const paneHandle = await registerPane(studioPro);
      await registerContextBridge(studioPro);
      await registerMenu(studioPro, paneHandle);
      await studioPro.ui.panes.open(paneHandle);
      await refreshAndPublishContext(studioPro);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await studioPro.ui.messageBoxes.show(
        "error",
        "WellBased Copilot Panel kon niet worden gestart.",
        message
      );
    }
  },
};
