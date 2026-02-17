using Mendix.StudioPro.ExtensionsAPI.Model;
using Mendix.StudioPro.ExtensionsAPI.Model.Projects;
using Mendix.StudioPro.ExtensionsAPI.UI.Events;

namespace WellBased.Copilot.StudioPro10;

internal static class StudioContextMapper
{
    private static readonly HashSet<string> ValidSelectedTypes = new(StringComparer.Ordinal)
    {
        "module",
        "entity",
        "microflow",
        "page",
    };

    public static StudioContextPayload FromActiveDocument(ActiveDocumentChanged? change, IProject? project)
    {
        if (change is null)
        {
            return StudioContextPayload.Empty;
        }

        var selectedType = MapSelectedType(change.DocumentType);
        var documentName = NormalizeText(change.DocumentName);
        var activeDocument = TryGetActiveDocument(change, project);

        var qualifiedName = ResolveQualifiedName(selectedType, activeDocument, documentName);
        var moduleName = ResolveModuleName(selectedType, qualifiedName, activeDocument, documentName);

        if (selectedType == "module" && string.IsNullOrWhiteSpace(qualifiedName))
        {
            qualifiedName = moduleName ?? documentName;
        }

        return Normalize(selectedType, qualifiedName, moduleName);
    }

    private static IAbstractUnit? TryGetActiveDocument(ActiveDocumentChanged change, IProject? project)
    {
        if (project is null)
        {
            return null;
        }

        try
        {
            return change.GetDocument(project);
        }
        catch
        {
            return null;
        }
    }

    private static string? MapSelectedType(string? documentType)
    {
        return documentType switch
        {
            "DomainModels$Entity" => "entity",
            "Microflows$Microflow" => "microflow",
            "Pages$Page" => "page",
            "DomainModels$DomainModel" => "module",
            "Projects$Module" => "module",
            _ => null,
        };
    }

    private static string? ResolveQualifiedName(
        string? selectedType,
        IAbstractUnit? activeDocument,
        string? documentName)
    {
        var fromDocument = TryGetQualifiedName(activeDocument);
        if (!string.IsNullOrWhiteSpace(fromDocument))
        {
            return fromDocument;
        }

        if (!string.IsNullOrWhiteSpace(documentName) && documentName.Contains('.', StringComparison.Ordinal))
        {
            return documentName;
        }

        if (selectedType == "module")
        {
            return documentName;
        }

        return null;
    }

    private static string? ResolveModuleName(
        string? selectedType,
        string? qualifiedName,
        IAbstractUnit? activeDocument,
        string? documentName)
    {
        var fromQualifiedName = ModuleFromQualifiedName(qualifiedName);
        if (!string.IsNullOrWhiteSpace(fromQualifiedName))
        {
            return fromQualifiedName;
        }

        var fromContainer = TryGetModuleNameFromContainer(activeDocument);
        if (!string.IsNullOrWhiteSpace(fromContainer))
        {
            return fromContainer;
        }

        if (selectedType == "module")
        {
            return NormalizeText(documentName);
        }

        return null;
    }

    private static string? TryGetQualifiedName(object? candidate)
    {
        if (candidate is null)
        {
            return null;
        }

        var qualifiedNameProperty = candidate.GetType().GetProperty("QualifiedName");
        var qualifiedNameValue = qualifiedNameProperty?.GetValue(candidate);
        if (qualifiedNameValue is null)
        {
            return null;
        }

        if (qualifiedNameValue is string qualifiedNameString)
        {
            return NormalizeText(qualifiedNameString);
        }

        var fullNameProperty = qualifiedNameValue.GetType().GetProperty("FullName");
        var fullNameValue = fullNameProperty?.GetValue(qualifiedNameValue);
        return NormalizeText(fullNameValue as string);
    }

    private static string? TryGetModuleNameFromContainer(IAbstractUnit? activeDocument)
    {
        object? current = activeDocument;

        for (var depth = 0; depth < 32 && current is not null; depth++)
        {
            if (current is IModule module)
            {
                return NormalizeText(module.Name);
            }

            var currentTypeName = current.GetType().Name;
            var guessedName = TryGetStringProperty(current, "Name");
            if (!string.IsNullOrWhiteSpace(guessedName) &&
                currentTypeName.Contains("Module", StringComparison.OrdinalIgnoreCase))
            {
                return guessedName;
            }

            current = current.GetType().GetProperty("Container")?.GetValue(current);
        }

        return null;
    }

    private static string? TryGetStringProperty(object candidate, string propertyName)
    {
        var value = candidate.GetType().GetProperty(propertyName)?.GetValue(candidate) as string;
        return NormalizeText(value);
    }

    private static StudioContextPayload Normalize(
        string? selectedType,
        string? qualifiedName,
        string? moduleName)
    {
        var normalizedSelectedType =
            !string.IsNullOrWhiteSpace(selectedType) && ValidSelectedTypes.Contains(selectedType)
                ? selectedType
                : null;
        var normalizedQualifiedName = NormalizeText(qualifiedName);
        var normalizedModuleName = NormalizeText(moduleName) ?? ModuleFromQualifiedName(normalizedQualifiedName);

        if (normalizedSelectedType == "module" &&
            string.IsNullOrWhiteSpace(normalizedModuleName) &&
            !string.IsNullOrWhiteSpace(normalizedQualifiedName) &&
            !normalizedQualifiedName.Contains('.', StringComparison.Ordinal))
        {
            normalizedModuleName = normalizedQualifiedName;
        }

        return new StudioContextPayload(
            SelectedType: normalizedSelectedType,
            QualifiedName: normalizedQualifiedName,
            Module: normalizedModuleName);
    }

    private static string? ModuleFromQualifiedName(string? qualifiedName)
    {
        if (string.IsNullOrWhiteSpace(qualifiedName))
        {
            return null;
        }

        var separator = qualifiedName.IndexOf('.', StringComparison.Ordinal);
        if (separator <= 0)
        {
            return null;
        }

        return qualifiedName[..separator];
    }

    private static string? NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}
