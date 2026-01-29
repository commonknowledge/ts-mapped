import { FileText, Folder, Info, Newspaper, Puzzle, Video } from "lucide-react";
import { map } from "rxjs";
import type { StructureResolver } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S, context) => {
  // Helper function to create parent-child structure for docs
  const docsHierarchy = () => {
    const filter = `_type == "docsSet" && !(_id in path("drafts.**"))`;
    const query = `*[${filter}]{ _id, title, order } | order(order asc)`;
    const options = { apiVersion: "2025-09-04" };

    return context.documentStore.listenQuery(query, {}, options).pipe(
      map((docsSets: { _id: string; title: string }[]) =>
        S.list()
          .title("Docs Sets")
          .items([
            // Create a list item for each docs set
            ...docsSets.map((docsSet: { _id: string; title: string }) =>
              S.listItem({
                id: docsSet._id,
                title: docsSet.title,
                schemaType: "docsSet",
                child: () =>
                  S.documentList()
                    .title(docsSet.title)
                    .filter(`_type == "docs" && docsSet._ref == $docsSetId`)
                    .params({ docsSetId: docsSet._id })
                    .canHandleIntent(
                      (intentName, params) =>
                        intentName === "create" &&
                        params.template === "docs-child",
                    )
                    .initialValueTemplates([
                      S.initialValueTemplateItem("docs-child", {
                        docsSetId: docsSet._id,
                      }),
                    ]),
              }),
            ),
            S.divider(),
            // Show all docs sets
            S.listItem()
              .title("All Docs Sets")
              .child(S.documentTypeList("docsSet").title("All Docs Sets")),

            // Show all docs
            S.listItem()
              .title("All Docs Items")
              .child(S.documentTypeList("docs").title("All Docs Items")),
          ]),
      ),
    );
  };

  return S.list()
    .title("Content")
    .items([
      // Docs section with dynamic hierarchy
      S.listItem().title("Docs").icon(FileText).child(docsHierarchy),

      // Solutions section
      S.listItem()
        .title("Solutions")
        .icon(Folder)
        .child(
          S.documentTypeList("solutions")
            .title("Solutions")
            .defaultOrdering([
              { field: "position", direction: "asc" },
              { field: "_createdAt", direction: "desc" },
            ]),
        ),
      // Features section
      S.listItem()
        .title("Features")
        .icon(Puzzle)
        .child(
          S.documentTypeList("features")
            .title("Features")
            .defaultOrdering([{ field: "_createdAt", direction: "desc" }]),
        ),

      // News section
      S.listItem()
        .title("News")
        .icon(Newspaper)
        .child(S.documentTypeList("news").title("News")),

      // Homepage Videos section
      S.listItem()
        .title("Homepage Videos")
        .icon(Video)
        .child(S.documentTypeList("homepageVideos").title("Homepage Videos")),

      // About singleton document
      S.listItem().title("About").id("about").icon(Info).child(
        // Instead of rendering a list of documents, we render a single
        // document, specifying the `documentId` manually to ensure
        // that we're editing the single instance of the document
        S.document().schemaType("about").documentId("about"),
      ),
    ]);
};
