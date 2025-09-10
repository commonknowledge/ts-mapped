import { gql } from "@apollo/client";

export const DATA_SOURCE_QUERY = gql`
  query DataSource($id: String!) {
    dataSource(id: $id) {
      id
      name
      recordType
      autoEnrich
      autoImport
      columnDefs {
        name
        type
      }
      config
      columnRoles {
        nameColumns
      }
      enrichments {
        sourceType
        areaSetCode
        areaProperty
        dataSourceId
        dataSourceColumn
      }
      enrichmentDataSources {
        id
        name
      }
      geocodingConfig {
        type
        column
        columns
        areaSetCode
      }
      enrichmentInfo {
        lastCompleted
        status
      }
      importInfo {
        lastCompleted
        status
      }
      recordCount {
        count
      }
    }
  }
`;
