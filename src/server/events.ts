interface BaseDataSourceEvent {
  dataSourceId: string;
  at: Date;
}

interface EnrichmentCompleteEvent extends BaseDataSourceEvent {
  event: "EnrichmentComplete";
}
interface EnrichmentFailedEvent extends BaseDataSourceEvent {
  event: "EnrichmentFailed";
}
interface EnrichmentStartedEvent extends BaseDataSourceEvent {
  event: "EnrichmentStarted";
}
interface ImportCompleteEvent extends BaseDataSourceEvent {
  event: "ImportComplete";
}
interface ImportFailedEvent extends BaseDataSourceEvent {
  event: "ImportFailed";
}
interface ImportStartedEvent extends BaseDataSourceEvent {
  event: "ImportStarted";
}
interface RecordsEnrichedEvent extends BaseDataSourceEvent {
  event: "RecordsEnriched";
  count: number;
}
interface RecordsImportedEvent extends BaseDataSourceEvent {
  event: "RecordsImported";
  count: number;
}

export type DataSourceEvent =
  | EnrichmentCompleteEvent
  | EnrichmentFailedEvent
  | EnrichmentStartedEvent
  | ImportCompleteEvent
  | ImportFailedEvent
  | ImportStartedEvent
  | RecordsEnrichedEvent
  | RecordsImportedEvent;
