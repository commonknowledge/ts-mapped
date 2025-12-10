interface DataSource {
  config: {
    type: string;
    __SERIALIZE_CREDENTIALS?: boolean | null;
  };
}

interface HasPasswordHash {
  // Making this field optional simplifies the serializer type definitions
  passwordHash?: unknown;
}

const isDataSource = (v: unknown): v is DataSource => {
  // Simple (fast) duck typing of DataSource object
  return (
    v !== null &&
    typeof v === "object" &&
    "id" in v &&
    "config" in v &&
    v.config !== null &&
    typeof v.config === "object" &&
    "type" in v.config &&
    "columnDefs" in v &&
    "columnRoles" in v &&
    "recordType" in v
  );
};

export const serverDataSourceSerializer = {
  isApplicable: (v: unknown): v is DataSource => {
    return isDataSource(v) && Object.keys(v.config).length > 1;
  },
  serialize: (v: DataSource) => {
    if (v.config.__SERIALIZE_CREDENTIALS) {
      // Remove __SERIALIZE_CREDENTIALS key from output

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { __SERIALIZE_CREDENTIALS, ...config } = v.config;
      return { ...v, config };
    } else {
      return { ...v, config: { type: v.config.type } };
    }
  },
  deserialize: (v: DataSource) => v,
};

export const clientDataSourceSerializer = {
  isApplicable: (v: unknown): v is DataSource => {
    return isDataSource(v);
  },
  // The `as` fixes typing in `superjson.registerCustom(...)`
  serialize: (v: DataSource) => v as { config: { type: string } },
  deserialize: (v: DataSource) => v,
};

export const hasPasswordHashSerializer = {
  isApplicable: (v: unknown): v is HasPasswordHash => {
    return v !== null && typeof v === "object" && "passwordHash" in v;
  },
  serialize: (v: HasPasswordHash) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = v;
    return rest;
  },
  deserialize: (v: HasPasswordHash) => v,
};
