import {
  Component, inject, signal, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HousingService } from '../../../../core/services/housing.service';
import { MapPin, GenderAllowed, genderLabel } from '../../../../core/models/housing.model';
import * as L from 'leaflet';

// Fix Leaflet default marker icon path in Angular bundler
const iconRetinaUrl  = 'assets/leaflet/marker-icon-2x.png';
const iconUrl        = 'assets/leaflet/marker-icon.png';
const shadowUrl      = 'assets/leaflet/marker-shadow.png';
const DefaultIcon = L.icon({ iconRetinaUrl, iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

@Component({
  selector: 'app-housing-map',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './housing-map.html'
})
export class HousingMap implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private housingService = inject(HousingService);
  private router         = inject(Router);

  pins         = signal<MapPin[]>([]);
  isLoading    = signal(true);
  errorMessage = signal<string | null>(null);
  selectedPin  = signal<MapPin | null>(null);

  GenderAllowed = GenderAllowed;
  genderLabel   = genderLabel;

  private map!: L.Map;
  private markers: L.Marker[] = [];

  ngOnInit() {
    this.housingService.getMapPins().subscribe({
      next: (data) => {
        this.pins.set(data);
        this.isLoading.set(false);
        this.renderMarkers(data);
      },
      error: () => {
        this.errorMessage.set('Could not load map pins. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [30.0444, 31.2357], // Cairo default
      zoom: 11,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);
  }

  private renderMarkers(pins: MapPin[]) {
    if (!this.map) return;

    // Clear old markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const validPins = pins.filter(p => p.latitude && p.longitude);

    validPins.forEach(pin => {
      const genderColor = pin.isAvailable
        ? (pin.unitImageUrl ? '#6366f1' : '#6366f1')
        : '#9ca3af';

      const markerHtml = `
        <div style="
          background: ${genderColor};
          color: white;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(99,102,241,0.35);
          border: 2px solid white;
          cursor: pointer;
          transform: translateX(-50%);
          position: relative;
          letter-spacing: -0.02em;
        ">
          ${new Intl.NumberFormat('en-EG').format(pin.baseMonthlyPrice || pin.price)} EGP
          <span style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid ${genderColor};"></span>
        </div>`;

      const icon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([pin.latitude, pin.longitude], { icon })
        .addTo(this.map)
        .on('click', () => this.selectedPin.set(pin));

      this.markers.push(marker);
    });

    // Fit map to all markers
    if (validPins.length > 0) {
      const bounds = L.latLngBounds(validPins.map(p => [p.latitude, p.longitude]));
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  goToDetails(pin: MapPin) {
    this.router.navigate(['/listings/housing', pin.housingUnitId]);
  }

  closePopup() {
    this.selectedPin.set(null);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }
}
