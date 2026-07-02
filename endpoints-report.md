# Complete Endpoints Integration Report

This report documents all HTTP API endpoints integrated in the frontend application, categorized by their corresponding Angular services in [src/app/core/services/](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services).

---

## 1. Authentication & Account Management (`AuthService`)
**Service File:** [auth.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/auth.service.ts)  
**Base URL:** `/api/v1/Account`

| HTTP Method | Endpoint | Frontend Method | Payload / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/Account/login` | `login(credentials)` | `{ email, password }` | Authenticates a user. Returns tokens & profile. If 2FA is enabled, triggers the 2FA verify flow. |
| **POST** | `/api/v1/Account/register/student` | `registerStudent(userData)` | Student registration object | Registers a new student account. |
| **POST** | `/api/v1/Account/register/landlord` | `registerLandlord(userData)` | Landlord registration object | Registers a new landlord account. |
| **POST** | `/api/v1/Account/refresh-token` | `refreshToken(token)` | `{ token, refreshToken }` | Refreshes the session's JWT access token using the stored refresh token. |
| **GET** | `http://unistay.tryasp.net/api/v1/Account/google-challenge` | `initiateGoogleLogin()` | None (Redirect) | Redirects the browser directly to the server OAuth challenge page (bypasses dev proxy). |
| **POST** | `/api/v1/Account/google-login` | `googleLogin(idToken)` | `{ idToken }` | Standard client-side SDK Google OAuth login endpoint. |
| **POST** | `/api/v1/Account/send-email-confirmation` | `sendEmailConfirmation(email)` | `email` (Raw JSON string) | Triggers sending an email verification token to the specified address. |
| **POST** | `/api/v1/Account/confirm-email` | `confirmEmail(userId, token)` | `{ userId, token }` | Validates the email confirmation token. |
| **POST** | `/api/v1/Account/2fa/setup` | `setup2FA(email)` | `email` (Raw JSON string) | Initiates 2FA setup and returns the authenticator secret & QR Code URI. |
| **POST** | `/api/v1/Account/2fa/enable` | `enable2FA(data)` | `{ email, code }` | Enables 2FA for the account after validating the setup code. |
| **POST** | `/api/v1/Account/2fa/verify` | `verifyTwoFactor(data)` | `{ email, code }` | Validates the 2FA code during the login flow. |
| **POST** | `/api/v1/Account/logout` | `logout()` | `token` (Raw JSON string) | Invalidates the current user session on the server. |
| **POST** | `/api/v1/Account/forgot-password` | `forgotPassword(data)` | `{ email }` | Triggers a password reset link to be sent to the user's email. |
| **POST** | `/api/v1/Account/reset-password` | `resetPassword(data)` | `{ email, token, newPassword }` | Completes the password reset using the token sent via email. |

---

## 2. Housing Units (`HousingService`)
**Service File:** [housing.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/housing.service.ts)  
**Base URL:** `/api/HousingUnit`

