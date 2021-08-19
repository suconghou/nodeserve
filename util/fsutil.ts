import * as fs from 'fs';
import { promisify } from 'util';

export const fsStat = promisify(fs.stat);
