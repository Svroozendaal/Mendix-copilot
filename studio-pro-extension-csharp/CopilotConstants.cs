namespace WellBased.Copilot.StudioPro10;

internal static class CopilotConstants
{
    public const string PaneId = "wellbased-copilot-panel";
    public const string PaneTitle = "WellBased Copilot Panel";
    public const string WebServerRoutePrefix = "wellbased-copilot";
    public const string EmbeddedHost = "studio-pro-extension-csharp";

    public const string ContextMessageType = "WB_CONTEXT";
    public const string ContextRequestMessageType = "WB_CONTEXT_REQUEST";
    public const string EmbeddedMessageType = "WB_EMBEDDED";
    public const string MessageListenerRegistered = "MessageListenerRegistered";

    public const string LocalStoragePortKey = "wb.copilot.webUiPort";
    public const string PortEnvironmentVariable = "WB_COPILOT_WEB_UI_PORT";
    public const string DefaultWebUiPortA = "5173";
    public const string DefaultWebUiPortB = "3000";
}
