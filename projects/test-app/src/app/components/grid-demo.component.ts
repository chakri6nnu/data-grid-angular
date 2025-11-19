import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  DataGridComponent,
  ColumnDefinition,
  RowActionButton,
} from "data-grid";
import { SampleData } from "../data/sample-data";

@Component({
  selector: "app-grid-demo",
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  template: `
    <div style="padding: 20px">
      <h2>Data Grid Demo</h2>
      <div style="margin-bottom: 10px">
        <p>Total rows: {{ data.length }}</p>
        <p *ngIf="selectedRows.length > 0">
          Selected rows: {{ selectedRows.length }}
        </p>
      </div>
      <div style="margin-bottom: 10px">
        <button
          (click)="groupByDepartment()"
          style="margin-right: 10px; padding: 8px 16px; cursor: pointer"
        >
          Group by department
        </button>
        <button
          (click)="groupByDepartmentAndActive()"
          style="margin-right: 10px; padding: 8px 16px; cursor: pointer"
        >
          Group by department, active
        </button>
        <button
          (click)="groupByDepartmentAndActiveAndSalary()"
          style="margin-right: 10px; padding: 8px 16px; cursor: pointer"
        >
          Group by department, active, salary
        </button>
        <button
          (click)="clearGrouping()"
          style="padding: 8px 16px; cursor: pointer"
        >
          Clear Grouping
        </button>
      </div>
      <data-grid
        #gridRef
        [columns]="columns"
        [rowData]="data"
        [rowHeight]="35"
        [headerHeight]="45"
        [enableSorting]="true"
        [enableFiltering]="true"
        [enablePagination]="true"
        [enableGrouping]="true"
        [pageSize]="50"
        [enableSelection]="true"
        [selectionType]="'multiple'"
        [rowActionButtons]="rowActionButtons"
        [enableCellEditing]="true"
        [enableColumnResize]="true"
        [theme]="'light'"
        [width]="'100%'"
        [height]="'600px'"
        [rowClass]="rowClassFn"
        [rowClassRules]="rowClassRules"
        [isRowSelectable]="isRowSelectableFn"
        [enableGlobalSearch]="true"
        [globalSearchPlaceholder]="'Search all columns...'"
        (selectionChanged)="onSelectionChanged($event)"
        (cellContextMenu)="onCellContextMenu($event)"
        (selectionAction)="onSelectionAction($event)"
        (cellValueChanged)="onCellValueChanged($event)"
        (sortChanged)="onSortChanged($event)"
      ></data-grid>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .row-inactive {
        opacity: 0.7;
      }

      :host ::ng-deep .row-high-salary {
        background-color: rgba(34, 197, 94, 0.15);
      }

      :host ::ng-deep .cell-high-salary {
        color: #15803d;
        font-weight: 600;
      }

      :host ::ng-deep .cell-low-salary {
        color: #b91c1c;
        font-weight: 600;
      }

      :host ::ng-deep .cell-active-badge {
        font-weight: 600;
      }

      :host ::ng-deep .cell-active-badge.cell-active {
        color: #065f46;
      }

      :host ::ng-deep .cell-active-badge.cell-inactive {
        color: #991b1b;
      }
    `,
  ],
})
export class GridDemoComponent implements OnInit {
  @Input() data: SampleData[] = [];
  @ViewChild("gridRef") gridRef!: DataGridComponent<SampleData>;

  selectedRows: SampleData[] = [];

  // Row action buttons configuration with Hero Icons
  rowActionButtons: RowActionButton[] = [
    {
      id: "copy",
      label: "Copy",
      title: "Copy selected rows",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"/></svg>`,
    },
    {
      id: "export",
      label: "Export",
      title: "Export selected rows",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    },
    {
      id: "delete",
      label: "Delete",
      title: "Delete selected rows",
      class: "delete",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    },
  ];

  rowClassFn = (params: { row: SampleData }) =>
    params.row.active ? null : "row-inactive";

  rowClassRules: Record<string, (params: { row: SampleData }) => boolean> = {
    "row-high-salary": ({ row }) => row.salary >= 120000,
  };

