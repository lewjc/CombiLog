export type DatabaseInfo = {
  name: string;
  tableNames: TableNames;
};

export type TableNames = {
  message: string;
  service: string;
  settings: string;
};
