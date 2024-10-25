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

export type Total = {
  salary: string | number;
  totalHours: string | number;
};

function convertToHours(time: number, toFixed: null | number): number {
  return toFixed ? Number((time / 1000 / 60 / 60).toFixed(toFixed)) : time / 1000 / 60 / 60;
}

export function renderTasks(args: RenderTasksArgs): Total {
  const { pdf, tasks, salary } = args;
  const fullDescripted = tasks.slice(0, 18);
  const rest = tasks.slice(18);

  const tasksCursor = pdf.cursor;
  for (const task of fullDescripted) {
    pdf.write({
      text: `[${task.id}] ${shortenString(task.name, 40)}`,
      direction: 'vertical',
      url: `https://app.clickup.com/t/${task.id}`,
    });
  }

  if (rest.length > 0) {
    pdf.write({
      text: `And ${rest.length} more for total`,
      direction: 'vertical',
    });
  }

  pdf.cursorTo(pdf.width - 180, tasksCursor.y, true);

  for (const task of fullDescripted) {
    const time = convertToHours(task.time, 2);

    pdf.write({
      text: `${time}h`,
      direction: 'vertical',
    });
  }

  const restTotalHours =
    rest.length > 0 ? rest.reduce((sum, task) => sum + convertToHours(task.time, null), 0).toFixed(2) : 0;
  if (rest.length > 0) {
    pdf.write({
      text: `${restTotalHours}h`,
      direction: 'vertical',
    });
  }
  const restTotal = Number(restTotalHours) * salary.perHour;

  pdf.cursorTo(pdf.width - 100, tasksCursor.y, true);

  for (const task of fullDescripted) {
    const time = convertToHours(task.time, 2);

    pdf.write({
      text: `${time * salary.perHour} ${salary.currency}`,
      direction: 'vertical',
    });
  }

  if (rest.length > 0) {
    pdf.write({
      text: `${restTotal} ${salary.currency}`,
      direction: 'vertical',
    });
  }

  pdf.cursorTo(pdf.width - 290, pdf.cursor.y, true);
  pdf.newLine(3);
  const totalTime = Number(tasks.reduce((sum, task) => sum + convertToHours(task.time, null), 0).toFixed(2));
  const total = totalTime * salary.perHour;
  return { salary: total.toFixed(0), totalHours: totalTime };
}

export type RenderTotalArgs = {
  pdf: PDF;
  currency: string;
  total: Total;
  promo?: boolean;
};

export function renderTotal(args: RenderTotalArgs) {
  const { pdf, total, currency, promo = true } = args;

  pdf.write({
    type: 'subHeader',
    text: `Total: ${total.salary} ${currency} for ${total.totalHours}h`,
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
