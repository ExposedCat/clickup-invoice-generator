## ClickUp Invoice Generator

#### Installation

```bash
npm install clickup-invoice-generator
```

### Working Example

See `example.ts` for fully functional example.

Copy `.env.example` to `.env` and run generator using

```bash
npm start
```

### Quick Start

#### Create PDF instance

```typescript
import { PDF } from 'clickup-invoice-generator';

const pdf = await new PDF().init();
```

#### Render details

```typescript
import { renderTopBar, renderHeaders, renderCredentials } from 'clickup-invoice-generator';

renderTopBar({ pdf, invoiceId });

renderHeaders({
  pdf,
  from: {
    name: 'Jane Doe',
    address: '123 Main Street',
    country: 'Czech Republic',
    postalCode: '123',
    ICO: '123',
    DIC: '123',
  },
  to: {
    name: 'John Doe',
    address: '123 Main Street',
    country: 'United States',
    postalCode: '123',
  },
});

renderCredentials({
  pdf,
  credentials: {
    bankName: 'Revolut',
    iban: 'LT123123123',
    bic: '123123',
    variable: '123', // Invoice ID
  },
});
```

#### Fetch tasks

```typescript
import { fetchTasks } from 'clickup-invoice-generator';

const tasks = await fetchTasks(
  'this', // 'last' for last month
);
```

#### Render tasks and total

```typescript
import { renderTasks, renderTotal } from 'clickup-invoice-generator';

const total = renderTasks({
  pdf,
  tasks,
  salary: {
    currency: process.env.CURRENCY!,
    perHour: Number(process.env.PER_HOUR),
  },
});

renderTotal({
  promo: true, // Please use `renderPromo({ pdf })` elsewhere if you set `false` here
  pdf,
  total,
  currency: process.env.CURRENCY!,
});
```

#### Save PDF

```typescript
await pdf.save('invoice.pdf');
```

### UI

- TBD; only TS script available currently

### TODO

- Remove `dotenv`
