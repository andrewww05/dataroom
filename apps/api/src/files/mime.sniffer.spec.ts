import { sniffMimeType } from './mime.sniffer';

describe('sniffMimeType', () => {
  it('rejects a zero-byte buffer', () => {
    expect(sniffMimeType(Buffer.alloc(0))).toBeNull();
  });

  it('rejects SVG (BR-040)', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    // Even if named .svg, it's text but not in our allowed text list.
    expect(sniffMimeType(svg, 'file.svg')).toBeNull();
  });

  it('rejects an executable', () => {
    const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ header
    expect(sniffMimeType(exe, 'file.exe')).toBeNull();
  });

  it('rejects a mislabelled PNG (claims .png but is text)', () => {
    const fakePng = Buffer.from('this is just text');
    expect(sniffMimeType(fakePng, 'file.png')).toBeNull();
  });

  describe('magic bytes', () => {
    it('detects PDF', () => {
      const pdf = Buffer.from('%PDF-1.4\n...');
      expect(sniffMimeType(pdf, 'file.pdf')).toBe('application/pdf');
    });

    it('detects PNG', () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
      expect(sniffMimeType(png)).toBe('image/png');
    });

    it('detects JPEG', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(sniffMimeType(jpeg)).toBe('image/jpeg');
    });

    it('detects GIF', () => {
      const gif = Buffer.from('GIF89a...');
      expect(sniffMimeType(gif)).toBe('image/gif');
    });

    it('detects WebP', () => {
      const webp = Buffer.alloc(16);
      webp.write('RIFF', 0);
      webp.write('WEBP', 8);
      expect(sniffMimeType(webp)).toBe('image/webp');
    });

    it('detects legacy OLE2 formats by extension', () => {
      const ole2 = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00]);
      expect(sniffMimeType(ole2, 'file.doc')).toBe('application/msword');
      expect(sniffMimeType(ole2, 'file.xls')).toBe('application/vnd.ms-excel');
      expect(sniffMimeType(ole2, 'file.ppt')).toBe('application/vnd.ms-powerpoint');
      expect(sniffMimeType(ole2, 'file.unknown')).toBeNull();
    });
  });

  describe('ZIP containers', () => {
    const createZip = (content: string) => {
      const buf = Buffer.alloc(200);
      buf[0] = 0x50; buf[1] = 0x4b; buf[2] = 0x03; buf[3] = 0x04; // PK\x03\x04
      buf.write(content, 4);
      return buf;
    };

    it('detects OpenDocument Text', () => {
      const odt = createZip('mimetypeapplication/vnd.oasis.opendocument.text');
      expect(sniffMimeType(odt)).toBe('application/vnd.oasis.opendocument.text');
    });

    it('detects OpenDocument Spreadsheet', () => {
      const ods = createZip('mimetypeapplication/vnd.oasis.opendocument.spreadsheet');
      expect(sniffMimeType(ods)).toBe('application/vnd.oasis.opendocument.spreadsheet');
    });

    it('detects OpenDocument Presentation', () => {
      const odp = createZip('mimetypeapplication/vnd.oasis.opendocument.presentation');
      expect(sniffMimeType(odp)).toBe('application/vnd.oasis.opendocument.presentation');
    });

    it('detects OOXML Word', () => {
      const docx = createZip('some random bytes word/document.xml');
      expect(sniffMimeType(docx)).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('detects OOXML Excel', () => {
      const xlsx = createZip('some random bytes xl/workbook.xml');
      expect(sniffMimeType(xlsx)).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('detects OOXML PowerPoint', () => {
      const pptx = createZip('some random bytes ppt/presentation.xml');
      expect(sniffMimeType(pptx)).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    });
  });

  describe('UTF-8 text', () => {
    it('detects CSV by extension', () => {
      const csv = Buffer.from('a,b,c\n1,2,3');
      expect(sniffMimeType(csv, 'file.csv')).toBe('text/csv');
    });

    it('detects Markdown by extension', () => {
      const md = Buffer.from('# Hello\n\nThis is markdown.');
      expect(sniffMimeType(md, 'file.md')).toBe('text/markdown');
      expect(sniffMimeType(md, 'file.markdown')).toBe('text/markdown');
    });

    it('detects text/plain by extension', () => {
      const txt = Buffer.from('Hello world');
      expect(sniffMimeType(txt, 'file.txt')).toBe('text/plain');
      expect(sniffMimeType(txt)).toBeNull();
    });
  });
});
