import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('SHBS-1');

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Handle Google OAuth redirect that lands on the root URL:
    // e.g. /?success=true&token=<jwt>&refreshToken=<rt>
    this.route.queryParamMap.subscribe(params => {
      const success = params.get('success');
      const token = params.get('token') || params.get('accessToken');
      const refreshToken = params.get('refreshToken') ?? '';

      if (success === 'true' && token) {
        this.authService.handleGoogleCallback(token, refreshToken);

        const role = this.authService.currentUserValue?.role ?? 'student';
        const redirectMap: Record<string, string> = {
          landlord: '/landlord',
          admin: '/admin',
          student: '/student'
        };

        // Navigate and clear the tokens from the URL
        this.router.navigate([redirectMap[role] ?? '/student'], {
          replaceUrl: true
        });
      }
    });
  }
}
