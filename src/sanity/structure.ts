import { map } from "rxjs";
import type { StructureResolver } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S, context) => {
  // Helper function to create parent-child structure for features
  const featureHierarchy = () => {
    const filter = `_type == "featureSet" && !(_id in path("drafts.**"))`;
    const query = `*[${filter}]{ _id, title, order } | order(order asc)`;
    const options = { apiVersion: "2025-09-04" };

    return context.documentStore.listenQuery(query, {}, options).pipe(
      map((featureSets: { _id: string; title: string }[]) =>
        S.list()
          .title("Feature Sets")
          .items([
            // Create a list item for each feature set
            ...featureSets.map((featureSet: { _id: string; title: string }) =>
              S.listItem({
                id: featureSet._id,
                title: featureSet.title,
                schemaType: "featureSet",
                child: () =>
                  S.documentList()
                    .title(featureSet.title)
                    .filter(
                      `_type == "feature" && featureSet._ref == $featureSetId`
                    )
                    .params({ featureSetId: featureSet._id })
                    .canHandleIntent(
                      (intentName, params) =>
                        intentName === "create" &&
                        params.template === "feature-child"
                    )
                    .initialValueTemplates([
                      S.initialValueTemplateItem("feature-child", {
                        featureSetId: featureSet._id,
                      }),
                    ]),
              })
            ),
            S.divider(),
            // Show all feature sets
            S.listItem()
              .title("All Feature Sets")
              .child(
                S.documentTypeList("featureSet").title("All Feature Sets")
              ),

            // Show all features
            S.listItem()
              .title("All Feature Items")
              .child(S.documentTypeList("feature").title("All Feature Items")),
          ])
      )
    );
  };

  return S.list()
    .title("Content")
    .items([
      // Features section with dynamic hierarchy
      S.listItem().title("Features").child(featureHierarchy),

      // Solutions section
      S.listItem()
        .title("Solutions")
        .child(
          S.documentTypeList("solutions")
            .title("Solutions")
            .defaultOrdering([
              { field: "position", direction: "asc" },
              { field: "_createdAt", direction: "desc" },
            ])
        ),

      // News section
      S.listItem()
        .title("News")
        .child(S.documentTypeList("news").title("News")),
    ]);
};
