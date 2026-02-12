import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from "kysely";

export interface QueryLog {
  sql: string;
  params: readonly unknown[];
  duration: number;
  operation: string;
}

export class QueryLoggerPlugin implements KyselyPlugin {
  private logs: QueryLog[] = [];

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return args.node;
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    const start = performance.now();
    const result = await args.result;
    const duration = performance.now() - start;

    // Note: QueryId doesn't expose sql/parameters directly in this Kysely version
    // We track queries by counting them instead
    const operation = "QUERY";

    this.logs.push({
      sql: "", // Not available in this API
      params: [],
      duration,
      operation,
    });

    return result;
  }

  getLogs(): QueryLog[] {
    return this.logs;
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      SELECT: 0,
      INSERT: 0,
      UPDATE: 0,
      DELETE: 0,
      totalDuration: 0,
    };

    for (const log of this.logs) {
      stats[log.operation as keyof typeof stats] =
        (stats[log.operation as keyof typeof stats] || 0) + 1;
      stats.totalDuration += log.duration;
    }

    return stats;
  }

  reset() {
    this.logs = [];
  }
}
