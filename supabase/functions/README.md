# ZyroBet Supabase Edge Functions

## Security Architecture

1. **Zero Client-Side Balances:**
   - Clients have **NO direct write access** (`INSERT`, `UPDATE`, `DELETE`) on the `wallets` or `coin_ledger` tables.
   - All balance updates occur within atomic PostgreSQL transactions via the `apply_coin_transaction` function, executable **only** by the `service_role`.

2. **Server-Governed Economy:**
   - Clients cannot submit arbitrary coin numbers.
   - Distinct server functions govern specific game flows:
     - `wallet-get`: Retrieves current balance or initializes wallet with 500 coin signup bonus.
     - `wallet-transaction`: Contains a testing action `dev_grant` (+100 coins) guarded by `ENABLE_DEV_GRANT=true`.
     - `claim-daily-reward`: Verifies UTC daily streak eligibility before awarding coins.
     - `submit-score`: Validates skill game round outcome and awards calibrated victory coins.
     - `verify-purchase`: Verifies App Store / Google Play transaction tokens before ledger crediting.

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | Public Anon key for user JWT verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Service Role key (functions only) |
| `ENABLE_DEV_GRANT` | Set to `true` in development/staging for dev tools |

## Deploying Functions

```bash
# Deploy wallet functions
supabase functions deploy wallet-get
supabase functions deploy wallet-transaction
```
