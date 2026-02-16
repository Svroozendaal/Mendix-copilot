import type {
  EntityAccessInfo,
  EntityPermissionInfo,
  SecurityOverviewInfo,
} from "../client.js";

function formatPermission(permission?: EntityPermissionInfo): string {
  if (!permission) {
    return "-";
  }

  let code = "";
  if (permission.create) {
    code += "C";
  }
  if (permission.read) {
    code += "R";
  }
  if (permission.update) {
    code += "U";
  }
  if (permission.delete) {
    code += "D";
  }

  if (!code) {
    return "-";
  }

  return permission.ownOnly ? `${code} (eigen)` : code;
}

function collectRoleNames(overview: SecurityOverviewInfo): string[] {
  const userRoleNames = overview.userRoles.map((role) => role.name);
  const permissionRoleNames = overview.modules.flatMap((module) =>
    module.entities.flatMap((entity) => entity.permissions.map((permission) => permission.role))
  );

  return Array.from(new Set([...userRoleNames, ...permissionRoleNames])).sort((left, right) =>
    left.localeCompare(right)
  );
}

export function serializeSecurityOverview(overview: SecurityOverviewInfo): string {
  const roleNames = collectRoleNames(overview);
  const lines: string[] = [
    "## Security Overview",
    "",
    `Security ingeschakeld: ${overview.securityEnabled ? "ja" : "nee"}`,
    "",
    "### User Roles",
  ];

  if (overview.userRoles.length === 0) {
    lines.push("- (geen user roles gevonden)");
  } else {
    for (const userRole of overview.userRoles) {
      const moduleRoles =
        userRole.moduleRoles.length > 0
          ? userRole.moduleRoles.join(", ")
          : "(geen module roles)";
      lines.push(`- ${userRole.name} -> [${moduleRoles}]`);
    }
  }

  for (const module of overview.modules) {
    lines.push("");
    lines.push(`### Module: ${module.moduleName}`);

    if (module.entities.length === 0) {
      lines.push("- (geen entities)");
      continue;
    }

    if (roleNames.length === 0) {
      lines.push("- (geen rollen beschikbaar voor matrix)");
      continue;
    }

    lines.push("");
    lines.push(`| Entity | ${roleNames.join(" | ")} |`);
    lines.push(`| ${["---", ...roleNames.map(() => "---")].join(" | ")} |`);

    for (const entity of module.entities) {
      const columns = roleNames.map((roleName) =>
        formatPermission(entity.permissions.find((permission) => permission.role === roleName))
      );
      lines.push(`| ${entity.entityName} | ${columns.join(" | ")} |`);
    }
  }

  lines.push("");
  lines.push("Legenda: C=Create, R=Read, U=Update, D=Delete, (eigen)=alleen eigen objecten");

  return lines.join("\n");
}

export function serializeEntityAccess(entityAccess: EntityAccessInfo): string {
  const lines: string[] = [
    `## Entity: ${entityAccess.qualifiedName}`,
    "",
  ];

  if (entityAccess.rules.length === 0) {
    lines.push("Geen access rules gevonden.");
    return lines.join("\n");
  }

  for (const rule of entityAccess.rules) {
    lines.push(`### Role: ${rule.role}`);
    lines.push(`- Create: ${rule.create ? "✅" : "❌"}`);
    lines.push(`- Read: ${rule.read ? "✅" : "❌"}`);
    lines.push(`- Update: ${rule.update ? "✅" : "❌"}`);
    lines.push(`- Delete: ${rule.delete ? "✅" : "❌"}`);
    if (rule.ownOnly) {
      lines.push("- Scope: alleen eigen objecten");
    }
    if (rule.xpathConstraint) {
      lines.push(`- XPath constraint: ${rule.xpathConstraint}`);
    }

    lines.push("- Attributen:");
    if (rule.attributePermissions.length === 0) {
      lines.push("  - (geen attributen)");
    } else {
      for (const attribute of rule.attributePermissions) {
        const permission = attribute.write
          ? "Read/Write"
          : attribute.read
            ? "Read"
            : "-";
        lines.push(`  - ${attribute.attribute}: ${permission}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
