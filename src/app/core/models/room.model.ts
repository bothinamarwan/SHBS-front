export enum RoomType {
  Single = 0,
  Shared = 1
}

export interface Room {
  id: string; // The endpoint returns the room ID
  roomId?: string; // Some requests expect roomId
  housingUnitId: string;
  roomType: RoomType;
  roomImageUrl: string;
  numberOfBeds: number;
  price: number;
  capacity: number;
  isAvailable: boolean;
}

export interface CreateRoomRequest {
  housingUnitId: string;
  roomType: RoomType;
  roomImageUrl: string;
  numberOfBeds: number;
  price: number;
  capacity: number;
  isAvailable: boolean;
}

export interface UpdateRoomRequest {
  roomId: string;
  roomType: RoomType;
  roomImageUrl: string;
  numberOfBeds: number;
  price: number;
  capacity: number;
  isAvailable: boolean;
}
