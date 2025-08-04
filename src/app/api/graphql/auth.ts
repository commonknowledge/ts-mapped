import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import {
  GraphQLError,
  GraphQLNonNull,
  GraphQLSchema,
  defaultFieldResolver,
} from "graphql";
import { AuthDirectiveArgs, ProtectedArgs } from "@/__generated__/types";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { findMapById } from "@/server/repositories/Map";
import { findOrganisationUser } from "@/server/repositories/OrganisationUser";
import logger from "@/server/services/logger";
import { GraphQLContext } from "./context";

type AccessType = keyof AuthDirectiveArgs;

/**
 * Handle @auth(...) directives (see https://the-guild.dev/graphql/tools/docs/schema-directives)
 */
export const applyAuthDirective = (schema: GraphQLSchema) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective: AuthDirectiveArgs | undefined = getDirective(
        schema,
        fieldConfig,
        "auth",
      )?.[0];
      if (!authDirective) {
        return fieldConfig;
      }
      const isNonNullable = fieldConfig.type instanceof GraphQLNonNull;
      if (isNonNullable) {
        throw new Error(
          `Field ${fieldConfig.astNode?.name.value} must be nullable to use the @auth directive.`,
        );
      }
      const { resolve = defaultFieldResolver } = fieldConfig;
      return {
        ...fieldConfig,
        resolve: async function (source, args, context: GraphQLContext, info) {
          const authSuccess = await _checkAuth(authDirective, args, context);
          if (!authSuccess) {
            throw new GraphQLError("Unauthorized");
          }
          return resolve(source, args, context, info);
        },
      };
    },
  });
};

export const _checkAuth = async (
  authDirective: AuthDirectiveArgs,
  fieldArgs: Record<string, string>,
  context: GraphQLContext,
): Promise<boolean> => {
  try {
    const userId = context.currentUser?.id;

    if (authDirective.write) {
      const canWrite = await _checkArgs(
        authDirective.write,
        fieldArgs,
        userId,
        "write",
      );
      if (!canWrite) {
        return false;
      }
    }

    if (authDirective.read) {
      const canRead = await _checkArgs(
        authDirective.read,
        fieldArgs,
        userId,
        "read",
      );
      if (!canRead) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error("Auth error", { error });
    return false;
  }
};

export const _checkArgs = async (
  protectedArgs: ProtectedArgs,
  fieldArgs: Record<string, string>,
  userId: string | null | undefined,
  accessType: AccessType,
) => {
  // Restructure protectedArgs for simpler TypeScript inference
  // e.g. { dataSourceIdArg: "id", mapIdArg: "mapId" } => [["dataSourceIdArg", "id"], ["mapIdArg", "mapId"]]
  const argTypesAndNames = Object.entries(protectedArgs) as [
    keyof ProtectedArgs,
    string,
  ][];
  for (const [argType, argName] of argTypesAndNames) {
    const fieldValue = fieldArgs[argName];
    const success = await _checkArg(argType, fieldValue, userId, accessType);
    if (!success) {
      return false;
    }
  }
  return true;
};

export const _checkArg = (
  argType: keyof ProtectedArgs,
  fieldValue: string | null | undefined,
  userId: string | null | undefined,
  accessType: AccessType,
) => {
  // Select the guard using a map to ensure that all arg types have guards
  const guard = {
    dataSourceIdArg: _dataSourceGuard,
    mapIdArg: _mapGuard,
    organisationIdArg: _organisationGuard,
  }[argType];
  return guard(fieldValue, userId, accessType);
};

export const _dataSourceGuard = async (
  dataSourceId: string | null | undefined,
  userId: string | null | undefined,
  accessType: AccessType,
) => {
  if (!dataSourceId) {
    return false;
  }

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    return false;
  }

  if (accessType === "read" && dataSource.public) {
    return true;
  }

  if (!userId) {
    return false;
  }

  const organisationUser = await findOrganisationUser(
    dataSource.organisationId,
    userId,
  );
  if (!organisationUser) {
    return false;
  }

  return true;
};

export const _mapGuard = async (
  mapId: string | null | undefined,
  userId: string | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  accessType: AccessType,
) => {
  if (!mapId || !userId) {
    return false;
  }

  const map = await findMapById(mapId);
  if (!map) {
    return false;
  }

  const organisationUser = await findOrganisationUser(
    map.organisationId,
    userId,
  );
  if (!organisationUser) {
    return false;
  }

  return true;
};

export const _organisationGuard = async (
  organisationId: string | null | undefined,
  userId: string | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  accessType: AccessType,
) => {
  if (!organisationId || !userId) {
    return false;
  }

  const organisationUser = await findOrganisationUser(organisationId, userId);
  if (!organisationUser) {
    return false;
  }

  return true;
};
