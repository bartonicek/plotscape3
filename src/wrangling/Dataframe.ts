import { Dict } from "../utils/types";

type Cols<T extends Dict> = { [key in keyof T]: T[key][] };
type Rows<T extends Dict> = T[];

export default class Dataframe<T extends Dict> {
  n: number;
  k: number;
  keys: (keyof T)[];

  cols: Cols<T>;
  rows: Rows<T>;

  constructor(cols: Cols<T>, rows: Rows<T>) {
    const keys = Object.keys(cols) as (keyof T)[];

    this.n = cols[keys[0]].length;
    this.k = keys.length;
    this.keys = keys;

    this.cols = cols;
    this.rows = rows;
  }

  static fromCols = <T extends Dict, K extends keyof T>(cols: Cols<T>) => {
    const keys = Object.keys(cols) as K[];
    const rows: T[] = [];
    for (let i = 0; i < cols[keys[0]].length; i++) {
      const row = {} as T;
      for (const key of keys) row[key] = cols[key][i];
      rows.push(row);
    }
    return new Dataframe(cols, rows);
  };

  static fromRows = <T extends Dict, K extends keyof T>(rows: Rows<T>) => {
    const keys = Object.keys(rows[0]) as K[];
    const cols = {} as Cols<T>;
    for (const key of keys) cols[key] = [];

    for (const row of rows) {
      for (const key of keys) cols[key].push(row[key]);
    }
    return new Dataframe(cols, rows);
  };

  row = (n: number) => this.rows[n];
  col = <K extends keyof T>(key: K): T[K][] => this.cols[key];

  rename = <U extends { [key: string]: keyof T }, K2 extends keyof U>(
    keyMap: U
  ) => {
    const cols = {} as { [key in K2]: T[U[key]][] };
    const rows = [] as { [key in K2]: T[U[key]] }[];

    for (const [newKey, oldKey] of Object.entries(keyMap)) {
      cols[newKey as K2] = this.cols[oldKey] as T[U[K2]];
    }

    for (let i = 0; i < this.n; i++) {
      const oldRow = this.rows[i];
      const newRow = {} as { [key in K2]: T[U[key]] };
      for (const key of Object.keys(keyMap)) {
        newRow[key as K2] = oldRow[keyMap[key as K2]];
      }
      rows.push(newRow);
    }

    return new Dataframe<{ [key in K2]: T[U[key]] }>(cols, rows);
  };
}
