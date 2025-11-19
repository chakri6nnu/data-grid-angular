import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridComponent } from './data-grid.component';
import { DataGridService } from './data-grid.service';

@NgModule({
  imports: [CommonModule, DataGridComponent],
  providers: [DataGridService],
  exports: [DataGridComponent],
})
export class DataGridModule {}

