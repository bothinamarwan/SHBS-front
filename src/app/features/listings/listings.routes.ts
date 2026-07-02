import { Routes } from '@angular/router';

export const listingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/search/search').then(m => m.Search)
  },
  {
    path: 'map',
    loadComponent: () =>
      import('../housing/pages/housing-map/housing-map').then(m => m.HousingMap)
  },
  {
    path: 'housing/:id',
    loadComponent: () =>
      import('../housing/pages/housing-details/housing-details').then(m => m.HousingDetails)
  }
];
