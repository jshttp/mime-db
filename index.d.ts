declare module "mime-db" {
  const mimeDB: {
    [mimeType: string]: {
      source?: "iana" | "apache" | "nginx" | string;
      extensions?: string[];
      compressible?: boolean;
      charset?: string;
    };
  };

  export = mimeDB;
}
