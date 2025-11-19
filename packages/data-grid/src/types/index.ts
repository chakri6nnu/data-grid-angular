export type SortDirection = "asc" | "desc" | null;

export interface ColumnSort {
  columnId: string;
  direction: SortDirection;
}

export interface FilterCondition {
  columnId: string;
  operator:
    | "equals"
    | "contains"
    | "greaterThan"
    | "lessThan"
    | "startsWith"
    | "endsWith";
  value: any;
}

export type ClassValue =
  | string
  | string[]
  | Record<string, boolean | undefined>
  | null
  | undefined;

export interface RowClassParams<T = any> {
  row: T;
  rowIndex: number;
  visibleIndex: number;
}

export interface CellClassParams<T = any> {
  value: any;
  row: T;
  column: ColumnDefinition<T>;
  columnId: string;
  rowIndex: number;
  visibleIndex: number;
}

export type RowClassFn<T = any> = (params: RowClassParams<T>) => ClassValue;
export type RowClassRuleFn<T = any> = (params: RowClassParams<T>) => boolean;

export type CellClassFn<T = any> = (params: CellClassParams<T>) => ClassValue;
export type CellClassRuleFn<T = any> = (params: CellClassParams<T>) => boolean;

export interface ColumnDefinition<T = any> {
  id: string;
  field?: keyof T;
  headerName?: string;
  width?: number;
  flex?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  enableRowGroup?: boolean;
  pinned?: "left" | "right" | null;
  cellRenderer?: (
    value: any,
    row: T,
    column: ColumnDefinition<T>
  ) => string | HTMLElement;
  valueGetter?: (row: T) => any;
  valueSetter?: (row: T, value: any) => T;
  type?: "string" | "number" | "date" | "boolean";
  cellClass?: ClassValue | ((params: CellClassParams<T>) => ClassValue);
  cellClassRules?: Record<string, (params: CellClassParams<T>) => boolean>;
  icon?: string | ((params: CellClassParams<T>) => string);
  iconPosition?: 'left' | 'right';
  onCellClick?: (params: CellClassParams<T>, event: MouseEvent) => void;
}

export interface RowSelection {
  type: "single" | "multiple";
  selectedRows: Set<number>;
  lastSelectedIndex?: number;
}

export interface GridOptions<T = any> {
  columns: ColumnDefinition<T>[];
  rowData: T[];
  rowHeight?: number;
  headerHeight?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  enableGrouping?: boolean;
  enableSelection?: boolean;
  selectionType?: "single" | "multiple";
  enableCellEditing?: boolean;
  enableColumnResize?: boolean;
  enableColumnReorder?: boolean;
  enableExport?: boolean;
  animateRows?: boolean;
  rowClass?: ClassValue | ((params: RowClassParams<T>) => ClassValue);
  rowClassRules?: Record<string, (params: RowClassParams<T>) => boolean>;
  isRowSelectable?: (row: T, rowIndex: number) => boolean;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface GroupingState {
  groupByColumns: string[];
  expandedGroups: Set<string>;
  collapsedGroups?: Set<string>;
}

export interface AggregationConfig {
  columnId: string;
  function: "sum" | "avg" | "min" | "max" | "count";
}
