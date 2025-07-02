import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import {
  GraphQLError,
  GraphQLNonNull,
  GraphQLSchema,
  defaultFieldResolver,
} from "graphql";
import { AuthDirectiveArgs } from "@/__generated__/types";
import { findDataSourceByIdAndUserId } from "@/server/repositories/DataSource";
import { findMapById } from "@/server/repositories/Map";
import { findOrganisationUser } from "@/server/repositories/OrganisationUser";
import logger from "@/server/services/logger";
import { GraphQLContext } from "./context";

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
          const authSuccess = await checkAuth(authDirective, args, context);
          if (!authSuccess) {
            throw new GraphQLError("Unauthorized");
          }
          return resolve(source, args, context, info);
        },
      };
    },
  });
};

const checkAuth = async (
  authDirective: AuthDirectiveArgs,
  fieldArgs: Record<string, string>,
  context: GraphQLContext,
): Promise<boolean> => {
  try {
    const userId = context.currentUser?.id;
    if (!userId) {
      return false;
    }
    // At the moment, all users have read/write permissions on their
    // organisations and data sources
    const argNames = { ...authDirective.read, ...authDirective.write };
    if (argNames.organisationIdArg) {
      const organisationId = fieldArgs[argNames.organisationIdArg];
      const organisationUser = await findOrganisationUser(
        organisationId,
        userId,
      );
      if (!organisationUser) {
        return false;
      }
    }
    if (argNames.dataSourceIdArg) {
      const dataSourceId = fieldArgs[argNames.dataSourceIdArg];
      const dataSource = await findDataSourceByIdAndUserId(
        dataSourceId,
        userId,
      );
      if (!dataSource) {
        return false;
      }
    }
    if (argNames.mapIdArg) {
      const mapId = fieldArgs[argNames.mapIdArg];
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
    }
    return true;
  } catch (error) {
    logger.error("Auth error", { error });
    return false;
  }
};
