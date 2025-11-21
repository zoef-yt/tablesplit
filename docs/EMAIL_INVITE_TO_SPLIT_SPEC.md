# Email Invite to Split - Technical Specification

## Overview

Allow users to add non-registered email addresses to expense splits. When the invited person signs up, they are automatically linked to their pending splits and the original inviter.

## User Flow

### 1. Inviting a Non-Member to a Split

1. User creates an expense and selects participants
2. User can enter an email address that's not in the system
3. System creates an `Invite` record and adds email as pending participant
4. Invite email is sent with signup link + deep link to the group
5. Expense is created with the pending participant included in calculations

### 2. Invited User Signs Up

1. User clicks link in email or signs up normally
2. On signup, system checks for pending invites matching their email
3. All pending participant records are converted to real user references
4. User is automatically added to relevant groups
5. Friend connection is created with the inviter
6. User sees their expenses and balances immediately

### 3. Admin Management

- View pending invites per group
- Resend invite emails
- Cancel/delete pending invites
- See invite status (pending, accepted, expired)

---

## Database Models

### New: `Invite` Model

```typescript
// backend/src/models/Invite.ts

interface IInvite extends Document {
  email: string;                    // Normalized email (lowercase, trimmed)
  invitedBy: Types.ObjectId;        // User who sent invite
  groupId: Types.ObjectId;          // Group the invite is for
  expenseId?: Types.ObjectId;       // Optional: specific expense
  tokenHash: string;                // Hashed token for email verification
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: Date;                  // Token expiration (7 days)
  createdAt: Date;
  acceptedAt?: Date;
  acceptedBy?: Types.ObjectId;      // User who accepted (after signup)
}

const InviteSchema = new Schema<IInvite>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  expenseId: { type: Schema.Types.ObjectId, ref: 'Expense' },
  tokenHash: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: Date,
  acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Compound index for efficient lookups
InviteSchema.index({ email: 1, groupId: 1, status: 1 });
InviteSchema.index({ invitedBy: 1, status: 1 });
```

### Modified: `Expense` Model - Split Structure

```typescript
// Modify splits to support pending participants

interface ISplit {
  userId?: Types.ObjectId;          // Real user (optional if pending)
  pendingEmail?: string;            // Email for pending participant
  amount: number;
  percentage?: number;
  status: 'active' | 'pending';     // pending = waiting for signup
}
```

### New: `InviteAuditLog` Model

```typescript
interface IInviteAuditLog extends Document {
  inviteId: Types.ObjectId;
  action: 'created' | 'sent' | 'resent' | 'accepted' | 'expired' | 'cancelled';
  performedBy?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

## API Endpoints

### Invite Management

```typescript
// Create invite when adding non-member to split
POST /api/invites
Body: {
  email: string;
  groupId: string;
  expenseId?: string;
}
Response: {
  invite: IInvite;
  message: string;
}

// Get pending invites for a group (admin view)
GET /api/invites/group/:groupId
Response: {
  invites: IInvite[];
}

// Get invites sent by current user
GET /api/invites/sent
Response: {
  invites: IInvite[];
}

// Resend invite email
POST /api/invites/:inviteId/resend
Response: {
  success: boolean;
  message: string;
}

// Cancel an invite
DELETE /api/invites/:inviteId
Response: {
  success: boolean;
}

// Accept invite (called during signup flow)
POST /api/invites/accept
Body: {
  token: string;
}
Response: {
  success: boolean;
  groupId: string;
}
```

### Modified Endpoints

```typescript
// Modified: Create expense - support pending emails
POST /api/expenses
Body: {
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  selectedMembers: string[];        // User IDs
  pendingEmails?: string[];         // New: emails to invite
  category?: string;
}

// Modified: Signup - check for pending invites
POST /api/auth/signup
// After creating user, automatically:
// 1. Find all invites matching email
// 2. Convert pending splits to real user
// 3. Add user to groups
// 4. Create friend connections
```

---

## Service Layer

### `invite.service.ts`

```typescript
export class InviteService {
  /**
   * Create an invite for a non-registered email
   */
  async createInvite(
    inviterId: string,
    email: string,
    groupId: string,
    expenseId?: string
  ): Promise<{ invite: IInvite; token: string }> {
    // 1. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new BadRequestError('User already registered. Add them directly.');
    }

    // 3. Check for existing pending invite
    const existingInvite = await Invite.findOne({
      email: normalizedEmail,
      groupId,
      status: 'pending'
    });
    if (existingInvite) {
      // Return existing invite, optionally resend email
      return { invite: existingInvite, token: '' };
    }

    // 4. Rate limit check
    await this.checkRateLimit(inviterId);