  columns: ColumnDefinition<SampleData>[] = [
    {
      id: "id",
      field: "id",
      headerName: "ID",
      width: 80,
      sortable: true,
    },
    {
      id: "name",
      field: "name",
      headerName: "Name",
      width: 150,
      sortable: true,
      filterable: true,
      editable: true,
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>',
      iconPosition: "left",
      onCellClick: (params, event) => {
        console.log("Name cell clicked:", params.value, params.row);
      },
    },
    {
      id: "email",
      field: "email",
      headerName: "Email",
      width: 200,
      sortable: true,
      filterable: true,
      editable: true,
      cellRenderer: (value: string) => {
        return `<span style="display: inline-flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #3b82f6;">
            <path d="M7 7a3 3 0 100-6 3 3 0 000 6zm0 1c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"/>
          </svg>
          ${value}
        </span>`;
      },
    },
    {
      id: "age",
      field: "age",
      headerName: "Age",
      width: 80,
      sortable: true,
      filterable: true,
      type: "number",
      editable: true,
      enableRowGroup: true,
      cellRenderer: (value: number) => {
        const color =
          value >= 50 ? "#ef4444" : value >= 40 ? "#f59e0b" : "#22c55e";
        return `<span style="display: inline-flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: ${color};">
            <path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm.5-8H6v3.5l2.5 1.5.75-1.25L7.5 6.5H7.5z"/>
          </svg>
          ${value}
        </span>`;
      },
    },
    {
      id: "department",
      field: "department",
      headerName: "Department",
      width: 190,
      sortable: true,
      filterable: true,
      editable: true,
      enableRowGroup: true,
      cellRenderer: (value: string) => {
        const icons: Record<string, string> = {
          Engineering:
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #3b82f6;"><path d="M7 0L0 3v4c0 4.42 3.58 8 7 8s7-3.58 7-8V3L7 0zm0 2.18l5 1.82v3.64c0 3.31-2.69 6-5 6s-5-2.69-5-6V4l5-1.82z"/></svg>',
          Sales:
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #22c55e;"><path d="M7 0L0 4v6c0 3.31 2.69 6 7 6s7-2.69 7-6V4L7 0zm0 2.5l5 2.5v4.5c0 2.48-2.02 4.5-5 4.5s-5-2.02-5-4.5V5l5-2.5z"/></svg>',
          Marketing:
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #f59e0b;"><path d="M7 0C3.13 0 0 3.13 0 7c0 3.87 3.13 7 7 7s7-3.13 7-7c0-3.87-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>',
          HR: '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #8b5cf6;"><path d="M7 7a3 3 0 100-6 3 3 0 000 6zm0 1c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"/></svg>',
          Finance:
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #10b981;"><path d="M7 0L0 3v4c0 4.42 3.58 8 7 8s7-3.58 7-8V3L7 0zm0 2.18l5 1.82v3.64c0 3.31-2.69 6-5 6s-5-2.69-5-6V4l5-1.82z"/></svg>',
          Operations:
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #6366f1;"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>',
        };
        const icon =
          icons[value] ||
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0L0 3v4c0 4.42 3.58 8 7 8s7-3.58 7-8V3L7 0z"/></svg>';
        return `<span style="display: inline-flex; align-items: center; gap: 6px;">${icon}${value}</span>`;
      },
    },
    {
      id: "salary",
      field: "salary",
      headerName: "Salary",
      width: 120,
      sortable: true,
      type: "number",
      cellRenderer: (value: number) => {
        const icon =
          value >= 100000
            ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #22c55e;"><path d="M7 0L0 3v4c0 4.42 3.58 8 7 8s7-3.58 7-8V3L7 0zm0 2.18l5 1.82v3.64c0 3.31-2.69 6-5 6s-5-2.69-5-6V4l5-1.82z"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #6b7280;"><path d="M7 0L0 3v4c0 4.42 3.58 8 7 8s7-3.58 7-8V3L7 0zm0 2.18l5 1.82v3.64c0 3.31-2.69 6-5 6s-5-2.69-5-6V4l5-1.82z"/></svg>';
        return `<span style="display: inline-flex; align-items: center; gap: 4px;">${icon}$${value.toLocaleString()}</span>`;
      },
      editable: true,
      enableRowGroup: true,
      cellClassRules: {
        "cell-high-salary": ({ value }) => Number(value) >= 120000,
        "cell-low-salary": ({ value }) => Number(value) <= 50000,
      },
    },
    {
      id: "active",
      field: "active",
      headerName: "Active",
      width: 180,
      sortable: true,
      filterable: true,
      type: "boolean",
      cellRenderer: (value: boolean, row: SampleData) => {
        const icon = value
          ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #22c55e;"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm3.5 5.5L6 10 3.5 7.5l1.41-1.41L6 7.18l3.09-3.09L10.5 5.5z"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #ef4444;"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm3.5 5.5L6 10 3.5 7.5l1.41-1.41L6 7.18l3.09-3.09L10.5 5.5z"/></svg>';
        return `<span style="display: inline-flex; align-items: center; gap: 4px;">${icon}${
          value ? "Yes" : "No"
        }</span>`;
      },
      cellClass: ({ value }) => [
        "cell-active-badge",
        value ? "cell-active" : "cell-inactive",
      ],
      enableRowGroup: true,
    },
    {
      id: "joinDate",
      field: "joinDate",
      headerName: "Join Date",
      width: 180,
      sortable: true,
      filterable: true,
      type: "date",
      cellRenderer: (value: string) => {
        const date = new Date(value);
        const isRecent =
          Date.now() - date.getTime() < 365 * 24 * 60 * 60 * 1000; // Less than 1 year
        const icon = isRecent
          ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #22c55e;"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm.5-8H6v3.5l2.5 1.5.75-1.25L7.5 6.5H7.5z"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="color: #6b7280;"><path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm.5-8H6v3.5l2.5 1.5.75-1.25L7.5 6.5H7.5z"/></svg>';
        return `<span style="display: inline-flex; align-items: center; gap: 6px;">${icon}${value}</span>`;
      },
    },
  ];

