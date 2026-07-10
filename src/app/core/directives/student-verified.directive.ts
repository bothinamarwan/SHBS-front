import { Directive, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[studentVerified]',
  standalone: true
})
export class StudentVerifiedDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  constructor() {
    this.checkVerification();
  }

  private checkVerification() {
    const user = this.authService.currentUserValue;
    
    // Allow if not a student (admin, landlord, guest)
    if (user?.role !== 'student') {
      this.viewContainer.createEmbeddedView(this.templateRef);
      return;
    }

    // Allow if student is verified (universityVerificationStatus === 1)
    if (user?.universityVerificationStatus === 1) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      return;
    }

    // Hide content for unverified students
    this.viewContainer.clear();
  }
}
