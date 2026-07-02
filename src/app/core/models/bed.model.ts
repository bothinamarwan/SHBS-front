export interface Bed {
  bedId: string;
  roomId: string;
  bedNumber: string;
  isAvailable: boolean;
  isOccupied: boolean;
  calculatedPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedBedResponse {
  pageSize: number;
  pageIndex: number;
  totalRecords: number;
  records: Bed[];
}

export interface CreateBedRequest {
  roomId: string;
  bedNumber: string;
}

export interface UpdateBedRequest {
  bedId: string;
  bedNumber: string;
  isAvailable: boolean;
  isOccupied: boolean;
}
