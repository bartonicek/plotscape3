export type Dict = Record<string, any>;

export type Setfn = <T, U>(prev: T) => U;

export type Mapfn<T, U> = (next: T) => U;
export type Reducefn<T, U> = (previous: U, next: T) => U;
export type Stackfn<T, U> = Reducefn<T, U>;
