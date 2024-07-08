import { shortenString } from './utils.js';
import type { PDF } from './pdf.js';
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
  tasks: Record<string, Task>;
};

export function renderTasks(args: RenderTasksArgs): number {
  const { pdf, tasks } = args;

  const tasksCursor = pdf.cursor;
  for (const [id, task] of Object.entries(tasks)) {
    pdf.write({
      text: `[${id}] ${shortenString(task.name, 40)}`,
      direction: 'vertical',
      url: `https://app.clickup.com/t/${id}`,
    });
  }

  pdf.cursorTo(pdf.width - 180, tasksCursor.y, true);

  for (const task of Object.values(tasks)) {
    const time = Number((task.time / 1000 / 60 / 60).toFixed(2));

    pdf.write({
      text: `${time}h`,
      direction: 'vertical',
    });
  }

  pdf.cursorTo(pdf.width - 100, tasksCursor.y, true);

  let total = 0;
  for (const task of Object.values(tasks)) {
    const time = Number((task.time / 1000 / 60 / 60).toFixed(2));
    total += time * 500;

    pdf.write({
      text: `${time * 500} CZK`,
      direction: 'vertical',
    });
  }

  pdf.cursorTo(pdf.width - 180, pdf.cursor.y, true);
  pdf.newLine(3);

  return total;
}

export type RenderTotalArgs = {
  pdf: PDF;
  total: number;
};

export function renderTotal(args: RenderTotalArgs) {
  const { pdf, total } = args;

  pdf.write({
    type: 'subHeader',
    text: `Total: ${total} CZK`,
    direction: 'vertical',
  });
}

export type RenderPromoArgs = { pdf: PDF };

export function renderPromo(args: RenderPromoArgs) {
  const { pdf } = args;

  pdf.cursorTo(0, pdf.height - 50);
  pdf.write({
    text: `Invoice created via Invoice Generator by Artem Prokop`,
    url: 'https://github.com/ExposedCat',
  });
}
