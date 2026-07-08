import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../../../../core/models/user.model';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  // Clear mismatch error if passwords now match
  if (confirm?.errors?.['mismatch']) {
    const { mismatch, ...rest } = confirm.errors;
    confirm.setErrors(Object.keys(rest).length ? rest : null);
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  showPassword = signal(false);
  showConfirm  = signal(false);
  isLoading    = signal(false);
  errorMessage = signal<string | null>(null);
  selectedRole = signal<'student' | 'landlord'>('student');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      // Common fields
      fullName:    ['', [Validators.required, Validators.minLength(3)]],
      email:       ['', [Validators.required, Validators.email]],
      phone:       ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      password:    ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/)
      ]],
      confirmPassword: ['', Validators.required],
      role:        ['student'],
      agreeTerms:  [false, Validators.requiredTrue],

      // Student specific
      nationalID:    ['', [Validators.pattern(/^[0-9]{14}$/)]],
      gender:        ['male'],
      dateOfBirth:   [''],
      city:          [''],
      address:       [''],
      preferredArea: [''],

      // Landlord specific
      companyName:            [''],
      propertyOwnershipProof: [''],

      // Common Profile Image
      profileImage:           ['']
    }, { validators: passwordMatchValidator });
  }

  selectRole(role: 'student' | 'landlord') {
    this.selectedRole.set(role);
    this.registerForm.get('role')?.setValue(role);
  }

  togglePassword() { this.showPassword.update(v => !v); }
  toggleConfirm()  { this.showConfirm.update(v => !v);  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // e.target.result contains the base64 encoded string
        this.registerForm.patchValue({ profileImage: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage.set('Please check the form for validation errors and try again.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const v = this.registerForm.value;
    const isStudent = this.selectedRole() === 'student';

    let payload: any;

    if (isStudent) {
      // ── POST /api/v1/Account/register/student ──────────────────────────
      // Schema: email, phoneNumber, password, confirmPassword, userName,
      //         dateOfBirth (ISO), gender (0=Male|1=Female), address, city,
      //         preferredArea, nationalId, profileImage
      payload = {
        email:           v.email,
        phoneNumber:     v.phone,
        password:        v.password,
        confirmPassword: v.confirmPassword,
        userName:        v.fullName,
        dateOfBirth:     v.dateOfBirth
          ? new Date(v.dateOfBirth).toISOString()
          : new Date().toISOString(),
        gender:        v.gender === 'male' ? 0 : 1,
        address:       v.address       || '',
        city:          v.city          || '',
        preferredArea: v.preferredArea || '',
        nationalId:    v.nationalID    || '',
        profileImage:  v.profileImage  || ''
      };
    } else {
      // ── POST /api/v1/Account/register/landlord ─────────────────────────
      // Schema: email, phoneNumber, password, confirmPassword, fullName,
      //         companyName, nationalId, propertyOwnerShipProof, profileImage
      payload = {
        email:                  v.email,
        phoneNumber:            v.phone,
        password:               v.password,
        confirmPassword:        v.confirmPassword,
        fullName:               v.fullName,
        companyName:            v.companyName            || '',
        nationalId:             v.nationalID             || '',
        propertyOwnerShipProof: v.propertyOwnershipProof || '',
        profileImage:           v.profileImage           || ''
      };
    }

    console.log('Registering as:', isStudent ? 'student' : 'landlord');
    console.log('Payload:', payload);

    const register$ = isStudent
      ? this.authService.registerStudent(payload)
      : this.authService.registerLandlord(payload);

    register$.subscribe({
      next: (res: AuthResponse) => {
        this.isLoading.set(false);

        // Always redirect to 2FA setup after registration
        this.router.navigate(['/auth/setup-2fa'], {
          queryParams: { email: v.email }
        });
      },
      error: (err) => {
        this.isLoading.set(false);

        // Surface the real backend error message
        const backendMsg =
          err?.error?.message ||
          err?.error?.title ||
          (typeof err?.error === 'string' ? err.error : null);

        this.errorMessage.set(backendMsg ?? 'Registration failed. Please try again.');
        
        // Enhance UX: Field specific errors
        if (backendMsg) {
          const lowerMsg = backendMsg.toLowerCase();
          if (lowerMsg.includes('email')) {
            this.registerForm.get('email')?.setErrors({ emailTaken: true });
          } else if (lowerMsg.includes('password')) {
            this.registerForm.get('password')?.setErrors({ serverError: backendMsg });
          }
        }

        console.error('Register error:', err);
      }
    });
  }

  onGoogleLogin(): void {
    this.authService.initiateGoogleLogin();
  }

  get fullName()        { return this.registerForm.get('fullName'); }
  get email()           { return this.registerForm.get('email'); }
  get phone()           { return this.registerForm.get('phone'); }
  get password()        { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get agreeTerms()      { return this.registerForm.get('agreeTerms'); }

  getPasswordStrength(): { level: number; label: string; color: string } {
    const val = this.password?.value || '';
    let score = 0;
    if (val.length >= 8)           score++;
    if (/[A-Z]/.test(val))         score++;
    if (/[0-9]/.test(val))         score++;
    if (/[^A-Za-z0-9]/.test(val))  score++;
    const map = [
      { level: 0, label: '',       color: '' },
      { level: 1, label: 'Weak',   color: '#b31b25' },
      { level: 2, label: 'Fair',   color: '#705900' },
      { level: 3, label: 'Good',   color: '#00675f' },
      { level: 4, label: 'Strong', color: '#105aaf' }
    ];
    return map[score];
  }
}
