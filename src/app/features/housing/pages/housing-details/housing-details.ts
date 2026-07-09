import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HousingService } from '../../../../core/services/housing.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { ChatService } from '../../../../core/services/chat.service';
import { HousingUnitDetails, GenderAllowed, genderLabel } from '../../../../core/models/housing.model';
import { Review } from '../../../../core/models/feedback.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-housing-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './housing-details.html'
})
export class HousingDetails implements OnInit {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private housingService  = inject(HousingService);
  private wishlistService = inject(WishlistService);
  private feedbackService = inject(FeedbackService);
  private chatService     = inject(ChatService);

  housing              = signal<HousingUnitDetails | null>(null);
  reviews              = signal<Review[]>([]);
  isLoading            = signal(true);
  errorMessage         = signal<string | null>(null);
  newComment           = signal('');
  newRating            = signal(5);
  isSubmittingReview   = signal(false);
  isInitiatingChat     = signal(false);

  // expose to template
  GenderAllowed = GenderAllowed;
  genderLabel   = genderLabel;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.housingService.getDetailsById(id).subscribe({
        next: (data) => {
          this.housing.set(data);
          this.isLoading.set(false);
          this.loadReviews(data.housingUnitId);
        },
        error: (err) => {
          console.error('Failed to load housing details', err);
          this.errorMessage.set('Could not load housing details. Please try again.');
          this.isLoading.set(false);
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
    const id = this.housing()?.housingUnitId;
    if (!id || !this.newComment().trim()) return;

    this.isSubmittingReview.set(true);
    this.feedbackService.addReview({
      housingUnitId: id,
      comment: this.newComment(),
      rating: this.newRating()
    }).subscribe({
      next: (rev) => {
        this.reviews.update(prev => [rev, ...prev]);
        this.newComment.set('');
        this.isSubmittingReview.set(false);
      },
      error: (err) => {
        console.error('Failed to submit review', err);
        this.isSubmittingReview.set(false);
      }
    });
  }

  toggleWishlist() {
    const item = this.housing();
    if (item) {
      this.wishlistService.toggleWishlist({ id: item.housingUnitId, ...item } as any);
    }
  }

  isInWishlist(): boolean {
    const item = this.housing();
    return item ? this.wishlistService.isInWishlist(item.housingUnitId) : false;
  }

  openMapLink() {
    const h = this.housing();
    if (h?.latitude && h?.longitude) {
      window.open(`https://www.google.com/maps?q=${h.latitude},${h.longitude}`, '_blank');
    }
  }

  chatWithLandlord() {
    const h = this.housing();
    if (!h) return;
    
    this.isInitiatingChat.set(true);
    this.chatService.initiateChat({ housingUnitId: h.housingUnitId }).subscribe({
      next: (response: any) => {
        this.isInitiatingChat.set(false);
        
        // Handle various possible backend response structures
        const conversationId = response?.id || response?.conversationId || response?.data?.id || response?.data?.conversationId;
        
        if (conversationId) {
          // Navigate to the chat page with the conversation ID in query parameters
          this.router.navigate(['/student/chat'], { queryParams: { conversationId } });
        } else {
          console.error('Chat initiated, but no conversation ID was returned in the response:', response);
          // Fallback to navigating to the chat page generally
          this.router.navigate(['/student/chat']);
        }
      },
      error: (err) => {
        console.error('Failed to initiate chat', err);
        this.isInitiatingChat.set(false);
      }
    });
  }
}
