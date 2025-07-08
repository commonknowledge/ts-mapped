import { gql } from "@apollo/client";

export const LIST_MAPS_QUERY = gql`
  query ListMaps($organisationId: String!) {
    maps(organisationId: $organisationId) {
      id
      name
      createdAt
      imageUrl
    }
  }
`;
