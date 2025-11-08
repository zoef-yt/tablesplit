# 🇮🇳 UPI Integration Guide for TableSplit

## Overview

TableSplit supports **UPI (Unified Payments Interface)** - India's instant payment system. Users can settle expenses via PhonePe, Google Pay, Paytm, BHIM, and all UPI-enabled apps.

---

## UPI ID Format

### Valid UPI IDs
```
john@paytm
alice.doe@phonepe
user123@okaxis
merchant-shop@icici
```

### Format Rules (NPCI Standards)
- **Before @**: 2-256 characters (alphanumeric, dots, hyphens)
- **After @**: 3-64 characters (letters only, must start with letter)
- **No underscores** allowed
- Case-insensitive (stored as lowercase)

### Regex Validation
```typescript
/^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/
```

---

## UPI Deep Links

### Generic Format (Works with ALL UPI apps)
```
upi://pay?pa=merchant@paytm&pn=Merchant%20Name&am=500.00&cu=INR&tn=Dinner%20split
```

### Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `pa` | ✅ Yes | Payee UPI ID | `user@paytm` |
| `pn` | ✅ Yes | Payee name | `John Doe` |
| `am` | ❌ No | Amount (2 decimals) | `500.00` |
| `cu` | ❌ No | Currency (default INR) | `INR` |
| `tn` | ❌ No | Transaction note | `Dinner split` |
| `tr` | ❌ No | Transaction reference | `TXN123456` |
| `mc` | ❌ No | Merchant code | `1234` |
| `tid` | ❌ No | Transaction ID (PSP) | Auto-generated |

---

## App-Specific Deep Links

### PhonePe
```
phonepe://pay?pa=user@paytm&pn=Name&am=500&cu=INR&tn=Payment
```
**Android Package**: `com.phonepe.app`

### Google Pay
```
gpay://upi/pay?pa=user@paytm&pn=Name&am=500&cu=INR&tn=Payment
```
**Android Package**: `com.google.android.apps.nbu.paisa.user`  
**iOS Scheme**: `googlepay://`

### Paytm
```
paytmmp://pay?pa=user@paytm&pn=Name&am=500&cu=INR&tn=Payment
```
**Android Package**: `net.one97.paytm`  
**iOS Scheme**: `paytm://`

### BHIM
```
upi://pay?pa=user@paytm&pn=Name&am=500&cu=INR&tn=Payment
```
(Uses generic UPI scheme)

---

## Implementation Examples

### 1. Generate UPI Link (Backend)
```typescript
import { generateUpiDeepLink } from './utils/upi';

const deepLink = generateUpiDeepLink({
  pa: 'friend@paytm',
  pn: 'Friend Name',
  am: 500,
  tn: 'TableSplit - Dinner payment'
});

// Result: upi://pay?pa=friend@paytm&pn=Friend%20Name&am=500.00&cu=INR&tn=TableSplit%20-%20Dinner%20payment
```

### 2. Settlement Button (Frontend)
```tsx
// When user wants to settle a debt
const handleSettleViaUPI = (settlement: Settlement) => {
  const payee = users.find(u => u._id === settlement.to);
  
  if (!payee?.upiId) {
    toast.error('Payee has not set up UPI ID');
    return;
  }

  const upiLink = generateUpiDeepLink({
    pa: payee.upiId,
    pn: payee.name,
    am: settlement.amount,
    tn: `TableSplit - ${group.name}`,
    tr: `TS-${Date.now()}`
  });

  // Open UPI app
  window.location.href = upiLink;
  
  // Or for mobile web
  if (isMobile) {
    window.open(upiLink, '_blank');
  }
};
```

### 3. UPI ID Input (Profile Settings)
```tsx
<FormField
  control={form.control}
  name="upiId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>UPI ID (for settlements)</FormLabel>
      <FormControl>
        <Input
          {...field}
          placeholder="yourname@paytm"
          pattern="^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$"
        />
      </FormControl>
      <FormDescription>
        Enter your UPI ID from PhonePe, Google Pay, Paytm, etc.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Popular UPI Providers

| Provider | UPI Handle | Example |
|----------|-----------|---------|
| **Paytm** | `@paytm` | `user@paytm` |
| **PhonePe** | `@ybl`, `@phonepe` | `user@ybl` |
| **Google Pay** | `@okaxis`, `@okicici` | `user@okaxis` |
| **Amazon Pay** | `@apl` | `user@apl` |
| **BHIM** | `@upi` | `user@upi` |
| **ICICI Bank** | `@icici` | `user@icici` |
| **HDFC Bank** | `@hdfcbank` | `user@hdfcbank` |
| **Axis Bank** | `@axisbank` | `user@axisbank` |
| **SBI YONO** | `@sbi` | `user@sbi` |

---

## Payment Flow

### User Journey
```
1. User sees: "You owe ₹500 to Alice"
2. Clicks: "Settle via UPI"
3. System generates: upi://pay?pa=alice@paytm&pn=Alice&am=500&tn=Dinner
4. Opens: PhonePe/GPay/Paytm (user's choice)
5. User confirms payment in UPI app
6. User returns to TableSplit
7. Marks payment as "Paid" (optional auto-confirm via UPI callback)
```

### Response Codes (From UPI Apps)

| App | Success | Failure |
|-----|---------|---------|
| **Paytm** | `0` | Other |
| **PhonePe** | `00` | Other |
| **Google Pay** | `S` | `F` |

---

## Security Considerations

### ✅ Best Practices
- Always validate UPI ID format before storing
- Store UPI IDs in lowercase
- Never store payment credentials (only UPI ID)
- Use HTTPS for all API calls
- Implement rate limiting for settlement requests

### ⚠️ Important Notes
- **P2P Payments**: UPI deep links work for peer-to-peer (no merchant code needed)
- **Merchant Payments**: Require merchant code (`mc`) and digital signature
- **Amount Limits**: UPI has ₹1,00,000 per transaction limit
- **No Auto-Debit**: Users must manually confirm in UPI app

---

## Future Enhancements

### Phase 1 (Current)
- ✅ UPI ID storage in user profile
- ✅ UPI deep link generation
- ✅ Manual settlement marking

### Phase 2 (Planned)
- [ ] UPI QR code generation
- [ ] Auto-detect installed UPI apps
- [ ] App-specific deep links (PhonePe, GPay, Paytm)
- [ ] Settlement reminders via push notifications

### Phase 3 (Advanced)
- [ ] UPI payment verification (via PSP callbacks)
- [ ] Auto-settlement confirmation
- [ ] UPI autopay for recurring expenses
- [ ] Multi-currency support (UPI + international)

---

## Testing

### Test UPI IDs (Use in Development)
```
test@paytm
demo@phonepe
sample@okaxis
```

### Test Deep Link
```
upi://pay?pa=test@paytm&pn=Test%20User&am=1.00&cu=INR&tn=Test%20Payment
```

### Sandbox Environments
- **PhonePe Sandbox**: https://developer.phonepe.com/
- **Google Pay Test**: https://developers.google.com/pay/india
- **Paytm Staging**: https://business.paytm.com/docs

---

## References

- [NPCI UPI Specification](https://www.npci.org.in/what-we-do/upi/product-overview)
- [Google Pay for India](https://developers.google.com/pay/india)
- [PhonePe Developer Docs](https://developer.phonepe.com/)
- [Paytm UPI Integration](https://business.paytm.com/docs/upi-solutions/)

---

**Built for India, with ❤️**
