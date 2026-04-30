import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HousingService } from '../../../../core/services/housing.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { Housing } from '../../../../core/models/housing.model';
import { Review } from '../../../../core/models/feedback.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-housing-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './housing-details.html'
})
export class HousingDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private housingService = inject(HousingService);
  private wishlistService = inject(WishlistService);
  private feedbackService = inject(FeedbackService);

  housing = signal<Housing | null>(null);
  reviews = signal<Review[]>([]);
  newComment = signal('');
  newRating = signal(5);
  isSubmittingReview = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.housingService.getHousingById(id).subscribe(data => {
        if (data) {
          this.housing.set(data);
          this.loadReviews(data.id);
        }
      });
    }
  }

  loadReviews(id: string) {
    this.feedbackService.getReviewsByHousing(id).subscribe(revs => {
      this.reviews.set(revs);
    });
  }

  submitReview() {
    const id = this.housing()?.id;
    if (!id || !this.newComment().trim()) return;

    this.isSubmittingReview.set(true);
    this.feedbackService.addReview({
      housingId: id,
      comment: this.newComment(),
      rating: this.newRating()
    }).subscribe({
      next: (rev) => {
        this.reviews.update(prev => [rev, ...prev]);
        this.newComment.set('');
        this.isSubmittingReview.set(false);
      },
      error: () => this.isSubmittingReview.set(false)
    });
  }

  toggleWishlist() {
    const item = this.housing();
    if (item) {
      this.wishlistService.toggleWishlist(item);
    }
  }

  isInWishlist(): boolean {
    const item = this.housing();
    return item ? this.wishlistService.isInWishlist(item.id) : false;
  }

  getFacilityIcon(facility: string): string {
    const map: any = {
      'WiFi': 'fas fa-wifi',
      'AC': 'fas fa-snowflake',
      'Kitchen': 'fas fa-utensils',
      'Laundry': 'fas fa-tshirt',
      'Security': 'fas fa-user-shield',
      'Gym': 'fas fa-dumbbell',
      'Study Room': 'fas fa-book-reader'
    };
    return map[facility] || 'fas fa-check';
  }
}
