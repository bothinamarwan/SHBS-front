import { Routes } from '@angular/router';

export const listingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/search/search').then(m => m.Search)
  }
];
