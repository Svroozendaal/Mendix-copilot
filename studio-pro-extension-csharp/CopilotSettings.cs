namespace WellBased.Copilot.StudioPro10;

internal static class CopilotSettings
{
    public static string? ReadConfiguredPort() =>
        NormalizePort(Environment.GetEnvironmentVariable(CopilotConstants.PortEnvironmentVariable));

    public static string? NormalizePort(string? rawPort)
    {
        if (string.IsNullOrWhiteSpace(rawPort))
        {
            return null;
        }

        if (!int.TryParse(rawPort.Trim(), out var parsedPort))
        {
            return null;
        }

        if (parsedPort is < 1 or > 65535)
        {
            return null;
        }

        return parsedPort.ToString();
    }
}
