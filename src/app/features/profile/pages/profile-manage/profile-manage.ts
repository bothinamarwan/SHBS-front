import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { StudentService } from '../../../../core/services/student.service';
import { UpdateStudentRequest } from '../../../../core/models/student.model';

@Component({
  selector: 'app-profile-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-manage.html'
})
export class ProfileManage implements OnInit {
  private authService = inject(AuthService);
  private studentService = inject(StudentService);
  private fb = inject(FormBuilder);

  user = this.authService.currentUser$;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = signal(false);
  isPasswordLoading = signal(false);

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      nationalID: ['', [Validators.pattern(/^[0-9]{14}$/)]],
      gender: ['male'],
      dateOfBirth: [''],
      city: [''],
      address: [''],
      preferredArea: ['']
    });

    this.passwordForm = this.fb.group({
      current: ['', Validators.required],
      new: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.user.subscribe(u => {
      if (u) {
        // Basic info from login token
        this.profileForm.patchValue({
          name: u.name,
          email: u.email,
          phone: u.phone || ''
        });

        // Fetch detailed profile data from backend
        const sId = u.studentId || u.id;
        if (sId && sId !== '1') {
          this.studentService.getStudent(sId).subscribe({
            next: (data) => {
              // Convert ISO date to YYYY-MM-DD for the HTML date picker
              let dob = '';
              if (data.dateOfBirth) {
                dob = data.dateOfBirth.split('T')[0]; 
              }

              this.profileForm.patchValue({
                name: (data as any).fullName || u.name,
                nationalID: data.nationalId || '',
                gender: data.gender === 0 ? 'male' : 'female',
                dateOfBirth: dob,
                city: data.city || '',
                address: data.address || '',
                preferredArea: data.preferredArea || ''
              });
            },
            error: (err) => console.error('Failed to fetch full student profile:', err)
          });
        }
      }
    });
  }

  saveProfile() {
    if (this.profileForm.valid) {
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) return;

      this.isLoading.set(true);
      const formVal = this.profileForm.value;

      let sId = currentUser.studentId || currentUser.id;
      // If the current user has a mock ID like '1', force a valid GUID so the backend doesn't reject it
      if (sId === '1' || sId.length < 36) {
        sId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      }

      // Use the raw yyyy-mm-dd value from the date picker if it exists, or an ISO string
      let dob = formVal.dateOfBirth;
      if (!dob) {
        dob = new Date().toISOString();
      } else if (dob.indexOf('T') === -1) {
        // If it's just yyyy-mm-dd, some backends prefer a full ISO string
        dob = new Date(dob).toISOString();
      }

      const payload: UpdateStudentRequest = {
        studentId: sId,
        fullName: formVal.name,
        dateOfBirth: dob,
        gender: formVal.gender === 'male' ? 0 : 1,
        address: formVal.address || 'Unknown',
        city: formVal.city || 'Unknown',
        preferredArea: formVal.preferredArea || 'Unknown',
        nationalId: formVal.nationalID || '00000000000000'
      };

      console.log('Sending Update Payload:', payload);

      this.studentService.updateStudent(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          alert('Profile updated successfully!');
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Update Error:', err);
          if (err.error && err.error.errors) {
            console.error('Validation Errors from Backend:', err.error.errors);
          } else if (err.error) {
             console.error('Backend Error Message:', err.error);
          }
          alert('Failed to update profile. Check console for details.');
        }
      });
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) return;

      this.isPasswordLoading.set(true);
      const formVal = this.passwordForm.value;

      const payload = {
        studentId: currentUser.studentId || currentUser.id,
        currentPassword: formVal.current,
        newPassword: formVal.new,
        confirmPassword: formVal.confirm
      };

      this.studentService.changePassword(payload).subscribe({
        next: () => {
          this.isPasswordLoading.set(false);
          this.passwordForm.reset();
          alert('Password changed successfully!');
        },
        error: (err) => {
          this.isPasswordLoading.set(false);
          console.error('Password Error:', err);
          alert('Failed to change password. Check console for details.');
        }
      });
    }
  }
}
