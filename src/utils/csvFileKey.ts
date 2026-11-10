/**
 * Whether an organisation may create a data source from a CSV file key.
 * Uploaded files are keyed `<organisationId>/...`, so only that organisation
 * can use them. Sample files that ship with the app can be used by anyone.
 */
export const isCsvFileKeyUsableBy = ({
  fileKey,
  organisationId,
}: {
  fileKey: string;
  organisationId: string;
}) => fileKey.startsWith("sample/") || fileKey.startsWith(`${organisationId}/`);
