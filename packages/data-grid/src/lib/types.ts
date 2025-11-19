import {
  ColumnDefinition,
  SortDirection,
  FilterCondition,
  ClassValue,
  RowClassFn,
  RowClassRuleFn,
} from "../types";

export interface AngularColumnDefinition<T = any>
  extends Omit<ColumnDefinition<T>, "cellRenderer"> {
  cellRenderer?:
    | ((
        value: any,
        row: T,
        column: ColumnDefinition<T>
      ) => string | HTMLElement)
    | ((value: any, row: T, column: ColumnDefinition<T>) => any);
}

export interface RowActionButton {
  id: string;
  label: string;
  icon?: string;
  title?: string;
  class?: string;
  disabled?: boolean;
}

export interface DataGridInputs<T = any> {
  columns: AngularColumnDefinition<T>[];
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
  theme?: "light" | "dark";
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: Record<string, string | number>;
  rowClass?: ClassValue | RowClassFn<T>;
  rowClassRules?: Record<string, RowClassRuleFn<T>>;
  isRowSelectable?: (row: T, rowIndex: number) => boolean;
  rowActionButtons?: RowActionButton[];
}

export interface DataGridOutputs<T = any> {
  sortChanged?: (columnId: string, direction: SortDirection) => void;
  filterChanged?: (columnId: string, condition: FilterCondition | null) => void;
  selectionChanged?: (selectedRows: T[]) => void;
  cellValueChanged?: (
    rowIndex: number,
    columnId: string,
    value: unknown,
    row: T
  ) => void;
  pageChanged?: (page: number) => void;
  pageSizeChanged?: (pageSize: number) => void;
  groupingChanged?: (columnIds: string[]) => void;
  groupToggled?: (groupKey: string, expanded: boolean) => void;
}

export type {
  SortDirection,
  FilterCondition,
  ColumnDefinition,
} from "../types";