    // 5. Generate token and hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 6. Create invite
    const invite = await Invite.create({
      email: normalizedEmail,
      invitedBy: inviterId,
      groupId,
      expenseId,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // 7. Create audit log
    await this.createAuditLog(invite._id, 'created', inviterId);

    // 8. Send invite email (async)
    this.sendInviteEmail(normalizedEmail, token, inviterId, groupId);

    return { invite, token };
  }

  /**
   * Process pending invites when user signs up
   */
  async processSignupInvites(userId: string, email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    // Find all pending invites for this email
    const pendingInvites = await Invite.find({
      email: normalizedEmail,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('invitedBy groupId');

    for (const invite of pendingInvites) {
      try {
        // 1. Convert pending splits to real user
        await Expense.updateMany(
          {
            groupId: invite.groupId,
            'splits.pendingEmail': normalizedEmail
          },
          {
            $set: {
              'splits.$[elem].userId': userId,
              'splits.$[elem].status': 'active',
              'splits.$[elem].pendingEmail': null
            }
          },
          {
            arrayFilters: [{ 'elem.pendingEmail': normalizedEmail }]
          }
        );

        // 2. Add user to group
        await Group.findByIdAndUpdate(
          invite.groupId,
          {
            $addToSet: {
              members: {
                userId,
                joinedAt: new Date(),
                role: 'member'
              }
            }
          }
        );

        // 3. Create friend connection with inviter
        await this.createFriendConnection(userId, invite.invitedBy.toString());

        // 4. Update invite status
        invite.status = 'accepted';
        invite.acceptedAt = new Date();
        invite.acceptedBy = userId;
        await invite.save();

        // 5. Create audit log
        await this.createAuditLog(invite._id, 'accepted', userId);

        // 6. Recalculate balances
        await expenseService.recalculateBalances(userId, invite.groupId.toString());

      } catch (error) {
        logger.error(`Failed to process invite ${invite._id}:`, error);
      }
    }
  }

  /**
   * Rate limit invites per user
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const recentInvites = await Invite.countDocuments({
      invitedBy: userId,
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentInvites >= 20) {
      throw new BadRequestError('Too many invites sent. Please wait 24 hours.');
    }
  }

  /**
   * Validate and accept invite by token
   */
  async acceptInviteByToken(token: string, userId: string): Promise<IInvite> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await Invite.findOne({
      tokenHash,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invite) {
      throw new BadRequestError('Invalid or expired invite');
    }

    // Process the invite
    // ... (similar to processSignupInvites but for single invite)

    return invite;
  }

  /**
   * Allow invitee to opt out and delete their data
   */
  async optOut(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    // Delete all pending invites
    await Invite.deleteMany({
      email: normalizedEmail,
      status: 'pending'
    });

    // Remove from pending splits
    await Expense.updateMany(
      { 'splits.pendingEmail': normalizedEmail },
      { $pull: { splits: { pendingEmail: normalizedEmail } } }
    );

    // Recalculate affected expenses
    // ... (would need to track which expenses were affected)
  }
}
```

---

## Frontend Components

### 1. Member Selector Enhancement

```tsx
// Modify the member selection in expense creation to allow email input

interface MemberSelectorProps {
  groupMembers: User[];
  selectedMembers: string[];
  pendingEmails: string[];
  onMemberChange: (members: string[]) => void;
  onPendingEmailAdd: (email: string) => void;
  onPendingEmailRemove: (email: string) => void;
}

// Shows both existing members and allows adding emails
// Email validation before adding
// Shows pending emails with different styling (e.g., yellow badge)
```

### 2. Pending Invites Admin Panel

```tsx
// New component for group settings or separate page

interface PendingInvitesPanelProps {
  groupId: string;
}

// Shows:
// - List of pending invites
// - Email, invited by, date, status
// - Actions: Resend, Cancel
// - Filter by status
```

### 3. Invite Status in Expense View

```tsx
// Show pending participants in expense details

// Display pending emails with "Invited" badge
// Show "Waiting for signup" status
// Allow resending invite from expense view
```

---

## Email Templates

### Invite Email

```html
Subject: {{inviterName}} invited you to split expenses on TableSplit

Hi there!

{{inviterName}} has added you to an expense on TableSplit and wants to split
the cost with you.

Group: {{groupName}}
{{#if expenseDescription}}
Expense: {{expenseDescription}} - {{expenseAmount}}
Your share: {{userShare}}
{{/if}}

Click below to sign up and see your expenses:

[Sign Up Now] (link with token)

This invite expires in 7 days.

---
Don't want to receive these emails? [Opt out](link)
```

---

## Security Considerations

### 1. Token Security
- Tokens are hashed (SHA-256) before storage
- Tokens expire after 7 days
- One-time use for acceptance

### 2. Rate Limiting
- Max 20 invites per user per 24 hours
- Prevents spam/abuse

### 3. Email Normalization
- All emails stored lowercase and trimmed
- Consistent matching on signup

### 4. Privacy/GDPR
- Opt-out link in all emails
- Opt-out deletes all pending data
- Clear data retention policy

### 5. Race Condition Handling
```typescript
// Use transactions for atomic operations
const session = await mongoose.startSession();
try {
  session.startTransaction();

  // 1. Create user
  // 2. Process invites
  // 3. Update expenses
  // 4. Add to groups

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## Migration Plan

### Phase 1: Database Setup
1. Create Invite model
2. Create InviteAuditLog model
3. Add `pendingEmail` and `status` to expense splits
4. Create indexes

### Phase 2: Backend Services
1. Implement InviteService
2. Modify ExpenseService to handle pending emails
3. Modify AuthService to process invites on signup
4. Add API endpoints

### Phase 3: Frontend
1. Update expense creation form
2. Add pending invites panel to group settings
3. Show pending status in expense views
4. Handle invite acceptance flow

### Phase 4: Email & Notifications
1. Create invite email template
2. Implement email sending
3. Add push notifications for mobile (optional)

### Phase 5: Testing & Polish
1. Unit tests for invite service
2. Integration tests for signup flow
3. E2E tests for full invite flow
4. Handle edge cases

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Database | 2-3 hours |
| Phase 2: Backend | 6-8 hours |
| Phase 3: Frontend | 6-8 hours |
| Phase 4: Email | 2-3 hours |
| Phase 5: Testing | 4-6 hours |
| **Total** | **20-28 hours** |

---

## Open Questions

1. Should pending emails be visible to all group members or just the inviter?
2. Should we allow editing/removing pending participants from an expense?
3. What happens if inviter leaves the group before invitee accepts?
4. Should we send reminder emails before expiration?
5. How to handle the UX for the invited user - auto-login after signup?

---

## Next Steps

1. Review and approve this spec
2. Prioritize which features are MVP vs. nice-to-have
3. Create database migrations
4. Implement in phases
