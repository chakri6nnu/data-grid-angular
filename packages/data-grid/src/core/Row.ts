export class Row<T = any> {
  private _data: T;
  private _index: number;
  private _selected: boolean = false;
  private _highlighted: boolean = false;
  private _groupKey?: string;
  private _isGroupRow: boolean = false;
  private _groupLevel: number = 0;
  private _expanded: boolean = true;

  constructor(data: T, index: number) {
    this._data = data;
    this._index = index;
  }

  get data(): T {
    return this._data;
  }

  get index(): number {
    return this._index;
  }

  set index(value: number) {
    this._index = value;
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    this._selected = value;
  }

  get highlighted(): boolean {
    return this._highlighted;
  }

  set highlighted(value: boolean) {
    this._highlighted = value;
  }

  get groupKey(): string | undefined {
    return this._groupKey;
  }

  set groupKey(value: string | undefined) {
    this._groupKey = value;
  }

  get isGroupRow(): boolean {
    return this._isGroupRow;
  }

  set isGroupRow(value: boolean) {
    this._isGroupRow = value;
  }

  get groupLevel(): number {
    return this._groupLevel;
  }

  set groupLevel(value: number) {
    this._groupLevel = value;
  }

  get expanded(): boolean {
    return this._expanded;
  }

  set expanded(value: boolean) {
    this._expanded = value;
  }

  updateData(newData: T): void {
    this._data = newData;
  }
}