  isRowSelectableFn = (row: SampleData, rowIndex: number): boolean => {
    // Disable selection for inactive rows
    return row.active !== false;
  };

  ngOnInit(): void {}

  onSelectionChanged(rows: SampleData[]): void {
    this.selectedRows = rows;
  }

  onCellValueChanged(event: {
    rowIndex: number;
    columnId: string;
    value: unknown;
    row: SampleData;
  }): void {
    console.log("Cell value changed:", event);
  }

  onSortChanged(event: {
    columnId: string;
    direction: "asc" | "desc" | null;
  }): void {
    console.log("Sort changed:", event);
  }

  onCellContextMenu(event: {
    row: SampleData;
    column: any;
    value: any;
    action: string;
  }): void {
    console.log("Cell context menu action:", event.action, event);
  }

  onSelectionAction(event: {
    action: string;
    selectedRows: SampleData[];
  }): void {
    console.log(
      "Selection action:",
      event.action,
      "on",
      event.selectedRows.length,
      "rows"
    );

    switch (event.action) {
      case "delete":
        // Remove selected rows from data
        const selectedIds = new Set(event.selectedRows.map((r) => r.id));
        this.data = this.data.filter((item) => !selectedIds.has(item.id));
        console.log(`Deleted ${event.selectedRows.length} rows`);
        break;
      case "copy":
        // Copy selected rows to clipboard
        const text = JSON.stringify(event.selectedRows, null, 2);
        navigator.clipboard.writeText(text).then(() => {
          console.log("Copied to clipboard");
        });
        break;
      case "export":
        // Export selected rows as JSON
        const json = JSON.stringify(event.selectedRows, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `exported-rows-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log("Exported to file");
        break;
    }
  }

  groupByDepartment(): void {
    if (this.gridRef) {
      this.gridRef.groupByColumns(["department"]);
    }
  }

  groupByDepartmentAndActive(): void {
    if (this.gridRef) {
      this.gridRef.groupByColumns(["department", "active"]);
    }
  }

  groupByDepartmentAndActiveAndSalary(): void {
    if (this.gridRef) {
      this.gridRef.groupByColumns(["department", "active", "salary"]);
    }
  }

  clearGrouping(): void {
    if (this.gridRef) {
      this.gridRef.groupByColumns([]);
    }
  }
}
