## Plan: Major App Store Overhaul

### Phase 1: Clean Up & Bottom Navigation
1. **Remove all sample app data** (fake images/icons wale apps delete karo database se)
2. **Bottom Navigation Bar** - Play Store jaisa:
   - Home (main feed)
   - Apps (only apps category)
   - Games (only games category)
   - Category (all categories browse)
   - Profile (user's own area - upload, ads, settings sab yahan)

### Phase 2: Developer Account System
3. **Developer Registration** for game uploads:
   - Phone number verification
   - Aadhar card number
   - PAN card number
   - Photo upload
   - Developer account status tracking
   - Games tab sirf verified developers upload kar sakein

### Phase 3: Real Rating System
4. **Manual User Ratings**:
   - Users individually rate apps (1-5 stars)
   - Average calculated from real ratings
   - Remove fake default ratings
   - Show review count

### Phase 4: Trust Score Details
5. **Detailed App Info** instead of percentage:
   - Show what features app has (permissions, payment, etc.)
   - Show what it doesn't have
   - Clear breakdown instead of just "60% safe"

### Phase 5: Razorpay Payment Integration
6. **Payment System**:
   - Razorpay backend API integration
   - Commission model (platform deducts commission)
   - Developer wallet system
   - Transaction verification on backend
   - Block external payment systems in apps

### Database Changes Needed:
- `developer_accounts` table (phone, aadhar, pan, photo, status)
- `app_ratings` table (user_id, app_id, rating, review_text)
- `developer_wallets` table (balance, transactions)
- `payment_transactions` table
- Update `apps` table rating to be calculated from real ratings
- Bottom nav doesn't need DB changes

### Technical Notes:
- Razorpay requires API keys (admin settings se connect)
- Developer verification admin approval required
- Phase 1-3 can be done without external APIs
- Phase 5 needs Razorpay keys from admin
