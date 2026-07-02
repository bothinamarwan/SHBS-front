import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.css'
})
export class ConfirmEmail implements OnInit {
  isLoading = signal(true);
  isSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!userId || !token) {
      this.isLoading.set(false);
      this.errorMessage.set('Invalid confirmation link. Missing userId or token.');
      return;
    }

    this.authService.confirmEmail(userId, token).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.isSuccess.set(true);
          this.successMessage.set(res.message || 'Your email has been confirmed successfully!');
        } else {
          this.errorMessage.set(res.message || 'Email confirmation failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || err?.error?.title || 'Email confirmation failed. The link may have expired.';
        this.errorMessage.set(msg);
      }
    });
  }
}
