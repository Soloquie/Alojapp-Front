import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SearchResultsComponent } from './pages/results/results';
import { SearchRoutingModule } from './search-routing-module';

@NgModule({
  declarations: [SearchResultsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SearchRoutingModule
  ]
})
export class SearchModule {}
