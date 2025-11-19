import { ColumnDefinition } from '../types';

export class Column<T = any> {
  private _definition: ColumnDefinition<T>;
  private _width: number;
  private _visible: boolean = true;

  constructor(definition: ColumnDefinition<T>) {
    this._definition = definition;
    this._width = definition.width ?? (definition.flex ? 0 : 200);
  }

  get id(): string {
    return this._definition?.id || "";
  }

  get field(): keyof T | undefined {
    return this._definition.field;
  }

  get headerName(): string {
    return this._definition.headerName || this._definition.id;
  }

  get width(): number {
    return this._width;
  }

  set width(value: number) {
    const minWidth = this._definition.minWidth || 50;
    const maxWidth = this._definition.maxWidth || Infinity;
    this._width = Math.max(minWidth, Math.min(maxWidth, value));
  }

  get resizable(): boolean {
    return this._definition.resizable !== false;
  }

  get sortable(): boolean {
    return this._definition.sortable !== false;
  }

  get filterable(): boolean {
    return this._definition.filterable !== false;
  }

  get type(): 'string' | 'number' | 'date' | 'boolean' | undefined {
    return this._definition.type;
  }

  get flex(): number | undefined {
    return this._definition.flex;
  }

  get hasFlex(): boolean {
    return this._definition.flex !== undefined && this._definition.flex > 0;
  }

  get minWidth(): number | undefined {
    return this._definition.minWidth;
  }

  get maxWidth(): number | undefined {
    return this._definition.maxWidth;
  }

  get enableRowGroup(): boolean {
    return this._definition.enableRowGroup !== false;
  }

  get editable(): boolean {
    return this._definition.editable === true;
  }

  get pinned(): 'left' | 'right' | null {
    return this._definition.pinned || null;
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    this._visible = value;
  }

  get definition(): ColumnDefinition<T> {
    return this._definition;
  }

  getValue(row: T): any {
    if (!this._definition || !row) {
      return null;
    }
    if (this._definition.valueGetter) {
      return this._definition.valueGetter(row);
    }
    if (this._definition.field) {
      return row[this._definition.field];
    }
    return null;
  }

  setValue(row: T, value: any): T {
    if (this._definition.valueSetter) {
      return this._definition.valueSetter(row, value);
    }
    if (this._definition.field) {
      return { ...row, [this._definition.field]: value };
    }
    return row;
  }

  renderCell(value: any, row: T): string | HTMLElement {
    if (this._definition.cellRenderer) {
      return this._definition.cellRenderer(value, row, this._definition);
    }
    return value != null ? String(value) : '';
  }
}

