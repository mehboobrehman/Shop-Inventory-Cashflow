Inventory System for Shops

### System Type
Ye ek **Shop Inventory & Account Management System** hoga. Ye public website ya online
shopping website nahi hogi. Is ka purpose sirf aap ki shop ka record maintain karna hoga.
### Modules
**1. Login System**
* Sirf authorized users login kar sakenge.
**2. Product Management**
* Product add, edit aur delete.
* Product Name
* Barcode
* Sale Price
* Current Stock
* Minimum Stock Limit
* Product ki complete details save hongi.
**3. Barcode Scanning**
* Product ka barcode scan karte hi us ki details screen par aa jayengi.
* Sale Price
* Available Stock
* Product Information
**4. Stock Management**
* Naya stock add karna.
* Stock update karna.
* Current available quantity dekhna.
**5. Low Stock Notifications**
* Har product ke liye minimum stock limit set ki ja sakti hai.
* Agar kisi product ka stock us limit se neeche chala jaye to dashboard par notification show
hogi.
* Is se time par dobara stock mangwana aasaan ho jayega.
**6. Account Management**
System mein JazzCash, Easypaisa aur Bank Account ka record rakha ja sakega.
Har account ke liye:
* Current Balance
* Deposit Entry
* Withdrawal Entry
* Complete Transaction History
**7. Sales History**
* Har sale ka record save hoga.
* Date
* Product
* Quantity
* Sale Price
* Total Amount
* Purani sales kabhi bhi search ki ja sakengi.
**8. Account Transaction History**
* JazzCash
* Easypaisa
* Bank Account
Har transaction ki history save hogi taake baad mein easily check ki ja sake.
**9. Dashboard**
Dashboard par important information ek hi jagah nazar aayegi, jaise:
* Total Products
* Current Stock
* Low Stock Notifications
* Recent Sales
* Current Account Balances
### Automatic JazzCash / Easypaisa / Bank Balance
Agar aap chahte hain ke JazzCash, Easypaisa aur Bank ka balance automatically system mein
update ho, to is ke liye un companies ke **Official Merchant APIs** aur **API Credentials**
(Merchant ID, API Key, Secret, etc.) ki zarurat hogi.
Ye APIs sirf merchant/business accounts ke liye available hoti hain. Agar APIs available na hon, to
account entries aur balances manually maintain karne honge.
Agar automatic synchronization use karni ho to system ko internet ke saath live server par
chalana zaroori hoga.
### Local Use ya Online Use
**Local Use:**
Agar system sirf shop ke laptop par chalana ho, to internet ki zarurat nahi hogi. Saari entries
manually save hongi aur system local machine par chalega.And Balance manuaally dale gi .
Multiple Devices & Online Access
Agar system ko sirf shop ke andar ek hi WiFi/network par multiple devices (Laptop, Mobile ya PC)
se use karna ho, to domain aur hosting ki zarurat nahi hogi.
Lekin agar system ko shop ke bahar se bhi access karna ho (jaise ghar se, kisi aur location se) ya
JazzCash, Easypaisa aur Bank Accounts ka balance APIs ke zariye automatically synchronize
karna ho, to system ko live server par host karna hoga.
Is surat mein:
Domain aur Hosting/Server ki yearly cost hogi.
Har saal renewal karna hoga.
Is wajah se project ki total cost bhi increase hogi.
Is liye kindly confirm kar dein ke aap ko Merchant Api lagwani hen ya nahin .
### Website ki jagah Mobile App kyun nahi?
Meri recommendation web-based system hai, kyun ke:
* Laptop aur mobile dono par browser se chal sakta hai.
* Alag Android app install karne ki zarurat nahi.
* Development aur maintenance comparatively aasaan hoti hai.
* Future mein agar online access chahiye ho to website ko live karna simple hota hai.
* App develop aur maintain karne ki cost aam tor par web system se zyada hoti hai.
Kindly is list ko achhi tarah review kar lijiye. Agar kisi feature mein koi addition, removal ya
modification chahiye ho to bata dein.
---

## LAN Deployment

This application supports deployment on a shop laptop, accessible from other devices (laptop, mobile, tablet) on the same WiFi network.

### Prerequisites
- [Bun](https://bun.sh/) installed.
- [Node.js](https://nodejs.org/) installed.
- [PostgreSQL](https://www.postgresql.org/) database server running locally.

### Setup Steps
1. Open a terminal in the project root directory.
2. Run the setup script:
   - For Linux/Mac: `bash deploy/lan/setup.sh`
   - For Windows: `.\deploy\lan\setup.ps1`

This will install dependencies, configure the environment, run database migrations, seed the database, and start the application using PM2.

### Accessing from Other Devices
1. Find your machine's LAN IP address (e.g., `192.168.1.5`).
2. On another device connected to the same WiFi, open a browser and visit:
   `http://<your-machine-ip>:3000/`

### Troubleshooting
- **Database not accessible:** Ensure PostgreSQL is running and credentials in `.env` are correct.
- **Can't connect:** Verify all devices are on the same WiFi network and your machine's IP address is correct.
- **PM2 issues:** Check PM2 status with `node_modules/.bin/pm2 status`.

## Frontend Server Troubleshooting (Environment Limitations)
The frontend development server command `bun run dev:client` (which invokes `bun vite` in the `client/` directory) often times out in this specific environment.
- **Root Cause**: This appears to be an issue with `bun`'s package linking and potentially OneDrive file locking, which interferes with `vite` startup. 
- **Recommendation**: If `bun vite` continues to timeout, use the production-ready PM2 configuration for development as well, as documented in `DECISIONS.md`: `node_modules/.bin/pm2 start pm2.config.js`. This is a known and accepted limitation of the current development environment.
