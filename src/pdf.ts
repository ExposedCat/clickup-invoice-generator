import fs from 'fs/promises';

import { PDFDocument, PDFString, rgb } from '@pdfme/pdf-lib';
import type { PDFFont, PDFPage, RGB } from '@pdfme/pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export const FONT_SIZE = {
  header: 20,
  subHeader: 15,
  text: 12,
};

export const SPACING = {
  padding: 20,
  text: {
    gapX: 2,
    gapY: 4,
  },
  header: {
    gapX: 3,
    gapY: 6,
  },
  subHeader: {
    gapX: 3,
    gapY: 5,
  },
  link: {
    bottomGap: 2,
  },
};

export type Cursor = {
  x: number;
  y: number;
};

export type WriteArgs = {
  text: string;
  type?: keyof typeof FONT_SIZE;
  color?: RGB;
  direction?: 'vertical' | 'horizontal' | 'diagonal';
  url?: string;
};

export type BulkWriteArgs = Omit<WriteArgs, 'text'> & {
  text: string | null | undefined;
};

export type MarkLinkArgs = {
  from: Cursor;
  to: Cursor;
  url: string;
};

export class PDF {
  private doc!: PDFDocument;
  private font!: PDFFont;
  private page!: PDFPage;

  private x = SPACING.padding;
  private y = SPACING.padding;

  width!: number;
  height!: number;

  constructor() {}

  async init() {
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);

    const fontFile = await fs.readFile('./fonts/monospace.ttf');
    this.font = await this.doc.embedFont(fontFile.buffer);

    this.page = this.doc.addPage();
    const { width, height } = this.page.getSize();
    this.width = width;
    this.height = height;

    return this;
  }

  markLink(args: MarkLinkArgs) {
    const { from, to, url } = args;
    const link = this.doc.context.register(
      this.doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [from.x, from.y, to.x, to.y - SPACING.link.bottomGap],
        Border: [0, 0, 0],
        C: [0, 0, 1],
        A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
      }),
    );
    this.page.node.addAnnot(link);
    this.page.drawLine({
      start: { x: from.x, y: from.y - SPACING.link.bottomGap },
      end: { x: to.x, y: from.y - SPACING.link.bottomGap },
      color: rgb(0.7, 0.7, 0.74),
      thickness: 1,
      opacity: 0.8,
    });
  }

  write(args: WriteArgs) {
    const { text, type = 'text', color = rgb(0, 0, 0), direction, url } = args;

    const textSize = FONT_SIZE[type];
    const textWidth = this.font.widthOfTextAtSize(text, textSize);
    const textHeight = this.font.heightAtSize(textSize);

    const startCursor = { x: this.x, y: this.height - this.y - textSize };
    const endCursor = { x: this.x + textWidth, y: this.height - this.y };

    this.page.drawText(text, {
      x: startCursor.x,
      y: startCursor.y,
      size: textSize,
      font: this.font,
      color,
    });

    if (url) {
      this.markLink({
        from: startCursor,
        to: endCursor,
        url,
      });
    }

    if (direction === 'horizontal' || direction === 'diagonal') {
      this.x += textWidth + SPACING[type].gapX;
    }
    if (direction === 'vertical' || direction === 'diagonal') {
      this.y += textHeight + SPACING[type].gapY;
    }
  }

  bulkWrite(direction: WriteArgs['direction'], data: BulkWriteArgs[]) {
    for (const item of data) {
      if (item.text) {
        this.write({ direction, ...item, text: item.text });
      }
    }
  }

  cursorTo(x: number, y: number, raw = false) {
    this.x = x + Number(!raw) * SPACING.padding;
    this.y = y + Number(!raw) * SPACING.padding;
  }

  newLine(repeat = 1) {
    for (let i = 0; i < repeat; ++i) {
      this.y += SPACING.subHeader.gapY;
    }
  }

  rmLine(repeat = 1) {
    for (let i = 0; i < repeat; ++i) {
      this.y -= SPACING.subHeader.gapY;
    }
  }

  get cursor() {
    return { x: this.x, y: this.y };
  }

  set cursor(cursor: { x: number; y: number }) {
    this.x = cursor.x;
    this.y = cursor.y;
  }

  async save(filename: string) {
    const pdfBytes = await this.doc.save();
    return fs.writeFile(filename, pdfBytes);
  }
}
