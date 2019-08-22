import { createReadStream, stat } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import { PathHandler } from './types';

const statP = promisify(stat);

const getPath = async (path_: string): Promise<string> => {
  try {
    const result = await statP(path_);

    if (result.isFile()) {
      return path_;
    }

    if (result.isDirectory()) {
      return getPath(join(path_, 'index.html'));
    }
  } catch (_) {}

  return '';
};

export function electronStatic(rootDir: string): PathHandler {
  return async function(req, res, next) {
    const filePath = join(rootDir, req.url);
    const resolvedPath = await getPath(filePath);

    if (resolvedPath) {
      const stream = createReadStream(resolvedPath);
      res.type(resolvedPath).send(stream);
    } else {
      next();
    }
  };
}
