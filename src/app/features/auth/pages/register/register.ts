import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ mismatch: true });
    return { mismatch: true };
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
  showConfirm = signal(false);
  isLoading = signal(false);
  selectedRole = signal<'student' | 'landlord'>('student');

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      role: ['student'],
      agreeTerms: [false, Validators.requiredTrue],
      
      // Additional Student fields
      nationalID: ['', [Validators.pattern(/^[0-9]{14}$/)]],
      gender: ['male'],
      dateOfBirth: [''],
      city: [''],
      address: [''],
      preferredArea: [''],
      
      // Landlord specific fields
      companyName: [''],
      propertyOwnershipProof: ['']
    }, { validators: passwordMatchValidator });
  }

  selectRole(role: 'student' | 'landlord') {
    this.selectedRole.set(role);
    this.registerForm.get('role')?.setValue(role);
  }

  togglePassword() { this.showPassword.update(v => !v); }
  toggleConfirm() { this.showConfirm.update(v => !v); }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      
      const formValue = this.registerForm.value;
      const isStudent = this.selectedRole() === 'student';
      
      let payload: any = {
        email: formValue.email,
        phoneNumber: formValue.phone,
        password: formValue.password,
        confirmPassword: formValue.confirmPassword,
        nationalId: formValue.nationalID,
        fullName: formValue.fullName, // Added fullName here!
        role: formValue.role // Used by AuthService to determine the endpoint
      };

      if (isStudent) {
        payload = {
          ...payload,
          dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth).toISOString() : new Date().toISOString(),
          gender: formValue.gender === 'male' ? 0 : 1,
          address: formValue.address,
          city: formValue.city,
          preferredArea: formValue.preferredArea,
          profileImage: ""
        };
      } else {
        payload = {
          ...payload,
          companyName: formValue.companyName,
          propertyOwnershipProof: formValue.propertyOwnershipProof
        };
      }

      this.authService.register(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          if (this.selectedRole() === 'landlord') {
            this.router.navigate(['/landlord']);
          } else {
            this.router.navigate(['/student']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('API Error:', err);
          alert(`API Error: ${err.message || 'Something went wrong. Check browser console.'}`);
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
      
      const invalidControls = Object.keys(this.registerForm.controls).filter(key => 
        this.registerForm.controls[key].invalid
      );
      console.log('Invalid form keys:', invalidControls);
      alert(`Form is invalid! Check: ${invalidControls.join(', ')}`);
    }
  }

  get fullName() { return this.registerForm.get('fullName'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get agreeTerms() { return this.registerForm.get('agreeTerms'); }

  getPasswordStrength(): { level: number; label: string; color: string } {
    const val = this.password?.value || '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const map = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'Weak', color: '#b31b25' },
      { level: 2, label: 'Fair', color: '#705900' },
      { level: 3, label: 'Good', color: '#00675f' },
      { level: 4, label: 'Strong', color: '#105aaf' }
    ];
    return map[score];
  }
}