| HTTP Method | Endpoint | Frontend Method | Payload / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/HousingUnit/GetAll` | `getAll()` | None | Fetches all active housing units. |
| **GET** | `/api/HousingUnit/GetById/{id}` | `getById(id)` | None (URL parameter) | Fetches basic summary/fields for a specific housing unit. |
| **GET** | `/api/HousingUnit/GetDetailsById/{id}` | `getDetailsById(id)` | None (URL parameter) | Fetches deeply detailed data of a housing unit, including rooms/beds (used in bookings). |
| **GET** | `/api/HousingUnit/map-pins` | `getMapPins()` | None | Fetches list of lightweight pin details (IDs, coordinates, rates) for map rendering. |
| **POST** | `/api/HousingUnit/Create` | `create(request)` | `CreateHousingUnitRequest` | Creates a new housing unit listing (landlord dashboard). |
| **PUT** | `/api/HousingUnit/Update` | `update(request)` | `UpdateHousingUnitRequest` | Modifies an existing housing unit listing. |
| **DELETE** | `/api/HousingUnit/Delete/{id}` | `delete(id)` | None (URL parameter) | Deletes a housing unit from listings. |

---

## 3. Student Management (`StudentService`)
**Service File:** [student.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/student.service.ts)  
**Base URL:** `/api/v1/Student`

| HTTP Method | Endpoint | Frontend Method | Parameters / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **PUT** | `/api/v1/Student/Update` | `updateStudent(studentData)` | `UpdateStudentRequest` | Updates student profile details. |
| **POST** | `/api/v1/Student/ChangePassword` | `changePassword(passwordData)` | `ChangePasswordRequest` | Changes current password to a new password. |
| **DELETE** | `/api/v1/Student/Delete/{studentId}` | `deleteStudent(studentId)` | None (URL parameter) | Deletes the student account. |
| **GET** | `/api/v1/Student/GetById/{studentId}` | `getStudentById(studentId)` | None (URL parameter) | Fetches student details by student ID. |
| **GET** | `/api/v1/Student/GetByUserId/{userId}` | `getStudentByUserId(userId)` | None (URL parameter) | Fetches student details linked to a specific user ID. |
| **GET** | `/api/v1/Student/GetStudents` | `getStudents(filterParams)` | Query params: `city`, `preferredArea`, `gender`, `dateOfBirthFrom`, `dateOfBirthTo`, `pageNumber`, `pageSize` | Fetches a paginated, filtered list of student profiles. |
| **POST** | `/api/v1/Student/Deactivate/{studentId}` | `deactivateStudent(studentId)` | None (URL parameter) | Deactivates a student account. |
| **POST** | `/api/v1/Student/Reactivate/{studentId}` | `reactivateStudent(studentId)` | None (URL parameter) | Reactivates a deactivated student account. |
| **GET** | `/api/v1/Student/ValidateNationalId/{nationalId}` | `validateNationalId(nationalId)` | None (URL parameter) | Validates format/existence of a student National ID. |
| **POST** | `/api/v1/Student/SubmitUniversityVerification` | `submitUniversityVerification(data)` | Verification payload / file data | Submits student ID documents for admin approval. |
| **GET** | `/api/v1/Student/MyBookings` | `getMyBookings()` | None | Fetches all bookings associated with the current logged-in student. |
| **POST** | `/api/v1/Student/MultiRoomBooking` | `multiRoomBooking(bookingData)` | `MultiRoomBookingRequest` | Books multiple rooms/beds simultaneously. |

---

## 4. Landlord Management (`LandlordService`)
**Service File:** [landlord.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/landlord.service.ts)  
**Base URL:** `/api/LandLord` (Core) & `/api/v1/Landlord` (Legacy)

| HTTP Method | Endpoint | Frontend Method | Payload / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/LandLord/GetById/{id}` | `getById(id)` | None (URL parameter) | Fetches a landlord's profile by landlord ID. |
| **GET** | `/api/LandLord/GetByUserId/{userId}` | `getByUserId(userId)` | None (URL parameter) | Fetches a landlord's profile by user ID. |
| **GET** | `/api/LandLord/GetAll` | `getAll()` | None | Lists all landlords. |
| **POST** | `/api/LandLord/Create` | `create(data)` | `CreateLandlordRequest` | Registers/Creates a landlord entity profile. |
| **PUT** | `/api/LandLord/Update` | `update(data)` | `UpdateLandlordRequest` | Updates landlord profile details. |
| **POST** | `/api/LandLord/ChangePassword` | `changePassword(data)` | `ChangePasswordRequest` | Changes landlord's account password. |
| **POST** | `/api/LandLord/UploadNationalId` | `uploadNationalId(file)` | `FormData` with parameter `'file'` | Uploads landlord's National ID file (PDF/Image) for verification. |
| **POST** | `/api/LandLord/UploadUnitDocumentation` | `uploadUnitDocumentation(file)` | `FormData` with parameter `'file'` | Uploads ownership deeds or unit proof documentation. |
| **DELETE** | `/api/LandLord/Delete/{id}` | `delete(id)` | None (URL parameter) | Deletes landlord profile/account. |
| **POST** | `/api/LandLord/Deactivate/{id}` | `deactivate(id)` | None (URL parameter) | Deactivates the landlord account. |
| **POST** | `/api/LandLord/Reactivate/{id}` | `reactivate(id)` | None (URL parameter) | Reactivates the landlord account. |
| **GET** | `/api/LandLord/account-status` | `getAccountStatus()` | None | Fetches status of the landlord account verification. |
| **GET** | `/api/LandLord/MyBookings` | `getMyBookings()` | None | Retrieves all bookings on properties owned by this landlord. |
| **POST** | `/api/v1/Landlord/housing` | `addHousing(housingData)` | Housing details payload | **[Legacy]** Registers a new housing listing. |
| **PUT** | `/api/v1/Landlord/housing/{housingId}` | `editHousing(housingId, housingData)` | Housing details payload | **[Legacy]** Updates housing listing details. |
| **DELETE** | `/api/v1/Landlord/housing/{housingId}` | `deleteHousing(housingId)` | None (URL parameter) | **[Legacy]** Deletes a housing unit listing. |
| **POST** | `/api/v1/Landlord/housing/{housingId}/availability` | `manageAvailability(housingId, availabilityData)` | Availability details payload | **[Legacy]** Sets dates or terms of availability for a housing unit. |
| **POST** | `/api/v1/Landlord/booking/{bookingId}/approve` | `approveBooking(bookingId)` | None (URL parameter) | **[Legacy]** Approves a pending student booking. |
| **POST** | `/api/v1/Landlord/booking/{bookingId}/reject` | `rejectBooking(bookingId)` | None (URL parameter) | **[Legacy]** Rejects a student booking request. |

