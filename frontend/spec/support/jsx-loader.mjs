import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const STYLE_EXTENSIONS = ['.css', '.scss', '.sass', '.less'];
const STUB_PATTERNS = [/bootstrap\/dist\/js\//];

/**
 * Resolves extensionless local imports by probing for .jsx then .js variants.
 *
 * @param {string} specifier module specifier
 * @param {{parentURL?: string}} context loader context
 * @param {Function} defaultResolve default resolve hook
 * @returns {Promise<{url: string, shortCircuit: boolean}|ReturnType<defaultResolve>>} resolved module URL
 */
export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier) && context.parentURL) {
    const base = new URL(specifier, context.parentURL);
    const candidates = [`${base.href}.jsx`, `${base.href}.js`];

    for (const candidate of candidates) {
      if (existsSync(fileURLToPath(candidate))) {
        return { url: candidate, shortCircuit: true };
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

/**
 * Loads and transforms .jsx files; returns an empty module for CSS/SCSS and stubbed JS imports.
 *
 * @param {string} url resolved module URL
 * @param {Object} context loader context
 * @param {Function} defaultLoad default load hook
 * @returns {Promise<{format: string, source: string, shortCircuit: boolean}|ReturnType<defaultLoad>>} module source
 */
export async function load(url, context, defaultLoad) {
  const isStyle = STYLE_EXTENSIONS.some((ext) => url.endsWith(ext));
  const isStub = STUB_PATTERNS.some((pattern) => pattern.test(url));

  if (isStyle || isStub) {
    return { format: 'module', source: '', shortCircuit: true };
  }

  if (!url.endsWith('.jsx')) {
    return defaultLoad(url, context, defaultLoad);
  }

  const source = await readFile(new URL(url), 'utf8');
  const result = await transform(source, {
    loader: 'jsx',
    format: 'esm',
    sourcemap: 'inline',
  });

  return {
    format: 'module',
    source: result.code,
    shortCircuit: true,
  };
}
