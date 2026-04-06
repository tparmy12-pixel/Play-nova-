
## Plan: Multiple Feature Updates

### 1. Remove Promotion Floating Button
- Home page se bottom-right corner ka "Promote Your App" floating button hatao

### 2. Ad System Update
- Video ad lagane ke liye ₹10 charge karo (admin API se payment)
- Agar koi ad available nahi hai to message dikhao: "No ads found, please try again"

### 3. Premium Subscription System (₹800 / 30 days)
- Database mein `user_subscriptions` table banao
- Premium users ko:
  - Ads free mein lagane ka option
  - Download karte waqt ad na dikhe
  - Naye app launch hone par notification mile
  - Username golden color mein dikhe
  - Premium badge dikhe

### 4. Developer Account Tiers (3 types)
- **Beginner**: Sirf PAN card + Aadhar card + UPI ID
- **Student**: School/College name + Identity card + Aadhar card
- **Company**: Company details + GST/Registration + PAN + Aadhar + UPI ID
- Developer registration form update karo with tier selection
- Database mein `developer_accounts` table update karo (tier column add)

### 5. Admin Developer Approval Section
- Admin dashboard mein naya section: "Developer Approvals"
- Submitted developer accounts dikhaao with documents
- Approve / Reject buttons with reason
- Filter by tier type (Beginner/Student/Company)

### Database Changes
- `developer_accounts` table mein `tier` column add karo
- `user_subscriptions` naya table banao
- Developer account fields update karo (school_name, company_name, gst_number etc.)

### Files to modify
- `src/pages/Index.tsx` - Remove floating promo button
- `src/pages/DeveloperRegister.tsx` - Add tier system
- `src/pages/admin/AdminDashboard.tsx` - Add developer approval link
- New: `src/pages/admin/DeveloperApprovals.tsx`
- New: Premium subscription page
