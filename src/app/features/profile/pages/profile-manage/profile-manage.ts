import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { StudentService } from '../../../../core/services/student.service';
import { LandlordService } from '../../../../core/services/landlord.service';
import { UpdateStudentRequest } from '../../../../core/models/student.model';
import { UpdateLandlordRequest } from '../../../../core/models/landlord.model';

@Component({
  selector: 'app-profile-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-manage.html'
})
export class ProfileManage implements OnInit {
  private authService = inject(AuthService);
  private studentService = inject(StudentService);
  private landlordService = inject(LandlordService);
  private fb = inject(FormBuilder);

  user = this.authService.currentUser$;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = signal(false);
  isPasswordLoading = signal(false);
  isValidatingId = signal(false);
  isLandlord = signal(false);

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
      preferredArea: [''],
      // Landlord specific fields
      companyName: [''],
      propertyOwnerShipProof: [''],
      nationalIdImageUrl: [''],
      housingUnitDocumentationUrl: ['']
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

        this.isLandlord.set(u.role === 'landlord');

        if (this.isLandlord()) {
          const lId = u.landlordId || u.id;
          if (lId && lId !== '1') {
            this.landlordService.getById(lId).subscribe({
              next: (data: any) => {
                this.profileForm.patchValue({
                  name: data.fullName || u.name,
                  nationalID: data.nationalId || '',
                  companyName: data.companyName || '',
                  propertyOwnerShipProof: data.propertyOwnerShipProof || '',
                  nationalIdImageUrl: data.nationalIdImageUrl || '',
                  housingUnitDocumentationUrl: data.housingUnitDocumentationUrl || ''
                });
              },
              error: (err: any) => console.error('Failed to fetch landlord profile:', err)
            });
          }
        } else {
          // Fetch detailed profile data from backend
          const sId = u.studentId || u.id;
          if (sId && sId !== '1') {
            this.studentService.getStudentById(sId).subscribe({
              next: (data: any) => {
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
              error: (err: any) => console.error('Failed to fetch full student profile:', err)
            });
          }
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

      if (this.isLandlord()) {
        const lId = currentUser.landlordId || currentUser.id;
        const payload: UpdateLandlordRequest = {
          landLordId: lId,
          companyName: formVal.companyName || '',
          propertyOwnerShipProof: formVal.propertyOwnerShipProof || '',
          nationalIdImageUrl: formVal.nationalIdImageUrl || '',
          housingUnitDocumentationUrl: formVal.housingUnitDocumentationUrl || ''
        };

        this.landlordService.update(payload).subscribe({
          next: () => {
            this.isLoading.set(false);
            alert('Landlord Profile updated successfully!');
          },
          error: (err) => {
            this.isLoading.set(false);
            console.error('Update Error:', err);
            alert('Failed to update landlord profile.');
          }
        });
      } else {
        let sId = currentUser.studentId || currentUser.id;
        if (sId === '1' || sId.length < 36) {
          sId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
        }

        let dob = formVal.dateOfBirth;
        if (!dob) {
          dob = new Date().toISOString();
        } else if (dob.indexOf('T') === -1) {
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

        this.studentService.updateStudent(payload).subscribe({
          next: () => {
            this.isLoading.set(false);
            alert('Profile updated successfully!');
          },
          error: (err) => {
            this.isLoading.set(false);
            console.error('Update Error:', err);
            alert('Failed to update profile.');
          }
        });
      }
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) return;

      this.isPasswordLoading.set(true);
      const formVal = this.passwordForm.value;

      if (this.isLandlord()) {
        const payload = {
          studentId: currentUser.landlordId || currentUser.id, // Keeping 'studentId' as property name per requirements
          currentPassword: formVal.current,
          newPassword: formVal.new,
          confirmPassword: formVal.confirm
        };

        this.landlordService.changePassword(payload).subscribe({
          next: () => {
            this.isPasswordLoading.set(false);
            this.passwordForm.reset();
            alert('Landlord Password changed successfully!');
          },
          error: (err: any) => {
            this.isPasswordLoading.set(false);
            console.error('Password Error:', err);
            alert('Failed to change password.');
          }
        });
      } else {
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
          error: (err: any) => {
            this.isPasswordLoading.set(false);
            console.error('Password Error:', err);
            alert('Failed to change password.');
          }
        });
      }
    }
  }

  validateNationalId() {
    const id = this.profileForm.get('nationalID')?.value;
    if (!id || id.length !== 14) {
      alert('Please enter a valid 14-digit National ID before validating.');
      return;
    }

    this.isValidatingId.set(true);
    this.studentService.validateNationalId(id).subscribe({
      next: () => {
        this.isValidatingId.set(false);
        alert('National ID is valid!');
      },
      error: (err: any) => {
        this.isValidatingId.set(false);
        alert('National ID validation failed. It might be invalid or already registered.');
        console.error('Validation Error:', err);
      }
    });
  }

  onProfileImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.authService.updateAvatar(base64Image);
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfileImage() {
    this.authService.updateAvatar(null);
  }

  deleteAccount() {
    const confirmDelete = confirm('Are you sure you want to permanently delete your student account? This action cannot be undone and will cancel all active bookings.');
    if (confirmDelete) {
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) return;

      let sId = currentUser.studentId || currentUser.id;
      if (sId === '1' || sId.length < 36) {
        sId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      }

      this.isLoading.set(true);
      this.studentService.deleteStudent(sId).subscribe({
        next: () => {
          this.isLoading.set(false);
          alert('Your account has been successfully deleted.');
          this.authService.logout();
        },
        error: (err: any) => {
          this.isLoading.set(false);
          console.error('Delete student error:', err);
          alert('Failed to delete account. Please try again.');
        }
      });
    }
  }
}
