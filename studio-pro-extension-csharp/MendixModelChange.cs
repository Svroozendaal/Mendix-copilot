namespace AutoCommitMessage;

/// <summary>
/// Represents one logical model-level change detected from two Mendix model dumps.
/// </summary>
/// <param name="ChangeType">Change classification: Added, Modified, or Deleted.</param>
/// <param name="ElementType">Mendix element category, such as Entity, Page, or Microflow.</param>
/// <param name="ElementName">Human-readable element name.</param>
/// <param name="Details">Optional extra details about the change.</param>
public sealed record MendixModelChange(
    string ChangeType,
    string ElementType,
    string ElementName,
    string? Details = null);
