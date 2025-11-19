import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ViewEncapsulation,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Grid } from "../core/Grid";
import { Row } from "../core/Row";
import { Column } from "../core/Column";
import {
  FilterCondition,
  SortDirection,
  PaginationState,
  ClassValue,
  RowClassFn,
  RowClassParams,
  RowClassRuleFn,
  CellClassParams,
  ColumnDefinition,
} from "../types";
import { DataGridService } from "./data-grid.service";
import { AngularColumnDefinition, RowActionButton } from "./types";

@Component({
  selector: "data-grid",
  templateUrl: "./data-grid.component.html",
  styleUrls: ["./data-grid.component.css"],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class DataGridComponent<T = unknown>
  implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
  @Input() columns: AngularColumnDefinition<T>[] = [];
  @Input() rowData: T[] = [];
  @Input() rowHeight: number = 30;
  @Input() headerHeight: number = 40;
  @Input() enableSorting: boolean = true;
  @Input() enableFiltering: boolean = true;
  @Input() enablePagination: boolean = false;
  @Input() pageSize: number = 100;
  @Input() enableGrouping: boolean = false;
  @Input() enableSelection: boolean = false;
  @Input() selectionType: "single" | "multiple" = "multiple";
  @Input() enableCellEditing: boolean = false;
  @Input() enableColumnResize: boolean = true;
  @Input() enableColumnReorder: boolean = false;
  @Input() enableExport: boolean = false;
  @Input() animateRows: boolean = true;
  @Input() theme: "light" | "dark" = "dark";
  @Input() width: number | string = "100%";
  @Input() height: number | string = "600px";
  @Input() className: string = "";
  @Input() style: Record<string, string | number> = {};
  @Input() isRowSelectable?: (row: T, rowIndex: number) => boolean;
  @Input() rowClass: ClassValue | RowClassFn<T> = "";
  @Input() rowClassRules: Record<string, RowClassRuleFn<T>> = {};
  @Input() rowActionButtons: RowActionButton[] = [];

  @Output() sortChanged = new EventEmitter<{
    columnId: string;
    direction: SortDirection;
  }>();
  @Output() filterChanged = new EventEmitter<{
    columnId: string;
    condition: FilterCondition | null;
  }>();
  @Output() selectionChanged = new EventEmitter<T[]>();
  @Output() cellValueChanged = new EventEmitter<{
    rowIndex: number;
    columnId: string;
    value: unknown;
    row: T;
  }>();
  @Output() pageChanged = new EventEmitter<number>();
  @Output() pageSizeChanged = new EventEmitter<number>();
  @Output() groupingChanged = new EventEmitter<string[]>();
  @Output() groupToggled = new EventEmitter<{
    groupKey: string;
    expanded: boolean;
  }>();
  @Output() selectionAction = new EventEmitter<{
    action: "delete" | "export" | "copy" | string;
    selectedRows: T[];
  }>();
  @Output() cellContextMenu = new EventEmitter<{
    row: T;
    column: ColumnDefinition<T>;
    value: any;
    action: string;
  }>();
  @Input() enableGlobalSearch: boolean = false;
  @Input() globalSearchPlaceholder: string = "Search...";
  @Input() globalSearchPosition: "left" | "right" = "left";

  @ViewChild("container", { static: false })
  container!: ElementRef<HTMLDivElement>;
  @ViewChild("header", { static: false })
  headerRef!: ElementRef<HTMLDivElement>;
  @ViewChild("body", { static: false }) bodyRef!: ElementRef<HTMLDivElement>;

  grid: Grid<T> | null = null;
  gridId: string = `grid-${Math.random().toString(36).substring(2, 11)}`;

  rows: Row<T>[] = [];
  columnsList: Column<T>[] = [];
  scrollTop: number = 0;
  scrollLeft: number = 0;
  resizingColumn: string | null = null;
  resizeStartX: number = 0;
  resizeStartWidth: number = 0;
  editingCell: { rowIndex: number; columnId: string } | null = null;
  editValue: unknown = "";
  rowPositions: Map<number, number> = new Map();
  rowTopPositions: Map<number, number> = new Map();
  isAnimating: boolean = false;
  pendingAnimation: Map<number, number> | null = null;
  pendingTopPositions: Map<number, number> | null = null;
  filterValues: Map<string, string> = new Map();
  filterOperators: Map<string, FilterCondition["operator"]> = new Map();
  activeFilters: Map<string, boolean> = new Map();
  openFilterColumns: Set<string> = new Set();
  openMenuColumn: string | null = null;
  groupingUpdate: number = 0;
  hoveredGroupRow: string | null = null;
  paginationState: PaginationState | null = null;
  contextMenuRow: Row<T> | null = null;
  contextMenuColumn: Column<T> | null = null;
  contextMenuVisible: boolean = false;
  contextMenuX: number = 0;
  contextMenuY: number = 0;
  exportDropdownOpen: boolean = false;
  columnVisibilityMenuOpen: boolean = false;
  globalSearchValue: string = "";
  // globalSearchPosition is now an @Input() property
  groupColumnWidth: number = 200; // Store group column width for resizing
  checkboxColumnWidth: number = 40; // Store checkbox column width
  isAllSelected: boolean = false; // Track select all state

  rowRefs: Map<number, HTMLDivElement> = new Map();
  filterInputRefs: Map<string, HTMLInputElement> = new Map();

  private resizeObserver: ResizeObserver | null = null;
  private clickOutsideListener: ((e: MouseEvent) => void) | null = null;
  private mouseMoveListener: ((e: MouseEvent) => void) | null = null;
  private mouseUpListener: (() => void) | null = null;

  constructor(
    private gridService: DataGridService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (this.columns.length > 0) {
      this.initializeGrid();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.grid) {
      if (changes["rowData"] && !changes["rowData"].firstChange) {
        this.gridService.setRowData(this.gridId, this.rowData);
        this.updateRows();
      }
      if (changes["columns"] && !changes["columns"].firstChange) {
        this.reinitializeGrid();
      }
    } else {
      if (changes["columns"] && this.columns.length > 0 && !this.grid) {
        this.initializeGrid();
      }
      if (
        changes["rowData"] &&
        this.rowData.length > 0 &&
        this.columns.length > 0 &&
        !this.grid
      ) {
        this.initializeGrid();
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.container?.nativeElement && this.grid) {
        const width = this.container.nativeElement.clientWidth;
        const height = this.container.nativeElement.clientHeight;
        if (width > 0 && height > 0) {
          this.gridService.setViewportSize(this.gridId, width, height);
          this.updateRows();
        }

        this.setupResizeObserver();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.gridService.destroyGrid(this.gridId);
  }

  private initializeGrid(): void {
    if (this.columns.length === 0) {
      return;
    }

    try {
      this.grid = this.gridService.createGrid<T>(this.gridId, {
        columns: this.columns,
        rowData: this.rowData || [],
        rowHeight: this.rowHeight,
        headerHeight: this.headerHeight,
        enableSorting: this.enableSorting,
        enableFiltering: this.enableFiltering,
        enablePagination: this.enablePagination,
        pageSize: this.pageSize,
        enableGrouping: this.enableGrouping,
        enableSelection: this.enableSelection,
        selectionType: this.selectionType,
        enableCellEditing: this.enableCellEditing,
        isRowSelectable: this.isRowSelectable,
        enableColumnResize: this.enableColumnResize,
        enableColumnReorder: this.enableColumnReorder,
        enableExport: this.enableExport,
        animateRows: this.animateRows,
      });

      this.columnsList = this.gridService.getColumns<T>(this.gridId) || [];
      this.rows = this.gridService.getRows<T>(this.gridId) || [];
      this.paginationState = this.gridService.getPaginationState<T>(
        this.gridId
      );

      this.setupEventListeners();
      this.syncFilterValues();

      // Ensure pagination state is updated after initial setup
      if (this.enablePagination) {
        this.paginationState = this.gridService.getPaginationState<T>(
          this.gridId
        );
      }

      this.cdr.detectChanges();
    } catch (error) {
      if (typeof window !== "undefined" && (window as any).ng?.devMode) {
        console.error("DataGrid: Error initializing grid:", error);
      }
    }
  }

  private reinitializeGrid(): void {
    this.gridService.destroyGrid(this.gridId);
    this.initializeGrid();
  }

  private setupEventListeners(): void {
    if (!this.grid) return;

    this.grid.on("dataChanged", () => {
      this.updateRows();
    });

    this.grid.on(
      "sortChanged",
      (event: { columnId: string; direction: SortDirection }) => {
        this.sortChanged.emit({
          columnId: event.columnId,
          direction: event.direction,
        });
        this.updateRows();
      }
    );

    this.grid.on(
      "filterChanged",
      (event: { columnId: string; condition: FilterCondition | null }) => {
        this.filterChanged.emit({
          columnId: event.columnId,
          condition: event.condition,
        });
        this.updateRows();
      }
    );

    this.grid.on("selectionChanged", (event: { selectedRows: number[] }) => {
      const rows = event.selectedRows
        .map((index: number) => {
          const row = this.rows[index];
          return row ? row.data : null;
        })
        .filter(Boolean) as T[];

      // Update select all state
      if (this.enableSelection && this.grid) {
        const totalRows = this.rows.length;
        const selectedCount = event.selectedRows.length;
        this.isAllSelected = totalRows > 0 && selectedCount === totalRows;
      }

      this.selectionChanged.emit(rows);
      this.cdr.detectChanges();
    });

    this.grid.on(
      "cellValueChanged",
      (event: {
        rowIndex: number;
        columnId: string;
        value: unknown;
        row: T;
      }) => {
        this.cellValueChanged.emit({
          rowIndex: event.rowIndex,
          columnId: event.columnId,
          value: event.value,
          row: event.row,
        });
      }
    );

    this.grid.on("pageChanged", (event: { page: number }) => {
      this.pageChanged.emit(event.page);
      this.paginationState = this.gridService.getPaginationState<T>(
        this.gridId
      );
      this.updateRows();
    });

    this.grid.on("pageSizeChanged", (event: { pageSize: number }) => {
      this.pageSizeChanged.emit(event.pageSize);
      this.paginationState = this.gridService.getPaginationState<T>(
        this.gridId
      );
      this.updateRows();
    });

    this.grid.on("groupingChanged", (event: { columnIds: string[] }) => {
      this.groupingChanged.emit(event.columnIds);
      this.groupingUpdate++;
      this.updateRows();
    });

    this.grid.on(
      "groupToggled",
      (event: { groupKey: string; expanded: boolean }) => {
        this.groupToggled.emit({
          groupKey: event.groupKey,
          expanded: event.expanded,
        });
        this.updateRows();
      }
    );
  }

  private setupResizeObserver(): void {
    if (!this.container?.nativeElement || !this.grid) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.container?.nativeElement && this.grid) {
        const width = this.container.nativeElement.clientWidth;
        const height = this.container.nativeElement.clientHeight;
        if (width > 0 && height > 0) {
          this.gridService.setViewportSize(this.gridId, width, height);
          this.updateRows();
        }
      }
    });

    this.resizeObserver.observe(this.container.nativeElement);
  }

  private cleanup(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.clickOutsideListener) {
      document.removeEventListener("mousedown", this.clickOutsideListener);
      this.clickOutsideListener = null;
    }

    if (this.mouseMoveListener) {
      document.removeEventListener("mousemove", this.mouseMoveListener);
      this.mouseMoveListener = null;
    }

    if (this.mouseUpListener) {
      document.removeEventListener("mouseup", this.mouseUpListener);
      this.mouseUpListener = null;
    }
  }

  updateRows(): void {
    if (this.grid) {
      this.rows = this.gridService.getRows<T>(this.gridId) || [];
      this.columnsList = this.gridService.getColumns<T>(this.gridId) || [];
      this.paginationState = this.gridService.getPaginationState<T>(
        this.gridId
      );
      this.syncFilterValues();
      this.cdr.detectChanges();
      
      // Trigger row animation if pending
      if (this.isAnimating) {
        setTimeout(() => {
          this.handleRowAnimation();
        }, 0);
      }
    }
  }

  syncFilterValues(): void {
    if (!this.grid || !this.enableFiltering) return;

    this.columnsList.forEach((column) => {
      if (column.filterable) {
        const condition = this.gridService.getFilterCondition<T>(
          this.gridId,
          column.id
        );
        const currentValue = this.filterValues.get(column.id) || "";
        if (condition) {
          if (String(condition.value) !== currentValue) {
            this.filterValues.set(column.id, String(condition.value));
          }
          if (condition.operator !== this.filterOperators.get(column.id)) {
            this.filterOperators.set(column.id, condition.operator);
          }
        } else {
          if (currentValue) {
            this.filterValues.delete(column.id);
          }
          if (this.filterOperators.has(column.id)) {
            this.filterOperators.delete(column.id);
          }
        }
      }
    });
  }

  Math = Math;

  get totalWidth(): number {
    if (!this.columnsList.length) return 0;
    return this.displayColumns.reduce((sum, col) => sum + col.width, 0);
  }

  get totalHeight(): number {
    // Total height is just the rows (header is not sticky, so no padding needed)
    return this.rows.length * this.rowHeight;
  }

  get bodyHeight(): number {
    // Calculate available height for body
    // The body container has padding-top equal to headerHeight, so we don't subtract it here
    let availableHeight: number;
    if (typeof this.height === "number") {
      availableHeight = this.height;
    } else {
      const heightNum = parseInt(String(this.height).replace("px", ""), 10);
      availableHeight = isNaN(heightNum) ? 600 : heightNum;
    }

    // Subtract header height (sticky header takes space)
    let bodyHeight = availableHeight - this.headerHeight;

    // Subtract selection actions height if enabled and visible (40px)
    if (this.enableSelection && this.hasSelectedRows) {
      bodyHeight -= 40; // min-height of selection actions
    }

    // Subtract global search height if enabled (approximately 40px with padding)
    if (this.enableGlobalSearch) {
      bodyHeight -= 50; // top position + height + margin
    }

    return Math.max(bodyHeight, 0); // Ensure non-negative
  }

  get visibleRows(): Row<T>[] {
    if (!this.grid || !this.rows.length || !this.columnsList.length) {
      return [];
    }
    try {
      const viewport = this.gridService.getViewport<T>(this.gridId);
      if (!viewport) {
        return [];
      }
      const visibleRange = viewport.getVisibleRange();
      if (
        !visibleRange ||
        visibleRange.startIndex < 0 ||
        visibleRange.endIndex < 0
      ) {
        return [];
      }
      const start = Math.max(0, visibleRange.startIndex);
      const end = Math.min(this.rows.length, visibleRange.endIndex + 1);
      return this.rows.slice(start, end);
    } catch (error) {
      return [];
    }
  }

  get visibleRange(): { startIndex: number; endIndex: number } | null {
    if (!this.grid) return null;
    const viewport = this.gridService.getViewport<T>(this.gridId);
    return viewport?.getVisibleRange() || null;
  }

  get displayColumns(): Column<T>[] {
    const activeGroupColumns =
      this.gridService.getGroupByColumns<T>(this.gridId) || [];
    const isGroupingActive =
      activeGroupColumns.length > 0 && this.enableGrouping;

    const columns: Column<T>[] = [];

    // Add checkbox column if selection is enabled
    if (this.enableSelection) {
      columns.push({
        id: "__checkbox",
        headerName: "",
        width: this.checkboxColumnWidth,
        sortable: false,
        filterable: false,
        resizable: false,
        pinned: "left",
        hasFlex: false,
        minWidth: 40,
        maxWidth: 40,
      } as Column<T>);
    }

    // Add group column if grouping is active
    if (isGroupingActive) {
      columns.push({
        id: "__group",
        headerName: "",
        width: this.groupColumnWidth,
        sortable: false,
        filterable: false,
        resizable: true,
        pinned: null,
        hasFlex: false,
        minWidth: 100,
        maxWidth: 500,
      } as Column<T>);
    }

    // Add regular columns (filter out hidden columns)
    columns.push(...this.columnsList.filter((col) => col.visible !== false));

    return columns;
  }

  get containerStyle(): Record<string, string | number> {
    return {
      width: this.width || "100%",
      height: this.height || "600px",
      ...this.style,
    };
  }

  get themeClass(): string {
    return this.theme === "light"
      ? "data-grid-theme-light"
      : "data-grid-theme-dark";
  }

  get animationClass(): string {
    return this.animateRows !== false
      ? "data-grid-row-animation"
      : "data-grid-row-no-animation";
  }

  handleScroll(event: Event): void {
    const target = event.target as HTMLDivElement;
    this.scrollTop = target.scrollTop;
    this.scrollLeft = target.scrollLeft;

    // Sync header scroll with body scroll
    if (this.headerRef?.nativeElement) {
      const headerRow = this.headerRef.nativeElement.querySelector(
        ".data-grid-header-row"
      ) as HTMLElement;
      if (headerRow) {
        headerRow.style.transform = `translateX(-${this.scrollLeft}px)`;
      }
    }

    // Update popover position if open
    if (this.openMenuColumn) {
      this.cdr.detectChanges();
    }

    if (this.grid) {
      const viewport = this.gridService.getViewport<T>(this.gridId);
      if (viewport) {
        viewport.setScrollTop(this.scrollTop);
        viewport.setScrollLeft(this.scrollLeft);
        this.updateRows();
      }
    }
  }

  handleHeaderClick(columnId: string): void {
    if (!this.enableSorting || !this.grid) return;

    const column = this.columnsList.find((col) => col.id === columnId);
    if (!column || !column.sortable) return;

    const currentDirection = this.gridService.getSortState<T>(
      this.gridId,
      columnId
    );
    let newDirection: "asc" | "desc" | null;

    if (currentDirection === null) {
      newDirection = "asc";
    } else if (currentDirection === "asc") {
      newDirection = "desc";
    } else {
      newDirection = null;
    }

    if (newDirection !== null) {
      const allSortStates = this.gridService.getSortStates<T>(this.gridId);
      allSortStates.forEach(
        (_direction: SortDirection, otherColumnId: string) => {
          if (otherColumnId !== columnId) {
            this.gridService.sortColumn<T>(this.gridId, otherColumnId, null);
          }
        }
      );
    }

    if (this.animateRows !== false && this.grid && newDirection !== null && this.bodyRef?.nativeElement) {
      const currentRows = this.gridService.getRows<T>(this.gridId);
      const positions = new Map<number, number>();
      const topPositions = new Map<number, number>();

      // Query DOM elements directly
      const bodyElement = this.bodyRef.nativeElement;
      const rowElements = bodyElement.querySelectorAll(
        '[data-row-index]'
      ) as NodeListOf<HTMLElement>;

      currentRows.forEach((row, sortedIndex) => {
        positions.set(row.index, sortedIndex);
        const rowEl = Array.from(rowElements).find(
          (el) => el.getAttribute('data-row-index') === String(row.index)
        );
        if (rowEl) {
          topPositions.set(row.index, rowEl.offsetTop);
        } else {
          topPositions.set(row.index, sortedIndex * this.rowHeight);
        }
      });

      this.pendingAnimation = positions;
      this.pendingTopPositions = topPositions;
      this.isAnimating = true;
    }

    this.gridService.sortColumn<T>(this.gridId, columnId, newDirection);
  }

  handleFilterOperatorChange(
    columnId: string,
    operator: FilterCondition["operator"],
    columnType?: string
  ): void {
    this.filterOperators.set(columnId, operator);

    // Capture current row positions for animation
    if (this.animateRows !== false && this.grid && this.bodyRef?.nativeElement) {
      const currentRows = this.gridService.getRows<T>(this.gridId);
      const positions = new Map<number, number>();
      const topPositions = new Map<number, number>();

      // Query DOM elements directly
      const bodyElement = this.bodyRef.nativeElement;
      const rowElements = bodyElement.querySelectorAll(
        '[data-row-index]'
      ) as NodeListOf<HTMLElement>;

      currentRows.forEach((row, sortedIndex) => {
        positions.set(row.index, sortedIndex);
        const rowEl = Array.from(rowElements).find(
          (el) => el.getAttribute('data-row-index') === String(row.index)
        );
        if (rowEl) {
          topPositions.set(row.index, rowEl.offsetTop);
        } else {
          topPositions.set(row.index, sortedIndex * this.rowHeight);
        }
      });

      this.pendingAnimation = positions;
      this.pendingTopPositions = topPositions;
      this.isAnimating = true;
    }

    const currentValue = this.filterValues.get(columnId) || "";
    if (currentValue.trim() !== "" && this.grid) {
      const condition: FilterCondition = {
        columnId,
        operator,
        value: columnType === "number" ? Number(currentValue) : currentValue,
      };
      this.gridService.filterColumn<T>(this.gridId, columnId, condition);
    }
  }

  handleFilterChange(
    columnId: string,
    value: string,
    columnType?: string
  ): void {
    this.filterValues.set(columnId, value);

    if (!this.grid) return;

    // Capture current row positions for animation
    if (this.animateRows !== false && this.grid && this.bodyRef?.nativeElement) {
      const currentRows = this.gridService.getRows<T>(this.gridId);
      const positions = new Map<number, number>();
      const topPositions = new Map<number, number>();

      // Query DOM elements directly
      const bodyElement = this.bodyRef.nativeElement;
      const rowElements = bodyElement.querySelectorAll(
        '[data-row-index]'
      ) as NodeListOf<HTMLElement>;

      currentRows.forEach((row, sortedIndex) => {
        positions.set(row.index, sortedIndex);
        const rowEl = Array.from(rowElements).find(
          (el) => el.getAttribute('data-row-index') === String(row.index)
        );
        if (rowEl) {
          topPositions.set(row.index, rowEl.offsetTop);
        } else {
          topPositions.set(row.index, sortedIndex * this.rowHeight);
        }
      });

      this.pendingAnimation = positions;
      this.pendingTopPositions = topPositions;
      this.isAnimating = true;
    }

    let condition: FilterCondition | null = null;

    if (value.trim() !== "") {
      let operator: FilterCondition["operator"] =
        this.filterOperators.get(columnId) || "contains";

      if (!this.filterOperators.has(columnId)) {
        if (columnType === "number") {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            operator = "equals";
            this.filterOperators.set(columnId, operator);
          }
        } else {
          operator = "contains";
          this.filterOperators.set(columnId, operator);
        }
      }

      condition = {
        columnId,
        operator,
        value: columnType === "number" ? Number(value) : value,
      };
    }

    this.gridService.filterColumn<T>(this.gridId, columnId, condition);

    if (condition) {
      this.activeFilters.set(columnId, true);
    } else {
      this.activeFilters.delete(columnId);
    }
  }

  handleFilterClear(columnId: string): void {
    // Capture current row positions for animation
    if (this.animateRows !== false && this.grid && this.bodyRef?.nativeElement) {
      const currentRows = this.gridService.getRows<T>(this.gridId);
      const positions = new Map<number, number>();
      const topPositions = new Map<number, number>();

      // Query DOM elements directly
      const bodyElement = this.bodyRef.nativeElement;
      const rowElements = bodyElement.querySelectorAll(
        '[data-row-index]'
      ) as NodeListOf<HTMLElement>;

      currentRows.forEach((row, sortedIndex) => {
        positions.set(row.index, sortedIndex);
        const rowEl = Array.from(rowElements).find(
          (el) => el.getAttribute('data-row-index') === String(row.index)
        );
        if (rowEl) {
          topPositions.set(row.index, rowEl.offsetTop);
        } else {
          topPositions.set(row.index, sortedIndex * this.rowHeight);
        }
      });

      this.pendingAnimation = positions;
      this.pendingTopPositions = topPositions;
      this.isAnimating = true;
    }

    this.filterValues.delete(columnId);
    this.filterOperators.delete(columnId);
    this.activeFilters.delete(columnId);
    this.gridService.filterColumn<T>(this.gridId, columnId, null);
  }

  handleRowClick(rowIndex: number, event: MouseEvent): void {
    if (this.enableSelection && this.grid) {
      // Check if row is selectable
      const row = this.rows[rowIndex];
      if (row && this.isRowSelectable) {
        if (!this.isRowSelectable(row.data, rowIndex)) {
          return; // Row is not selectable
        }
      }

      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      if (isShift && this.selectionType === "multiple") {
        const selectedRows = this.gridService
          .getRows<T>(this.gridId)
          .filter((r) => r.selected);
        const lastSelected = selectedRows[0]?.index;
        if (lastSelected !== undefined) {
          const start = Math.min(lastSelected, rowIndex);
          const end = Math.max(lastSelected, rowIndex);
          for (let i = start; i <= end; i++) {
            this.gridService.selectRow<T>(this.gridId, i, true);
          }
        }
      } else {
        this.gridService.selectRow<T>(this.gridId, rowIndex, !isCtrl);
      }
    }
  }

  handleSelectAllClick(event: Event): void {
    event.stopPropagation();
    if (!this.enableSelection || !this.grid) return;

    const newState = !this.isAllSelected;
    if (newState) {
      // Only select rows that are selectable
      if (this.isRowSelectable) {
        this.rows.forEach((row, index) => {
          if (this.isRowSelectable!(row.data, index)) {
            this.gridService.selectRow<T>(this.gridId, index, true);
          }
        });
      } else {
        this.gridService.selectAll<T>(this.gridId, true);
      }
    } else {
      this.gridService.selectAll<T>(this.gridId, false);
    }
    this.isAllSelected = newState;
  }

  isRowSelectableFn(row: Row<T>, rowIndex: number): boolean {
    if (!this.isRowSelectable) {
      return true; // All rows selectable by default
    }
    return this.isRowSelectable(row.data, rowIndex);
  }

  handleRowCheckboxClick(rowIndex: number, event: Event): void {
    event.stopPropagation();
    if (!this.enableSelection || !this.grid) return;

    const row = this.rows[rowIndex];
    if (row) {
      const newState = !row.selected;
      this.gridService.selectRow<T>(this.gridId, rowIndex, newState);
    }
  }

  get selectedRowsData(): T[] {
    if (!this.enableSelection || !this.grid) return [];
    const selectedIndices = this.gridService
      .getSelectedRows<T>(this.gridId)
      .map((r) => r.index);
    return selectedIndices
      .map((index: number) => {
        const row = this.rows[index];
        return row ? row.data : null;
      })
      .filter(Boolean) as T[];
  }

  get hasSelectedRows(): boolean {
    return this.selectedRowsData.length > 0;
  }

  handleSelectionAction(action: string): void {
    if (!this.hasSelectedRows) return;
    const selectedRows = this.selectedRowsData;
    this.selectionAction.emit({ action, selectedRows });
  }

  sanitizeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  handleCellDoubleClick(
    rowIndex: number,
    columnId: string,
    value: unknown
  ): void {
    if (this.enableCellEditing && this.grid) {
      const column = this.columnsList.find((col) => col.id === columnId);
      if (column && column.editable) {
        this.editingCell = { rowIndex, columnId };
        this.editValue = value;
      }
    }
  }

  handleCellEdit(event: KeyboardEvent): void {
    if (event.key === "Enter" && this.editingCell) {
      this.gridService.setCellValue<T>(
        this.gridId,
        this.editingCell.rowIndex,
        this.editingCell.columnId,
        this.editValue
      );
      this.editingCell = null;
    } else if (event.key === "Escape") {
      this.editingCell = null;
    }
  }

  handleCellEditBlur(): void {
    if (this.editingCell) {
      this.gridService.setCellValue<T>(
        this.gridId,
        this.editingCell.rowIndex,
        this.editingCell.columnId,
        this.editValue
      );
      this.editingCell = null;
    }
  }

  handleResizeStart(columnId: string, event: MouseEvent): void {
    if (!this.enableColumnResize || !this.grid) return;

    event.preventDefault();
    event.stopPropagation();

    // Handle group column resize
    let column: Column<T> | undefined;
    if (columnId === "__group") {
      // Create a temporary column object for group column
      column = {
        id: "__group",
        width: this.groupColumnWidth,
        resizable: true,
        minWidth: 100,
        maxWidth: 500,
      } as Column<T>;
    } else {
      column = this.columnsList.find((col) => col.id === columnId);
    }

    if (column && (column.resizable || columnId === "__group")) {
      this.resizingColumn = columnId;
      this.resizeStartX = event.clientX;
      this.resizeStartWidth =
        columnId === "__group" ? this.groupColumnWidth : column.width;

      this.mouseMoveListener = (e: MouseEvent) => {
        const deltaX = e.clientX - this.resizeStartX;
        let newWidth = this.resizeStartWidth + deltaX;

        // Enforce minimum width
        const minWidth = columnId === "__group" ? 100 : column?.minWidth || 50;
        const maxWidth =
          columnId === "__group" ? 500 : column?.maxWidth || Infinity;
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

        if (columnId === "__group") {
          // Update group column width
          this.groupColumnWidth = newWidth;
        } else {
          this.gridService.resizeColumn<T>(this.gridId, columnId, newWidth);
        }
        this.updateRows();
      };

      this.mouseUpListener = () => {
        this.resizingColumn = null;
        if (this.mouseMoveListener) {
          document.removeEventListener("mousemove", this.mouseMoveListener);
          this.mouseMoveListener = null;
        }
        if (this.mouseUpListener) {
          document.removeEventListener("mouseup", this.mouseUpListener);
          this.mouseUpListener = null;
        }
      };

      document.addEventListener("mousemove", this.mouseMoveListener);
      document.addEventListener("mouseup", this.mouseUpListener);
    }
  }

  toggleColumnMenu(columnId: string): void {
    this.openMenuColumn = this.openMenuColumn === columnId ? null : columnId;
    this.setupClickOutsideListener();
    if (this.openMenuColumn) {
      // Trigger change detection to update popover position
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  getMenuPopoverLeft(): number {
    if (!this.openMenuColumn || !this.headerRef?.nativeElement) {
      return 0;
    }

    const headerCell = this.headerRef.nativeElement.querySelector(
      `[data-menu-column="${this.openMenuColumn}"]`
    ) as HTMLElement;

    if (!headerCell) {
      return 0;
    }

    const gridRect = this.container?.nativeElement?.getBoundingClientRect();
    const cellRect = headerCell.getBoundingClientRect();

    if (!gridRect || !cellRect) {
      return 0;
    }

    // Calculate position relative to grid container
    return cellRect.left - gridRect.left;
  }

  getMenuPopoverTop(): number {
    if (!this.openMenuColumn || !this.headerRef?.nativeElement) {
      return 0;
    }

    const headerCell = this.headerRef.nativeElement.querySelector(
      `[data-menu-column="${this.openMenuColumn}"]`
    ) as HTMLElement;

    if (!headerCell) {
      return 0;
    }

    const gridRect = this.container?.nativeElement?.getBoundingClientRect();
    const cellRect = headerCell.getBoundingClientRect();

    if (!gridRect || !cellRect) {
      return 0;
    }

    // Position below the header cell
    return cellRect.bottom - gridRect.top + 4; // 4px margin
  }

  private setupClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener("mousedown", this.clickOutsideListener);
    }

    if (this.openMenuColumn) {
      setTimeout(() => {
        this.clickOutsideListener = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const menuElement = document.querySelector(
            `[data-menu-column="${this.openMenuColumn}"]`
          );
          const popoverElement = document.querySelector(
            ".data-grid-menu-popover"
          );
          const buttonElement = target.closest("[data-menu-button]");
          const filterSection = target.closest(".data-grid-filter-section");
          const filterInput = target.closest(".data-grid-filter-input");
          const filterSelect = target.closest(
            ".data-grid-filter-operator-select"
          );
          const filterClear = target.closest(".data-grid-filter-clear");
          const menuButtonItem = target.closest(".data-grid-menu-button-item");
          const isInsideFilter =
            filterSection || filterInput || filterSelect || filterClear;
          const isInsideMenu = popoverElement?.contains(target);

          if (
            !menuElement?.contains(target) &&
            !buttonElement &&
            !isInsideFilter &&
            !isInsideMenu &&
            !menuButtonItem
          ) {
            this.openMenuColumn = null;
            this.cdr.detectChanges();
          }
        };
        document.addEventListener("mousedown", this.clickOutsideListener!);
      }, 0);
    }
  }

  getSortState(columnId: string): SortDirection {
    if (!this.grid) return null;
    return this.gridService.getSortState<T>(this.gridId, columnId);
  }

  getFilterCondition(columnId: string): FilterCondition | null {
    if (!this.grid) return null;
    return this.gridService.getFilterCondition<T>(this.gridId, columnId);
  }

  isEditing(rowIndex: number, columnId: string): boolean {
    return (
      this.editingCell?.rowIndex === rowIndex &&
      this.editingCell?.columnId === columnId
    );
  }

  getCellValue(row: Row<T>, column: Column<T>): unknown {
    if (!row || !row.data || !column) {
      return "";
    }
    try {
      return column.getValue(row.data);
    } catch (error) {
      return "";
    }
  }

  getRowClassValue(
    row: Row<T>,
    visibleIndex: number
  ): Record<string, boolean> | null {
    if (!row || !row.data) {
      return null;
    }

    const params = this.createRowClassParams(row, visibleIndex);
    const classes: ClassValue[] = [];

    if (typeof this.rowClass === "function") {
      classes.push((this.rowClass as RowClassFn<T>)(params));
    } else if (this.rowClass) {
      classes.push(this.rowClass);
    }

    const ruleClasses = this.evaluateRowClassRules(params);
    if (ruleClasses) {
      classes.push(ruleClasses);
    }

    return this.buildClassMap(classes);
  }

  getRowNgClass(row: Row<T>, visibleIndex: number): Record<string, boolean> {
    const baseClasses: Record<string, boolean> = {
      "data-grid-row-selected": !!row.selected,
      "data-grid-row-highlighted": !!row.highlighted,
    };
    const customClasses = this.getRowClassValue(row, visibleIndex);
    return this.mergeClassMaps(baseClasses, customClasses);
  }

  getCellClassValue(
    row: Row<T>,
    column: Column<T>,
    visibleIndex: number
  ): Record<string, boolean> | null {
    if (!row || !row.data || !column) {
      return null;
    }

    const columnDef = column.definition as ColumnDefinition<T>;
    if (!columnDef) {
      return null;
    }

    const params = this.createCellClassParams(row, column, visibleIndex);
    const classes: ClassValue[] = [];

    if (columnDef.cellClass) {
      if (typeof columnDef.cellClass === "function") {
        classes.push(
          (columnDef.cellClass as (params: CellClassParams<T>) => ClassValue)(
            params
          )
        );
      } else {
        classes.push(columnDef.cellClass);
      }
    }

    const ruleClasses = this.evaluateCellClassRules(columnDef, params);
    if (ruleClasses) {
      classes.push(ruleClasses);
    }

    return this.buildClassMap(classes);
  }

  getCellNgClass(
    row: Row<T>,
    column: Column<T>,
    visibleIndex: number
  ): Record<string, boolean> {
    const baseClasses: Record<string, boolean> = {
      "data-grid-cell-pinned-left": column.pinned === "left",
      "data-grid-cell-pinned-right": column.pinned === "right",
      "data-grid-cell-flex": column.hasFlex,
    };
    const customClasses = this.getCellClassValue(row, column, visibleIndex);
    return this.mergeClassMaps(baseClasses, customClasses);
  }

  renderCell(value: unknown, rowData: T, column: Column<T>): SafeHtml {
    if (!column) return this.sanitizer.bypassSecurityTrustHtml("");
    try {
      // Use cellRenderer if available
      const rendered = column.renderCell(value, rowData);
      if (typeof rendered === "string") {
        return this.sanitizer.bypassSecurityTrustHtml(rendered);
      }
      if (rendered instanceof HTMLElement) {
        const html =
          rendered.outerHTML ||
          rendered.textContent ||
          rendered.innerText ||
          "";
        return this.sanitizer.bypassSecurityTrustHtml(html);
      }
      return this.sanitizer.bypassSecurityTrustHtml(String(rendered));
    } catch (error) {
      return this.sanitizer.bypassSecurityTrustHtml("");
    }
  }

  getCellIcon(
    row: Row<T>,
    column: Column<T>,
    visibleIndex: number
  ): string | null {
    if (!row || !row.data || !column) {
      return null;
    }

    const columnDef = column.definition as ColumnDefinition<T>;
    if (!columnDef || !columnDef.icon) {
      return null;
    }

    try {
      const params = this.createCellClassParams(row, column, visibleIndex);
      if (typeof columnDef.icon === "function") {
        return columnDef.icon(params);
      }
      return columnDef.icon;
    } catch (error) {
      return null;
    }
  }

  getCellIconPosition(row: Row<T>, column: Column<T>): "left" | "right" {
    if (!column) return "left";
    const columnDef = column.definition as ColumnDefinition<T>;
    return columnDef.iconPosition || "left";
  }

  handleCellClick(
    row: Row<T>,
    column: Column<T>,
    visibleIndex: number,
    event: MouseEvent
  ): void {
    if (!column) return;
    const columnDef = column.definition as ColumnDefinition<T>;
    if (columnDef.onCellClick) {
      const params = this.createCellClassParams(row, column, visibleIndex);
      columnDef.onCellClick(params, event);
    }
  }

  handleCellContextMenu(
    row: Row<T>,
    column: Column<T>,
    visibleIndex: number,
    event: MouseEvent
  ): void {
    event.preventDefault();
    event.stopPropagation();

    this.contextMenuRow = row;
    this.contextMenuColumn = column;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;

    // Close on outside click
    setTimeout(() => {
      const listener = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".data-grid-context-menu")) {
          this.contextMenuVisible = false;
          document.removeEventListener("click", listener);
          document.removeEventListener("contextmenu", listener);
        }
      };
      document.addEventListener("click", listener);
      document.addEventListener("contextmenu", listener);
    }, 0);
  }

  handleContextMenuAction(action: string): void {
    if (!this.contextMenuRow || !this.contextMenuColumn) return;

    const rowData = this.contextMenuRow.data;
    const columnDef = this.contextMenuColumn.definition as ColumnDefinition<T>;
    const value = this.contextMenuColumn.getValue(rowData);

    switch (action) {
      case "copy":
        this.copyCellValue(value);
        break;
      case "cut":
        this.cutCellValue(value);
        break;
      case "paste":
        this.pasteCellValue();
        break;
      case "delete":
        this.deleteCellValue();
        break;
      case "export":
        this.exportCellData(rowData, columnDef, value);
        break;
    }

    this.cellContextMenu.emit({
      row: rowData,
      column: columnDef,
      value: value,
      action: action,
    });

    this.contextMenuVisible = false;
  }

  copyCellValue(value: any): void {
    const text = value != null ? String(value) : "";
    navigator.clipboard.writeText(text).then(() => {
      console.log("Copied to clipboard:", text);
    });
  }

  cutCellValue(value: any): void {
    this.copyCellValue(value);
    if (this.contextMenuRow && this.contextMenuColumn && this.grid) {
      const rowIndex = this.contextMenuRow.index;
      const columnId = this.contextMenuColumn.id;
      if (this.contextMenuColumn.editable) {
        this.gridService.setCellValue<T>(this.gridId, rowIndex, columnId, "");
      }
    }
  }

  async pasteCellValue(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (this.contextMenuRow && this.contextMenuColumn && this.grid) {
        const rowIndex = this.contextMenuRow.index;
        const columnId = this.contextMenuColumn.id;
        if (this.contextMenuColumn.editable) {
          this.gridService.setCellValue<T>(
            this.gridId,
            rowIndex,
            columnId,
            text
          );
        }
      }
    } catch (error) {
      console.error("Failed to paste:", error);
    }
  }

  deleteCellValue(): void {
    if (this.contextMenuRow && this.contextMenuColumn && this.grid) {
      const rowIndex = this.contextMenuRow.index;
      const columnId = this.contextMenuColumn.id;
      if (this.contextMenuColumn.editable) {
        this.gridService.setCellValue<T>(this.gridId, rowIndex, columnId, "");
      }
    }
  }

  exportCellData(row: T, column: ColumnDefinition<T>, value: any): void {
    const data = {
      row: row,
      column: column.headerName || column.id,
      value: value,
      timestamp: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cell-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleGlobalSearch(value: string): void {
    this.globalSearchValue = value;
    if (!this.grid) return;

    // Apply global search filter to all filterable columns
    if (value.trim() === "") {
      // Clear all filters if search is empty
      this.columnsList.forEach((column) => {
        if (column.filterable) {
          this.gridService.filterColumn<T>(this.gridId, column.id, null);
        }
      });
    } else {
      // Apply search to all filterable columns
      this.columnsList.forEach((column) => {
        if (column.filterable) {
          const condition: FilterCondition = {
            columnId: column.id,
            operator: "contains",
            value: value,
          };
          this.gridService.filterColumn<T>(this.gridId, column.id, condition);
        }
      });
    }
    this.updateRows();
  }

  toggleColumnVisibilityMenu(): void {
    this.columnVisibilityMenuOpen = !this.columnVisibilityMenuOpen;

    if (this.columnVisibilityMenuOpen) {
      // Close on outside click
      setTimeout(() => {
        const listener = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (!target.closest(".data-grid-column-visibility-dropdown")) {
            this.columnVisibilityMenuOpen = false;
            document.removeEventListener("click", listener);
          }
        };
        document.addEventListener("click", listener);
      }, 0);
    }
  }

  toggleColumnVisibility(columnId: string, visible: boolean): void {
    const column = this.columnsList.find((col) => col.id === columnId);
    if (column) {
      column.visible = visible;
      this.updateRows();
      this.cdr.detectChanges();
    }
  }

  toggleExportDropdown(): void {
    this.exportDropdownOpen = !this.exportDropdownOpen;

    if (this.exportDropdownOpen) {
      // Close on outside click
      setTimeout(() => {
        const listener = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (!target.closest(".data-grid-export-dropdown")) {
            this.exportDropdownOpen = false;
            document.removeEventListener("click", listener);
          }
        };
        document.addEventListener("click", listener);
      }, 0);
    }
  }

  closeExportDropdown(): void {
    this.exportDropdownOpen = false;
  }

  exportData(format: "xlsx" | "csv" | "json"): void {
    if (!this.grid) return;
    const allRows = this.gridService.getRows<T>(this.gridId);
    const columns = this.gridService.getColumns<T>(this.gridId);
    const data = allRows
      .filter((row) => !row.isGroupRow)
      .map((row) => {
        const rowData: Record<string, unknown> = {};
        this.columnsList.forEach((col) => {
          if (col.id !== "__checkbox" && col.id !== "__group") {
            const column = columns.find((c) => c.id === col.id);
            if (column) {
              const value = column.getValue(row.data);
              rowData[col.headerName || col.id] = value;
            } else {
              // Fallback to direct property access
              rowData[col.headerName || col.id] = (row.data as any)[
                col.field || col.id
              ];
            }
          }
        });
        return rowData;
      });

    this.closeExportDropdown();

    switch (format) {
      case "json":
        this.exportAsJSON(data);
        break;
      case "csv":
        this.exportAsCSV(data);
        break;
      case "xlsx":
        this.exportAsXLSX(data);
        break;
    }
  }

  exportAsJSON(data: Record<string, unknown>[]): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportAsCSV(data: Record<string, unknown>[]): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (value === null || value === undefined) return "";
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
          })
          .join(",")
      ),
    ];

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportAsXLSX(data: Record<string, unknown>[]): void {
    // For XLSX, we'll create a simple XML-based Excel format
    // Note: This is a basic implementation. For full XLSX support, consider using a library like 'xlsx'
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const xmlRows = [
      '<?xml version="1.0"?>',
      '<?mso-application progid="Excel.Sheet"?>',
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
      ' xmlns:o="urn:schemas-microsoft-com:office:office"',
      ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
      ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"',
      ' xmlns:html="http://www.w3.org/TR/REC-html40">',
      '<Worksheet ss:Name="Sheet1">',
      "<Table>",
      "<Row>",
      ...headers.map(
        (h) => `<Cell><Data ss:Type="String">${this.escapeXml(h)}</Data></Cell>`
      ),
      "</Row>",
      ...data.map((row) =>
        [
          "<Row>",
          ...headers.map((header) => {
            const value = row[header];
            const stringValue =
              value === null || value === undefined ? "" : String(value);
            return `<Cell><Data ss:Type="String">${this.escapeXml(
              stringValue
            )}</Data></Cell>`;
          }),
          "</Row>",
        ].join("")
      ),
      "</Table>",
      "</Worksheet>",
      "</Workbook>",
    ].join("\n");

    const blob = new Blob([xmlRows], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${Date.now()}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  exportAllData(): void {
    this.exportData("json");
  }

  trackByRow(index: number, row: Row<T>): number {
    return row.index;
  }

  trackByColumn(index: number, column: Column<T>): string {
    return column?.id || `col-${index}`;
  }

  trackByPage(index: number, page: number | string): number | string {
    return page;
  }

  getGroupByColumns(): string[] {
    if (!this.grid) return [];
    return this.gridService.getGroupByColumns<T>(this.gridId);
  }

  toggleGroup(groupKey: string): void {
    if (this.grid) {
      this.gridService.toggleGroup<T>(this.gridId, groupKey);
    }
  }

  groupByColumns(columnIds: string[]): void {
    if (this.grid) {
      this.gridService.groupByColumns<T>(this.gridId, columnIds);
    }
  }

  private createRowClassParams(
    row: Row<T>,
    visibleIndex: number
  ): RowClassParams<T> {
    return {
      row: row.data as T,
      rowIndex: row.index,
      visibleIndex,
    };
  }

  private createCellClassParams(
    row: Row<T>,
    column: Column<T>,
    visibleIndex: number
  ): CellClassParams<T> {
    return {
      value: this.getCellValue(row, column),
      row: row.data as T,
      column: column.definition as ColumnDefinition<T>,
      columnId: column.id,
      rowIndex: row.index,
      visibleIndex,
    };
  }

  private evaluateRowClassRules(
    params: RowClassParams<T>
  ): Record<string, boolean> | null {
    if (!this.rowClassRules) {
      return null;
    }

    const result: Record<string, boolean> = {};
    let hasEntries = false;

    for (const [className, ruleFn] of Object.entries(this.rowClassRules)) {
      if (typeof ruleFn !== "function") {
        continue;
      }
      hasEntries = true;
      try {
        result[className] = !!ruleFn(params);
      } catch (error) {
        result[className] = false;
      }
    }

    return hasEntries ? result : null;
  }

  private evaluateCellClassRules(
    columnDef: ColumnDefinition<T>,
    params: CellClassParams<T>
  ): Record<string, boolean> | null {
    const rules = columnDef?.cellClassRules;
    if (!rules) {
      return null;
    }

    const result: Record<string, boolean> = {};
    let hasEntries = false;

    for (const [className, ruleFn] of Object.entries(rules)) {
      if (typeof ruleFn !== "function") {
        continue;
      }
      hasEntries = true;
      try {
        result[className] = !!ruleFn(params);
      } catch (error) {
        result[className] = false;
      }
    }

    return hasEntries ? result : null;
  }

  private buildClassMap(values: ClassValue[]): Record<string, boolean> | null {
    if (!values || values.length === 0) {
      return null;
    }

    const classMap: Record<string, boolean> = {};
    let hasEntries = false;

    for (const value of values) {
      if (!value) continue;

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          classMap[trimmed] = true;
          hasEntries = true;
        }
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string" && item.trim().length > 0) {
            classMap[item.trim()] = true;
            hasEntries = true;
          }
        }
      } else if (typeof value === "object") {
        for (const [key, flag] of Object.entries(value)) {
          if (!key) continue;
          classMap[key] = !!flag;
          hasEntries = true;
        }
      }
    }

    return hasEntries ? classMap : null;
  }

  private mergeClassMaps(
    base: Record<string, boolean>,
    additional: Record<string, boolean> | null
  ): Record<string, boolean> {
    if (!additional) {
      return base;
    }
    return { ...base, ...additional };
  }

  toggleGroupingForColumn(columnId: string): void {
    const currentGroups = this.getGroupByColumns();
    if (currentGroups.includes(columnId)) {
      this.groupByColumns(currentGroups.filter((id) => id !== columnId));
    } else {
      this.groupByColumns([...currentGroups, columnId]);
    }
    // Close the menu after grouping is toggled
    this.openMenuColumn = null;
    if (this.clickOutsideListener) {
      document.removeEventListener("mousedown", this.clickOutsideListener);
      this.clickOutsideListener = null;
    }
    this.cdr.detectChanges();
  }

  clearGroupingAtLevel(level: number): void {
    const currentGroups = this.getGroupByColumns();
    this.groupByColumns(currentGroups.filter((_id, i) => i !== level));
  }

  handlePageClick(page: number | string): void {
    if (typeof page === "number") {
      this.setPage(page);
    }
  }

  setPage(page: number): void {
    if (this.grid) {
      this.gridService.setPage<T>(this.gridId, page);
    }
  }

  setPageSize(size: number): void {
    if (this.grid) {
      this.gridService.setPageSize<T>(this.gridId, size);
      // Immediately update pagination state and rows
      this.paginationState = this.gridService.getPaginationState<T>(
        this.gridId
      );
      this.updateRows();
      this.cdr.detectChanges();
    }
  }

  getVisiblePageNumbers(): (number | string)[] {
    if (!this.grid) return [];
    return this.gridService.getVisiblePageNumbers<T>(this.gridId);
  }

  getPaginationDisplayRange(): { text: string } | null {
    if (!this.grid || !this.paginationState) return null;
    return this.gridService.getPaginationDisplayRange<T>(this.gridId);
  }

  getGroupRowValue(row: Row<T>): string {
    if (!row || !row.data) {
      return "";
    }

    const data = row.data as any;

    // First try to get __groupValue directly
    let groupValue = data.__groupValue;

    // If not found, try to get it from the first row in the group
    if (!groupValue && data.__rows && data.__rows.length > 0) {
      const groupByColumns = this.getGroupByColumns();
      const groupLevel = row.groupLevel || 0;
      const columnId = groupByColumns[groupLevel];

      if (columnId && this.columnsList && this.columnsList.length > 0) {
        const column = this.columnsList.find((col) => col.id === columnId);
        if (column) {
          groupValue = column.getValue(data.__rows[0]);
        }
      }
    }

    if (groupValue === undefined || groupValue === null || groupValue === "") {
      return "";
    }

    // Get the column that this group is based on
    const groupByColumns = this.getGroupByColumns();
    const groupLevel = row.groupLevel || 0;
    const columnId = groupByColumns[groupLevel];

    if (columnId && this.columnsList && this.columnsList.length > 0) {
      const column = this.columnsList.find((col) => col.id === columnId);
      if (column && column.headerName) {
        // Return format: "Column Name: Value"
        return `${column.headerName}: ${groupValue}`;
      }
    }

    // Fallback: just return the group value
    return String(groupValue);
  }

  getGroupRowCount(row: Row<T>): number {
    if (!row || !row.data) return 0;
    const data = row.data as any;
    return data.__rows?.length || 0;
  }

  handleRowAnimation(): void {
    if (
      this.pendingAnimation &&
      this.pendingTopPositions &&
      this.isAnimating &&
      this.grid &&
      this.bodyRef?.nativeElement
    ) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const currentRows = this.gridService.getRows<T>(this.gridId);
            const newPositions = new Map<number, number>();
            currentRows.forEach((row, sortedIndex) => {
              newPositions.set(row.index, sortedIndex);
            });

            // Query DOM elements directly using data-row-index
            const bodyElement = this.bodyRef.nativeElement;
            const rowElements = bodyElement.querySelectorAll(
              '[data-row-index]'
            ) as NodeListOf<HTMLElement>;

            rowElements.forEach((el) => {
              const rowDataIndex = parseInt(
                el.getAttribute('data-row-index') || '0',
                10
              );
              if (
                this.pendingAnimation!.has(rowDataIndex) &&
                newPositions.has(rowDataIndex) &&
                this.pendingTopPositions!.has(rowDataIndex)
              ) {
                const oldTop = this.pendingTopPositions!.get(rowDataIndex)!;
                const newSortedPos = newPositions.get(rowDataIndex)!;
                const newTop = newSortedPos * this.rowHeight;
                const offset = oldTop - newTop;

                if (Math.abs(offset) > 0.1) {
                  el.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
                  el.style.transform = `translateY(${offset}px)`;
                  void el.offsetHeight; // Force reflow
                  requestAnimationFrame(() => {
                    el.style.transform = 'translateY(0)';
                  });
                }
              }
            });

            if (this.pendingAnimation) {
              this.rowPositions = new Map(this.pendingAnimation);
            }
            this.pendingAnimation = null;
            this.pendingTopPositions = null;

            setTimeout(() => {
              rowElements.forEach((el) => {
                if (el) {
                  el.style.transform = '';
                  el.style.opacity = '';
                  el.style.transition = '';
                }
              });
              this.isAnimating = false;
              this.rowPositions = new Map();
              this.rowTopPositions = new Map();
            }, 400);
          });
        });
      }, 50);
    }
  }
}
