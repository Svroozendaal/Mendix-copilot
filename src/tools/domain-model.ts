import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MendixCache } from "../mendix/cache.js";
import { MendixClient } from "../mendix/client.js";
import type { DomainModelInfo, EntityInfo } from "../mendix/client.js";
import {
  serializeAssociations,
  serializeDomainModel,
  serializeEntityDetails,
} from "../mendix/serializers/domain-model.js";

const ALL_ENTITIES_CACHE_KEY = "entities:all";

export function registerDomainModelTools(
  server: McpServer,
  mendixClient: MendixClient
): void {
  const cache = new MendixCache();

  server.tool(
    "get_domain_model",
    "Inspect the full domain model of a module, including entities, attributes, and associations.",
    {
      module: z.string().min(1),
      detailed: z.boolean().optional(),
    },
    async (params) => {
      try {
        const cacheKey = `domainmodel:${params.module}`;
        let domainModel = cache.get<DomainModelInfo>(cacheKey);
        if (!domainModel) {
          domainModel = await mendixClient.getDomainModel(params.module);
          cache.set(cacheKey, domainModel);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: serializeDomainModel(domainModel, {
                detailed: params.detailed ?? false,
              }),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting domain model for '${params.module}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_entity_details",
    "Get deep details for a single entity by qualified name (Module.Entity).",
    {
      qualifiedName: z.string().min(1),
    },
    async (params) => {
      try {
        const cacheKey = `entity:${params.qualifiedName}`;
        let entity = cache.get<EntityInfo>(cacheKey);
        if (!entity) {
          entity = await mendixClient.getEntityDetails(params.qualifiedName);
          cache.set(cacheKey, entity);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: serializeEntityDetails(entity),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting entity details for '${params.qualifiedName}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_associations",
    "List all associations where the provided entity participates, as source or target.",
    {
      qualifiedName: z.string().min(1),
    },
    async (params) => {
      try {
        const entityCacheKey = `entity:${params.qualifiedName}`;
        let entity = cache.get<EntityInfo>(entityCacheKey);
        if (!entity) {
          entity = await mendixClient.getEntityDetails(params.qualifiedName);
          cache.set(entityCacheKey, entity);
        }

        let allEntities = cache.get<EntityInfo[]>(ALL_ENTITIES_CACHE_KEY);
        if (!allEntities) {
          allEntities = await mendixClient.getAllEntities();
          cache.set(ALL_ENTITIES_CACHE_KEY, allEntities);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: serializeAssociations(entity, allEntities),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting associations for '${params.qualifiedName}': ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
