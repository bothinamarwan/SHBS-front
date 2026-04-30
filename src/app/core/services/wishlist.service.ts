import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, delay, startWith } from 'rxjs';
import { Housing } from '../models/housing.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlist = signal<Housing[]>([]);

  constructor() {
    this.loadWishlist();
  }

  private loadWishlist() {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      try {
        this.wishlist.set(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading wishlist from localStorage', e);
        this.wishlist.set([]);
      }
    }
  }

  getWishlist(): Observable<Housing[]> {
    // Return an observable that updates whenever the signal does
    return toObservable(this.wishlist).pipe(
      // Ensure it emits the initial value too
      startWith(this.wishlist()),
      delay(500)
    );
  }

  toggleWishlist(housing: Housing) {
    const exists = this.wishlist().some(h => h.id === housing.id);
    if (exists) {
      this.wishlist.update(prev => prev.filter(h => h.id !== housing.id));
    } else {
      this.wishlist.update(prev => [...prev, housing]);
    }
    this.saveWishlist();
  }

  private saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist()));
  }

  isInWishlist(id: string): boolean {
    return this.wishlist().some(h => h.id === id);
  }
}
