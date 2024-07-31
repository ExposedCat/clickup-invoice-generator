import { shortenString } from './utils.js';
import { SPACING, type PDF } from './pdf.js';
import type { Task } from './api.js';

export type Header = {
  kind: 'from' | 'to';
  name: string;
  address: string;
  country: string;
  postalCode: string;
  ICO?: string;
  DIC?: string;
};

export type RenderHeadersArgs = {
  pdf: PDF;
  from: Omit<Header, 'kind'>;
  to: Omit<Header, 'kind'>;
};

function renderHeader(pdf: PDF, header: Header) {
  pdf.bulkWrite('vertical', [
    { type: 'header', text: `INVOICE ${header.kind.toUpperCase()}` },
    { type: 'subHeader', text: header.name },
    { text: header.address },
    { text: header.country },
    { text: header.postalCode },
    { text: header.ICO ? `ICO: ${header.ICO}` : null },
    { text: header.DIC ? `DIC: ${header.DIC}` : null },
  ]);
}

export type Credentials = {
  bankName: string;
  iban: string;
  bic: string;
  variable: string;
};

export type RenderCredentialsArgs = {
  pdf: PDF;
  credentials: Credentials;
};

export function renderCredentials(args: RenderCredentialsArgs) {
  const { pdf, credentials } = args;
  pdf.bulkWrite('vertical', [
    { text: `Bank name:         ${credentials.bankName}` },
    { text: `IBAN:              ${credentials.iban}` },
    { text: `BIC:               ${credentials.bic}` },
    { text: `Variable symbol:   ${credentials.variable}` },
  ]);

  pdf.newLine(5);
}

export type RenderTopBarArgs = {
  pdf: PDF;
  invoiceId: number;
};

export function renderTopBar(args: RenderTopBarArgs) {
  const { pdf, invoiceId } = args;

  pdf.write({
    text: `Invoice #${invoiceId}`,
    direction: 'vertical',
  });

  pdf.newLine(5);

  pdf.cursorTo(SPACING.padding, pdf.cursor.y, true);
}

export function renderHeaders(args: RenderHeadersArgs) {
  const { pdf, from, to } = args;

  const initialCursor = pdf.cursor;

  renderHeader(pdf, { ...from, kind: 'from' });

  const firstColumnCursor = pdf.cursor;
  pdf.cursorTo(pdf.width / 2, initialCursor.y, true);

  renderHeader(pdf, { ...to, kind: 'to' });

  pdf.cursor = firstColumnCursor;
  pdf.newLine(5);
}

export type RenderTasksArgs = {
  pdf: PDF;
  salary: {
    currency: string;
    perHour: number;
  };
  tasks: Task[];
};

export function renderTasks(args: RenderTasksArgs): number {
  const { pdf, tasks, salary } = args;

  const tasksCursor = pdf.cursor;
  for (const task of tasks) {
    pdf.write({
      text: `[${task.id}] ${shortenString(task.name, 40)}`,
      direction: 'vertical',
      url: `https://app.clickup.com/t/${task.id}`,
    });
  }

  pdf.cursorTo(pdf.width - 180, tasksCursor.y, true);

  for (const task of tasks) {
    const time = Number((task.time / 1000 / 60 / 60).toFixed(2));

    pdf.write({
      text: `${time}h`,
      direction: 'vertical',
    });
  }

  pdf.cursorTo(pdf.width - 100, tasksCursor.y, true);

  let total = 0;
  for (const task of tasks) {
    const time = Number((task.time / 1000 / 60 / 60).toFixed(2));
    total += time * salary.perHour;

    pdf.write({
      text: `${time * salary.perHour} ${salary.currency}`,
      direction: 'vertical',
    });
  }

  pdf.cursorTo(pdf.width - 180, pdf.cursor.y, true);
  pdf.newLine(3);

  return total;
}

export type RenderTotalArgs = {
  pdf: PDF;
  currency: string;
  total: number;
  promo?: boolean;
};

export function renderTotal(args: RenderTotalArgs) {
  const { pdf, total, currency, promo = true } = args;

  pdf.write({
    type: 'subHeader',
    text: `Total: ${total} ${currency}`,
    direction: 'vertical',
  });

  if (promo) {
    renderPromo({ pdf });
  }
}

export type RenderPromoArgs = { pdf: PDF };

export function renderPromo(args: RenderPromoArgs) {
  const { pdf } = args;

  pdf.cursorTo(0, pdf.height - 50);
  pdf.write({
    text: `Invoice created via Invoice Generator by Artem Prokop`,
    url: 'https://github.com/ExposedCat/invoice-generator',
  });
}