---

## 5. Bed Management (`BedService`)
**Service File:** [bed.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/bed.service.ts)  
**Base URL:** `/api/Bed`

| HTTP Method | Endpoint | Frontend Method | Parameters / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/Bed/GetById/{bedId}` | `getBedById(bedId)` | None (URL parameter) | Fetches details of a specific bed. |
| **GET** | `/api/Bed/GetAll` | `getAllBeds(pageIndex, pageSize)` | Query params: `pageIndex`, `pageSize` | Retrieves a paginated list of all beds. |
| **GET** | `/api/Bed/GetByRoom/{roomId}` | `getBedsByRoom(roomId)` | None (URL parameter) | Retrieves all beds available in a given room. |
| **POST** | `/api/Bed/Create` | `createBed(data)` | `CreateBedRequest` | Creates/registers a new bed in a room. |
| **PUT** | `/api/Bed/Update` | `updateBed(data)` | `UpdateBedRequest` | Modifies configuration/details of an existing bed. |
| **DELETE** | `/api/Bed/Delete/{bedId}` | `deleteBed(bedId)` | None (URL parameter) | Deletes a bed entry. |

---

## 6. Booking Flow (`BookingService`)
**Service File:** [booking.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/booking.service.ts)  
**Base URL:** `/api/v1/Booking`

| HTTP Method | Endpoint | Frontend Method | Payload / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/Booking/MyBookings` | `getBookings()` | None | Fetches all bookings belonging to the active user. |
| **POST** | `/api/v1/Booking/Create` | `createBooking(bookingData)` | Booking details object | Creates a standard single room/bed booking. |
| **GET** | `/api/v1/Booking/GetById/{id}` | `getBookingById(id)` | None (URL parameter) | Fetches deep booking details by ID. |
| **POST** | `/api/v1/Booking/Cancel/{id}` | `cancelBooking(id)` | None (URL parameter) | Cancels an active/pending booking request. |

---

## 7. Chat & Messaging (`ChatService`)
**Service File:** [chat.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/chat.service.ts)  
**Base URL:** `/api/v1/Chat`

