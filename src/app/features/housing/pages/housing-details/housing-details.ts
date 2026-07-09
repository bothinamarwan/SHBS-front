import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HousingService } from '../../../../core/services/housing.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { ReviewService } from '../../../../core/services/review.service';
import { ChatService } from '../../../../core/services/chat.service';
import { HousingUnitDetails, GenderAllowed, genderLabel } from '../../../../core/models/housing.model';
import { Review, UpdateReviewRequest } from '../../../../core/models/review.model';
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
  private reviewService   = inject(ReviewService);
  private chatService     = inject(ChatService);

  housing              = signal<HousingUnitDetails | null>(null);
  reviews              = signal<Review[]>([]);
  isLoading            = signal(true);
  errorMessage         = signal<string | null>(null);
  newComment           = signal('');
  newRating            = signal(5);
  isSubmittingReview   = signal(false);
  isInitiatingChat     = signal(false);
  isEditingReview      = signal(false);
  editingReviewId      = signal<string | null>(null);

  // expose to template
  GenderAllowed = GenderAllowed;
  genderLabel   = genderLabel;

  // Get current student ID from localStorage
  currentStudentId = computed(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user?.studentId || user?.id;
  });

  // Check if current student has already reviewed this housing unit
  hasReviewed = computed(() => {
    const studentId = this.currentStudentId();
    return this.reviews().some(r => r.studentId === studentId);
  });

  // Get the current student's review
  currentUserReview = computed(() => {
    const studentId = this.currentStudentId();
    return this.reviews().find(r => r.studentId === studentId);
  });

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

    if (this.isEditingReview() && this.editingReviewId()) {
      // Update existing review
      const request: UpdateReviewRequest = {
        reviewId: this.editingReviewId()!,
        rating: this.newRating(),
        comment: this.newComment()
      };

      this.reviewService.update(request).subscribe({
        next: (rev) => {
          console.log('Review updated successfully:', rev);
          this.reviews.update(prev => prev.map(r =>
            r.reviewId === rev.reviewId ? { ...r, ...rev } : r
          ));
          this.cancelEditReview();
          this.isSubmittingReview.set(false);
        },
        error: (err) => {
          console.error('Failed to update review', err);
          this.isSubmittingReview.set(false);
        }
      });
    } else {
      // Create new review
      this.feedbackService.addReview({
        housingUnitId: id,
        comment: this.newComment(),
        rating: this.newRating()
      }).subscribe({
        next: (rev) => {
          console.log('Review submitted successfully:', rev);
          const reviewToAdd: Review = {
            reviewId: rev.reviewId,
            studentId: rev.studentId,
            housingUnitId: rev.housingUnitId || id,
            rating: rev.rating,
            comment: rev.comment,
            reviewDate: rev.reviewDate || rev.createdAt,
            studentName: rev.studentName || 'You'
          };
          this.reviews.update(prev => [reviewToAdd, ...prev]);
          this.newComment.set('');
          this.isSubmittingReview.set(false);
        },
        error: (err) => {
          console.error('Failed to submit review', err);
          this.isSubmittingReview.set(false);
        }
      });
    }
  }

  editReview(review: Review) {
    this.isEditingReview.set(true);
    this.editingReviewId.set(review.reviewId);
    this.newComment.set(review.comment);
    this.newRating.set(review.rating);
  }

  cancelEditReview() {
    this.isEditingReview.set(false);
    this.editingReviewId.set(null);
    this.newComment.set('');
    this.newRating.set(5);
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.reviewService.delete(reviewId).subscribe({
      next: () => {
        console.log('Review deleted successfully');
        this.reviews.update(prev => prev.filter(r => r.reviewId !== reviewId));
      },
      error: (err) => {
        console.error('Failed to delete review', err);
      }
    });
  }

  isOwnReview(review: Review): boolean {
    return review.studentId === this.currentStudentId();
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
