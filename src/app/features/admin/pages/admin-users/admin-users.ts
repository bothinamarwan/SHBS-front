import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { StudentService } from '../../../../core/services/student.service';
import { LandlordService } from '../../../../core/services/landlord.service';
import { StudentResponse } from '../../../../core/models/student.model';
import { Landlord } from '../../../../core/models/landlord.model';
import { AdminUserResponse, PaginatedResponse } from '../../../../core/models/admin.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html'
})
export class AdminUsers implements OnInit {
  private adminService = inject(AdminService);
  private studentService = inject(StudentService);
  private landlordService = inject(LandlordService);

  activeTab = signal<'all' | 'students' | 'landlords'>('all');

  // General Users Data
  users = signal<AdminUserResponse[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(true);

  // General Filters
  searchTerm = signal<string>('');
  roleFilter = signal<string>('');
  isActiveFilter = signal<boolean | undefined>(undefined);

  // Student specific data & filters
  students = signal<StudentResponse[]>([]);
  studentCityFilter = signal<string>('');
  studentAreaFilter = signal<string>('');
  studentGenderFilter = signal<number | undefined>(undefined);

  // Landlord specific data
  landlords = signal<Landlord[]>([]);

  // Debouncer for search
  private searchSubject = new Subject<string>();

  // Create Student Modal State
  showCreateModal = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  newStudent: any = {
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    userName: '',
    dateOfBirth: '',
    gender: 0,
    address: '',
    city: '',
    preferredArea: '',
    nationalId: '',
    profileImage: ''
  };

  ngOnInit() {
    this.fetchData();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.pageNumber.set(1);
      this.fetchData();
    });
  }

  setTab(tab: 'all' | 'students' | 'landlords') {
    this.activeTab.set(tab);
    this.pageNumber.set(1);
    this.totalCount.set(0);
    this.totalPages.set(1);
    this.fetchData();
  }

  onSearchChange(event: any) {
    this.searchSubject.next(event.target.value);
  }

  onRoleChange(event: any) {
    this.roleFilter.set(event.target.value);
    this.pageNumber.set(1);
    this.fetchData();
  }

  onStatusChange(event: any) {
    const val = event.target.value;
    const isActive = val === 'active' ? true : val === 'inactive' ? false : undefined;
    this.isActiveFilter.set(isActive);
    this.pageNumber.set(1);
    this.fetchData();
  }

  onStudentCityChange(event: any) {
    this.studentCityFilter.set(event.target.value);
    this.pageNumber.set(1);
    this.fetchData();
  }

  onStudentAreaChange(event: any) {
    this.studentAreaFilter.set(event.target.value);
    this.pageNumber.set(1);
    this.fetchData();
  }

  onStudentGenderChange(event: any) {
    const val = event.target.value;
    this.studentGenderFilter.set(val === 'male' ? 0 : val === 'female' ? 1 : undefined);
    this.pageNumber.set(1);
    this.fetchData();
  }

  fetchData() {
    if (this.activeTab() === 'all') {
      this.fetchUsers();
    } else if (this.activeTab() === 'students') {
      this.fetchStudents();
    } else if (this.activeTab() === 'landlords') {
      this.fetchLandlords();
    }
  }

  fetchUsers() {
    this.isLoading.set(true);
    this.adminService.getUsers({
      searchTerm: this.searchTerm() || undefined,
      role: this.roleFilter() || undefined,
      isActive: this.isActiveFilter(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize()
    }).subscribe({
      next: (res: any) => {
        console.log('API Response from /api/Admin/users:', res);
        let items = [];
        let total = 0;
        
        if (Array.isArray(res)) {
          items = res;
          total = res.length;
        } else if (res) {
          items = res.items || res.records || res.data || res.Items || res.Records || res.Data || [];
          total = res.totalCount || res.totalRecords || res.TotalCount || res.TotalRecords || items.length;
        }

        console.log('Parsed users items:', items);
        if (items.length > 0) {
          console.log('First user object:', items[0]);
        }
        this.users.set(items);
        this.totalCount.set(total);
        this.totalPages.set(res?.totalPages || res?.TotalPages || Math.ceil(total / this.pageSize()) || 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  fetchStudents() {
    this.isLoading.set(true);
    this.studentService.getStudents({
      city: this.studentCityFilter() || undefined,
      preferredArea: this.studentAreaFilter() || undefined,
      gender: this.studentGenderFilter(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize()
    }).subscribe({
      next: (res: any) => {
        let items = [];
        let total = 0;
        
        if (res) {
          items = res.records || res.items || res.data || [];
          total = res.totalRecords || res.totalCount || items.length;
        }

        this.students.set(items);
        this.totalCount.set(total);
        this.totalPages.set(res?.totalPages || Math.ceil(total / this.pageSize()) || 1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch students:', err);
        this.isLoading.set(false);
      }
    });
  }

  fetchLandlords() {
    this.isLoading.set(true);
    // Since /api/LandLord/GetAll returns an array directly, we use client-side pagination
    this.landlordService.getAll().subscribe({
      next: (res: any) => {
        let items = Array.isArray(res) ? res : [];
        const total = items.length;

        // Simple client-side pagination for landlords
        const start = (this.pageNumber() - 1) * this.pageSize();
        const paginatedItems = items.slice(start, start + this.pageSize());

        this.landlords.set(paginatedItems);
        this.totalCount.set(total);
        this.totalPages.set(Math.ceil(total / this.pageSize()) || 1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch landlords:', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleActive(userId: string) {
    console.log('toggleActive called with userId:', userId);
    console.log('User object being toggled:', this.users().find(u => u.id === userId));
    this.adminService.toggleUserActive(userId).subscribe({
      next: () => {
        this.fetchUsers();
      },
      error: (err) => {
        console.error('Error toggling user active status:', err);
      }
    });
  }

  deactivateStudent(studentId: string) {
    if (confirm('Are you sure you want to deactivate this student account?')) {
      this.isLoading.set(true);
      this.studentService.deactivateStudent(studentId).subscribe({
        next: () => {
          alert('Student deactivated successfully.');
          this.fetchStudents();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to deactivate student.');
          this.isLoading.set(false);
        }
      });
    }
  }

  reactivateStudent(studentId: string) {
    if (confirm('Are you sure you want to reactivate this student account?')) {
      this.isLoading.set(true);
      this.studentService.reactivateStudent(studentId).subscribe({
        next: () => {
          alert('Student reactivated successfully.');
          this.fetchStudents();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to reactivate student.');
          this.isLoading.set(false);
        }
      });
    }
  }

  deleteStudent(studentId: string) {
    if (confirm('Are you sure you want to PERMANENTLY delete this student account? This action is irreversible.')) {
      this.isLoading.set(true);
      this.studentService.deleteStudent(studentId).subscribe({
        next: () => {
          alert('Student account deleted successfully.');
          this.fetchStudents();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete student account.');
          this.isLoading.set(false);
        }
      });
    }
  }

  deactivateLandlord(landlordId: string) {
    if (confirm('Are you sure you want to deactivate this landlord account?')) {
      this.isLoading.set(true);
      this.landlordService.deactivate(landlordId).subscribe({
        next: () => {
          alert('Landlord deactivated successfully.');
          this.fetchLandlords();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to deactivate landlord.');
          this.isLoading.set(false);
        }
      });
    }
  }

  reactivateLandlord(landlordId: string) {
    if (confirm('Are you sure you want to reactivate this landlord account?')) {
      this.isLoading.set(true);
      this.landlordService.reactivate(landlordId).subscribe({
        next: () => {
          alert('Landlord reactivated successfully.');
          this.fetchLandlords();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to reactivate landlord.');
          this.isLoading.set(false);
        }
      });
    }
  }

  deleteLandlord(landlordId: string) {
    if (confirm('Are you sure you want to PERMANENTLY delete this landlord account?')) {
      this.isLoading.set(true);
      this.landlordService.delete(landlordId).subscribe({
        next: () => {
          alert('Landlord deleted successfully.');
          this.fetchLandlords();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete landlord.');
          this.isLoading.set(false);
        }
      });
    }
  }

  prevPage() {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(p => p - 1);
      this.fetchData();
    }
  }

  nextPage() {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(p => p + 1);
      this.fetchData();
    }
  }

  openCreateModal() {
    this.newStudent = {
      email: '', phoneNumber: '', password: '', confirmPassword: '',
      userName: '', dateOfBirth: '', gender: 0, address: '',
      city: '', preferredArea: '', nationalId: '', profileImage: '',
      // Add landlord specific fields to the same modal object for convenience
      fullName: '', companyName: '', propertyOwnerShipProof: ''
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  saveNewUser() {
    // Shared validations
    if (!this.newStudent.email || !this.newStudent.password) {
      alert('Please fill in at least Email and Password.');
      return;
    }

    if (this.newStudent.password !== this.newStudent.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    this.isCreating.set(true);

    if (this.activeTab() === 'landlords') {
      const landlordPayload = {
        email: this.newStudent.email,
        phoneNumber: this.newStudent.phoneNumber || '',
        password: this.newStudent.password,
        confirmPassword: this.newStudent.confirmPassword,
        fullName: this.newStudent.fullName || this.newStudent.userName,
        companyName: this.newStudent.companyName || '',
        nationalId: this.newStudent.nationalId || '',
        propertyOwnerShipProof: this.newStudent.propertyOwnerShipProof || '',
        profileImage: this.newStudent.profileImage || ''
      };

      this.landlordService.create(landlordPayload).subscribe({
        next: () => {
          alert('Landlord created successfully!');
          this.isCreating.set(false);
          this.showCreateModal.set(false);
          this.fetchLandlords();
        },
        error: (err) => {
          console.error('Error creating landlord:', err);
          alert(err.error?.message || 'Failed to create landlord.');
          this.isCreating.set(false);
        }
      });
    } else {
      // Student creation
      const payload = { ...this.newStudent };
      if (payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
      }

      this.studentService.createStudent(payload).subscribe({
        next: () => {
          alert('Student created successfully!');
          this.isCreating.set(false);
          this.showCreateModal.set(false);
          this.fetchStudents(); // refresh list
        },
        error: (err) => {
          console.error('Error creating student:', err);
          alert(err.error?.message || 'Failed to create student. Please check the inputs.');
          this.isCreating.set(false);
        }
      });
    }
  }
}