| HTTP Method | Endpoint | Frontend Method | Payload / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/Chat/initiate` | `initiateChat(data)` | `InitiateChatRequest` | Initiates a direct conversation context between a student and landlord. |
| **GET** | `/api/v1/Chat/conversations/{bookingId}` | `getConversationsByBooking(bookingId)` | None (URL parameter) | Fetches chat conversations linked to a specific booking ID. |
| **GET** | `/api/v1/Chat/by-id/{conversationId}` | `getConversationById(conversationId)` | None (URL parameter) | Fetches details about a specific conversation context. |
| **GET** | `/api/v1/Chat/conversations/{conversationId}/messages` | `getMessages(conversationId)` | None (URL parameter) | Retrieves message history for a specific conversation ID. |
| **POST** | `/api/v1/Chat/conversations/{conversationId}/messages` | `sendMessage(conversationId, data)` | `SendMessageRequest` | Sends a message within a conversation. |

---

## 8. Admin Controls (`AdminService`)
**Service File:** [admin.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/admin.service.ts)  
**Base URLs:** `/api/Admin` & `/api/AdminApproval`

### Core Admin Operations (`/api/Admin`)
| HTTP Method | Endpoint | Frontend Method | Parameters / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/Admin/users` | `getUsers(params)` | Query params: `SearchTerm`, `Role`, `IsActive`, `PageNumber`, `PageSize` | Fetches a paginated, filtered list of all accounts. |
| **POST** | `/api/Admin/users/{userId}/toggle-active` | `toggleUserActive(userId)` | None (URL parameter) | Activates/deactivates a user account. |
| **GET** | `/api/Admin/verifications/pending` | `getPendingStudentVerifications(pageNumber, pageSize)` | Query params: `pageNumber`, `pageSize` | Lists students pending university ID verification. |
| **POST** | `/api/Admin/verifications/{studentId}/review` | `reviewStudentVerification(studentId, request)` | `ReviewVerificationRequest` | Approves or rejects a student verification request. |
| **GET** | `/api/Admin/verifications/{studentId}/id-card` | `getStudentIdCardUrl(studentId)` | None (URL parameter) | Helper to fetch direct URL link for a student's ID card document. |
| **GET** | `/api/Admin/landlords/pending` | `getPendingLandlordVerifications(pageNumber, pageSize)` | Query params: `pageNumber`, `pageSize` | Lists landlords pending status verification. |
| **PUT** | `/api/Admin/landlords/{landlordId}/verification-status` | `updateLandlordVerificationStatus(landlordId, request)` | `UpdateLandlordVerificationStatusRequest` | Updates verification status for a landlord. |
| **GET** | `/api/Admin/verification/{landlordId}/National-ID` | `getLandlordNationalIdUrl(landlordId)` | None (URL parameter) | Helper to fetch direct URL link for landlord National ID document. |
| **GET** | `/api/Admin/verification/{landlordId}/Unit-Documentation` | `getLandlordUnitDocUrl(landlordId)` | None (URL parameter) | Helper to fetch direct URL link for landlord Unit Documentation. |
| **GET** | `/api/Admin/complaints` | `getComplaints(params)` | Query params: `StudentId`, `HousingUnitId`, `Status`, `CreatedDateFrom`, `CreatedDateTo`, `PageNumber`, `PageSize` | Retrieves complaints filed by users. |
| **PUT** | `/api/Admin/complaints/{complaintId}/status` | `updateComplaintStatus(complaintId, request)` | `ComplaintUpdateRequest` | Resolves or updates status of a user complaint. |
| **GET** | `/api/Admin/commissions/report` | `getCommissionReport(from, to)` | Query params: `from`, `to` | Retrieves commission revenue reports. |

### Contract & Escrow Approvals (`/api/AdminApproval`)
| HTTP Method | Endpoint | Frontend Method | Payload / Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/AdminApproval/pending-contracts` | `getPendingContracts()` | None | Lists housing lease contracts awaiting admin review. |
| **GET** | `/api/AdminApproval/pending-escrow-releases` | `getPendingEscrowReleases()` | None | Lists escrow payments pending release to landlords. |
| **POST** | `/api/AdminApproval/approve-contract` | `approveContract(request)` | `AdminContractRequest` | Approves a student-landlord contract. |
| **POST** | `/api/AdminApproval/reject-contract` | `rejectContract(request)` | `AdminContractRequest` | Rejects/returns a contract. |
| **POST** | `/api/AdminApproval/release-escrow` | `releaseEscrow(request)` | `AdminEscrowReleaseRequest` | Releases held escrow funds directly to the landlord. |
| **POST** | `/api/AdminApproval/refund-escrow` | `refundEscrow(request)` | `AdminEscrowRefundRequest` | Returns escrow payment funds to the student. |

---

## 9. Local-Only / Mock Services
The following service modules are fully integrated into frontend workflows but handle state locally (in-memory or browser storage) rather than communicating with backend endpoints.

### Feedback & Reviews (`FeedbackService`)
* **Service File:** [feedback.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/feedback.service.ts)
* **Local state:** Managed via Angular Signals (`reviews`, `complaints`).
* **Integrated Actions:**
  * `getReviewsByHousing(housingId)`: Local mock fetch (returns filtered `Review[]`).
  * `addReview(review)`: Appends a review object to local state signal.
  * `submitComplaint(complaint)`: Appends a complaint object to local state signal.
  * `getComplaints()`: Lists active user complaints from signal storage.

### Wishlist / Favorites (`WishlistService`)
* **Service File:** [wishlist.service.ts](file:///D:/downloads/depi/SHBS-1/SHBS-1/src/app/core/services/wishlist.service.ts)
* **Local state:** Synchronized state with browser `localStorage` under keys `wishlist`.
* **Integrated Actions:**
  * `getWishlist()`: Retrieves housing listings stored on the user's browser wishlist.
  * `toggleWishlist(housing)`: Adds or removes listings dynamically, syncing changes to client storage.
  * `isInWishlist(id)`: Evaluates if a given housing listing is marked as favorited.
