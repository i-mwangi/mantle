# Quick Test Guide - Revenue Distribution

## ✅ System Status: READY

All components verified and ready for testing!

## 🚀 Quick Test Steps

### 1. Distribute Revenue (Farmer)
```
URL: http://localhost:3000/farmer-dashboard.html
Wallet: 0x81F0CC60cf0E0562B8545994a0a34E7Ed5Be45e9 (Farmer)
Action: Click "Distribute Revenue" for harvest #16
```

### 2. Verify Distribution (Terminal)
```bash
node scripts/check-distribution-results.cjs
```

### 3. Check Earnings (Investor)
```
URL: http://localhost:3000/app.html
Wallet: 0x0684858C1cBf15D17DBb51E3eE7ffFbDbB5Fdd18 (Investor)
Section: Go to "Earnings" tab
Expected: ~$239 in earnings
```

## 📊 Expected Results

**Harvest #16 (nivea grove)**
- Total Revenue: $2,800.00
- Farmer Share: $2,560.39
- Investor Pool: $239.61

**Investor (700 tokens out of 4,256 sold)**
- Token Share: 16.4%
- Revenue Share: ~$239.61
- Status: Pending (ready to claim)

## 🔧 Troubleshooting

### If distribution fails:
```bash
# Check backend logs for errors
# Look for "Creating individual distribution records"
```

### If investor sees $0:
```bash
# Verify distribution records were created
node scripts/check-distribution-results.cjs

# Check investor address matches
# Should be: 0x0684858c1cbf15d17dbb51e3ee7fffbdbb5fdd18 (lowercase)
```

### To reset and try again:
```bash
node scripts/reset-and-redistribute-harvest.cjs
```

## 📝 What Was Fixed

1. ✅ Recreated `revenue_distributions` table with correct schema
2. ✅ Reset harvest #16 to undistributed status
3. ✅ Verified investor holding record exists
4. ✅ Confirmed all table structures match Drizzle schema

## 🎯 Success Criteria

- [ ] Farmer can distribute revenue without errors
- [ ] Distribution records created in database
- [ ] Investor sees earnings in portal
- [ ] Amounts match expected calculations
- [ ] No console errors in frontend or backend

## 📞 Need Help?

Run verification script anytime:
```bash
node scripts/verify-distribution-ready.cjs
```

Check results after distribution:
```bash
node scripts/check-distribution-results.cjs
```
