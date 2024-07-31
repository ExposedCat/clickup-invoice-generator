import { configDotenv } from 'dotenv';

import { renderCredentials, renderHeaders, renderTasks, renderTopBar, renderTotal } from './render.js';
import { PDF } from './pdf.js';
import { readOrCreateNextID } from './file.js';
import { fetchTasks } from './api.js';

configDotenv();

const invoiceId = await readOrCreateNextID();

const pdf = await new PDF().init();

const requiredEnvs = [
  'CLICKUP_PRIVATE_KEY',
  'CLICKUP_TEAM_ID',
  'CLICKUP_USER_ID',
  'FROM_NAME',
  'FROM_ADDRESS',
  'FROM_COUNTRY',
  'FROM_POSTAL_CODE',
  'TO_NAME',
  'TO_ADDRESS',
  'TO_COUNTRY',
  'TO_POSTAL_CODE',
  'BANK_NAME',
  'IBAN',
  'BIC',
  'CURRENCY',
  'PER_HOUR',
];

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    throw new Error(`Missing required environment variable: ${env}`);
  }
}

renderTopBar({ pdf, invoiceId });

renderHeaders({
  pdf,
  from: {
    name: process.env.FROM_NAME!,
    address: process.env.FROM_ADDRESS!,
    country: process.env.FROM_COUNTRY!,
    postalCode: process.env.FROM_POSTAL_CODE!,
    ICO: process.env.FROM_ICO,
    DIC: process.env.FROM_DIC,
  },
  to: {
    name: process.env.TO_NAME!,
    address: process.env.TO_ADDRESS!,
    country: process.env.TO_COUNTRY!,
    postalCode: process.env.TO_POSTAL_CODE!,
    ICO: process.env.TO_ICO,
    DIC: process.env.TO_DIC,
  },
});

renderCredentials({
  pdf,
  credentials: {
    bankName: process.env.BANK_NAME!,
    iban: process.env.IBAN!,
    bic: process.env.BIC!,
    variable: String(invoiceId),
  },
});

const tasks = await fetchTasks({
  clickUp: {
    privateKey: process.env.CLICKUP_PRIVATE_KEY!,
    teamId: process.env.CLICKUP_TEAM_ID!,
    userId: process.env.CLICKUP_USER_ID!,
  },
  period: process.env.PERIOD === 'last' || process.env.PERIOD === 'this' ? process.env.PERIOD : 'last',
});
const total = renderTasks({
  pdf,
  tasks,
  salary: {
    currency: process.env.CURRENCY!,
    perHour: Number(process.env.PER_HOUR),
  },
});

renderTotal({ pdf, total, currency: process.env.CURRENCY! });

await pdf.save('invoice.pdf');
