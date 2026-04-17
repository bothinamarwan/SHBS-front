import { Component } from '@angular/core';

@Component({
  selector: 'app-landlord-dashboard',
  standalone: true,
  template: `
    <div>
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Landlord Dashboard</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 class="text-lg font-semibold">My Properties</h3>
            <p class="text-3xl font-bold text-purple-600 mt-2">3</p>
        </div>
      </div>
    </div>
  `
})
export class LandlordDashboard {}
