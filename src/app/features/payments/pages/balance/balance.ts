import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalanceService } from '../../../../core/services/balance.service';
import { UserBalanceResponse } from '../../../../core/models/balance.model';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance.html'
})
export class Balance implements OnInit {
  private balanceService = inject(BalanceService);

  myBalance = signal<UserBalanceResponse | null>(null);
  userBalance = signal<UserBalanceResponse | null>(null);
  
  isLoading = signal<boolean>(false);
  isLoadingUser = signal<boolean>(false);
  
  searchUserId = signal<string>('');

  ngOnInit() {
    this.loadMyBalance();
  }

  loadMyBalance() {
    this.isLoading.set(true);
    this.balanceService.getMyBalance().subscribe({
      next: (res) => {
        this.myBalance.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadUserBalance() {
    if (!this.searchUserId().trim()) return;
    
    this.isLoadingUser.set(true);
    this.balanceService.getUserBalance(this.searchUserId()).subscribe({
      next: (res) => {
        this.userBalance.set(res);
        this.isLoadingUser.set(false);
      },
      error: () => {
        this.isLoadingUser.set(false);
      }
    });
  }
}
