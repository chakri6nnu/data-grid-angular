import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GridDemoComponent } from "./components/grid-demo.component";
import { generateSampleData, SampleData } from "./data/sample-data";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, GridDemoComponent],
  template: `
    <div class="App">
      <main>
        <app-grid-demo [data]="sampleData"></app-grid-demo>
      </main>
    </div>
  `,
  styles: [
    `
      .App {
        min-height: 100vh;
        background: #f5f5f5;
      }

      main {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 20px;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  sampleData: SampleData[] = [];

  ngOnInit(): void {
    this.sampleData = generateSampleData(50000);
  }
}

