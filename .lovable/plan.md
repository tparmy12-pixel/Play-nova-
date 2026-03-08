

## Plan: Popular Apps as Sample Data

The user wants to insert sample app entries for Facebook, WhatsApp, YouTube, Twitter (X), and Telegram into the `apps` table with their official icons and download links.

### What will be done

Insert 5 popular apps into the `apps` table using the database insert tool:

| App | Category | Icon | APK Link (official site) |
|-----|----------|------|--------------------------|
| Facebook | Social | Official logo URL | https://www.facebook.com |
| WhatsApp | Social | Official logo URL | https://www.whatsapp.com/android |
| YouTube | Entertainment | Official logo URL | https://www.youtube.com |
| Twitter (X) | Social | Official logo URL | https://x.com |
| Telegram | Social | Official logo URL | https://telegram.org/android |

Each app will have:
- **icon_url**: High-quality official logo from public CDN/Wikipedia commons
- **apk_url**: Link to official website/download page
- **category**: Social / Entertainment
- **version**: Latest known version
- **description**: Short Hindi+English description
- **download_count**: Random realistic numbers
- **rating**: 4.3-4.7 range

### Technical Details

- Use the **insert tool** to add rows to the `apps` table (no schema changes needed)
- Icons will be fetched from publicly accessible URLs (e.g., official brand assets or Wikipedia commons)
- No code changes required — apps will automatically appear on the Index page via the existing query

