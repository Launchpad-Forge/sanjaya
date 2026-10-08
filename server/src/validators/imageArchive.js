import { unzipSync } from 'fflate';
const MAX_TOTAL = 80 * 1024 * 1024;
const fail = message => Object.assign(new Error(message), { status: 400 });

export function decodeImageArchive(bytes) {
  let count = 0, total = 0;
  let files;
  try {
    files = unzipSync(bytes, { filter(file) {
      if (!/^\d{3}\.(jpg|jpeg|png|webp)$/i.test(file.name)) throw fail('Upload an ordered set of JPG, PNG, or WebP photos.');
      count++; total += file.originalSize;
      if (count > 96 || file.originalSize > 10 * 1024 * 1024 || total > MAX_TOTAL) throw fail('Use at most 96 photos, 10 MB per photo, and 80 MB total.');
      return true;
    } });
  } catch (error) { throw error.status ? error : fail('The photo upload could not be read. Please select the photos again.'); }
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length < 3) throw fail('Choose at least 3 overlapping photos of the same space.');
  return entries.map(([name, data]) => {
    const b = Buffer.from(data);
    const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const png = b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp = b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
    const mime = /\.jpe?g$/i.test(name) && jpeg ? 'image/jpeg' : /\.png$/i.test(name) && png ? 'image/png' : /\.webp$/i.test(name) && webp ? 'image/webp' : null;
    if (!mime) throw fail('One of the selected files is not a supported image.');
    return { name, data: b, mime };
  });
}
