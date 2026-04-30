import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { Housing } from '../../../../core/models/housing.model';

@Component({
  selector: 'app-wishlist-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist-list.html'
})
export class WishlistList implements OnInit {
  private wishlistService = inject(WishlistService);
  
  items = signal<Housing[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.wishlistService.getWishlist().subscribe(data => {
      this.items.set(data);
      this.isLoading.set(false);
    });
  }

  removeItem(item: Housing) {
    this.wishlistService.toggleWishlist(item);
    // The subscription in ngOnInit will update the items signal automatically
  }
}
