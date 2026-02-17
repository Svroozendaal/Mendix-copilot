using System.Text.Json.Nodes;

namespace WellBased.Copilot.StudioPro10;

internal sealed record StudioContextPayload(
    string? SelectedType,
    string? QualifiedName,
    string? Module)
{
    public static StudioContextPayload Empty { get; } = new(
        SelectedType: null,
        QualifiedName: null,
        Module: null);

    public JsonObject ToJsonObject()
    {
        var payload = new JsonObject
        {
            ["selectedType"] = SelectedType is null ? null : JsonValue.Create(SelectedType),
        };

        if (!string.IsNullOrWhiteSpace(QualifiedName))
        {
            payload["qualifiedName"] = QualifiedName;
        }

        if (!string.IsNullOrWhiteSpace(Module))
        {
            payload["module"] = Module;
        }

        return payload;
    }
}
