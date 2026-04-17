import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      role: ['student'],
      agreeTerms: [false, Validators.requiredTrue]
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
      // TODO: connect to auth service
      setTimeout(() => this.isLoading.set(false), 2000);
    } else {
      this.registerForm.markAllAsTouched();
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
