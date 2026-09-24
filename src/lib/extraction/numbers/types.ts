export type CellRefusalCode = "MISSING_VALUE" | "AMBIGUOUS_NUMBER_FORMAT";

export type CellRefusal = {
  ok: false;
  code: CellRefusalCode;
  raw: string;
  detail: string;
};

export type Parsed<T extends object> = ({ ok: true; raw: string } & T) | CellRefusal;
