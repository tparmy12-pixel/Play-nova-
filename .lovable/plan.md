## Play Store-like Features Upgrade

### Already Implemented (No Changes Needed)
- ✅ Paid/Free app system (price_type, price columns)
- ✅ Payment through admin API (Razorpay edge functions)
- ✅ Screenshots upload & display
- ✅ App detail page at `/app/{id}`
- ✅ Commission system (30/70 split)

### New Features to Build

#### 1. Share Button on App Detail Page
- Add Web Share API button (WhatsApp, Telegram, copy link)
- Top-right share icon on app detail page

#### 2. App Demo Video Support
- Add `video_url` column to `apps` table (YouTube link or uploaded video)
- Add video URL input in Upload App form
- Display video on app detail page below screenshots

#### 3. Developer Name Display
- Join `profiles.display_name` with `apps.uploaded_by` 
- Show "by Developer Name" under app title on cards and detail page

#### 4. Admin Ads & Banners System
- Create `ad_banners` table (image_url, link, position, active, clicks)
- Admin panel section to manage banners
- Show banners on home page (carousel) and app detail page

#### 5. UI Polish
- Cleaner app cards with developer name
- Professional layout improvements

### Database Migration
- Add `video_url` to `apps` table
- Create `ad_banners` table with RLS
