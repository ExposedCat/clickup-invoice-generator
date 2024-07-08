import fsp from 'fs/promises';

export async function readOrCreateNextID() {
  const nextIdPath = './.iid';

  let id = 1;
  try {
    const rawId = await fsp.readFile(nextIdPath, 'utf-8');
    id = parseInt(rawId);
  } catch {
    // ignore
  }

  await fsp.writeFile(nextIdPath, `${id + 1}`, 'utf-8');

  return id + 1;
}
