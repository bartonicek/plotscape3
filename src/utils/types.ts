export type Dict = Record<string | number | symbol, any>;

export type Just<T> = () => T;
export type Mapfn<T, U> = (next: T) => U;
export type Reducefn<T, U> = (previous: U, next: T) => U;
export type Stackfn<T, U> = Reducefn<T, U>;
