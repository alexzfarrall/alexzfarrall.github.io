import { afterEach, describe, expect, it, vi } from 'vitest';
import { clampText, formatBytes, hasDetails, isPdfPath, linkLabel, normalisePdf, projectHref } from '../../src/lib/details';

describe('normalisePdf (never fails the build)', () => {
  afterEach(() => vi.restoreAllMocks());
  it('keeps good paths and adds a missing leading slash', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalisePdf('/files/a.pdf')).toBe('/files/a.pdf');
    expect(normalisePdf(' files/a.pdf ')).toBe('/files/a.pdf');
    expect(normalisePdf('')).toBeUndefined();
    expect(normalisePdf(null)).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });
  it('drops anything else with a warning instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const bad of ['https://example.com/a.pdf', '/uploads/a.pdf', '/files/a.docx', '/files/../a.pdf', 42]) {
      expect(normalisePdf(bad)).toBeUndefined();
    }
    expect(warn).toHaveBeenCalledTimes(5);
  });
});

describe('clampText', () => {
  afterEach(() => vi.restoreAllMocks());
  it('leaves short text alone and treats blank as none', () => {
    expect(clampText(' Hello ', 10)).toBe('Hello');
    expect(clampText('   ', 10)).toBeUndefined();
    expect(clampText(null, 10)).toBeUndefined();
  });
  it('cuts long text at the limit with an ellipsis and a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = clampText('abcdefghij klmnop', 10) as string;
    expect(out).toBe('abcdefghi…');
    expect(out.length).toBe(10);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('hasDetails', () => {
  it('is false for an item with nothing extra', () => {
    expect(hasDetails({})).toBe(false);
    expect(hasDetails({ summary: '   ', gallery: [], results: [' '], pdf: '' })).toBe(false);
  });
  it('is true for a summary, a result, a resolvable photo or an existing PDF', () => {
    expect(hasDetails({ summary: 'Built a thing.' })).toBe(true);
    expect(hasDetails({ results: ['Won'] })).toBe(true);
    expect(hasDetails({ gallery: ['/uploads/a.jpg'] })).toBe(true);
    expect(hasDetails({ pdf: '/files/a.pdf' })).toBe(true);
  });
  it('ignores missing photos and PDFs', () => {
    const none = { image: () => false, file: () => false };
    expect(hasDetails({ gallery: ['/uploads/missing.jpg'] }, none)).toBe(false);
    expect(hasDetails({ pdf: '/files/missing.pdf' }, none)).toBe(false);
    expect(hasDetails({ gallery: ['/uploads/missing.jpg'], results: ['Won'] }, none)).toBe(true);
    expect(hasDetails({ gallery: ['/uploads/a.jpg', '/uploads/b.jpg'] }, { image: (p) => p.endsWith('b.jpg') })).toBe(true);
  });
});

describe('linkLabel', () => {
  it('defaults by type', () => {
    expect(linkLabel({ status: 'Paper' })).toBe('Read the paper');
    expect(linkLabel({ status: 'Project' })).toBe('Visit project');
    expect(linkLabel({ status: 'Supervised', linkLabel: '  ' })).toBe('Visit project');
  });
  it('uses the owner text when given', () => {
    expect(linkLabel({ status: 'Project', linkLabel: ' Read the BBC story ' })).toBe('Read the BBC story');
  });
});

describe('formatBytes, isPdfPath, projectHref', () => {
  it('formats sizes', () => {
    expect(formatBytes(300)).toBe('1 KB');
    expect(formatBytes(640 * 1024)).toBe('640 KB');
    expect(formatBytes(1.2 * 1024 * 1024)).toBe('1.2 MB');
  });
  it('accepts only /files/*.pdf', () => {
    expect(isPdfPath('/files/overview.pdf')).toBe(true);
    expect(isPdfPath('/files/Overview.PDF')).toBe(true);
    expect(isPdfPath('/uploads/overview.pdf')).toBe(false);
    expect(isPdfPath('/files/overview.docx')).toBe(false);
    expect(isPdfPath('/files/../secret.pdf')).toBe(false);
  });
  it('builds the project URL', () => {
    expect(projectHref('phobac')).toBe('/projects/phobac/');
  });
});
