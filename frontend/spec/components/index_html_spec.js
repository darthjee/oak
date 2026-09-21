import { existsSync, readFileSync } from 'node:fs';

describe('frontend index.html', function() {
  it('references the generated favicon asset', function() {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is a literal, import.meta.url-relative string that ESLint's static analysis can't resolve through new URL(literal, import.meta.url), never derived from external/user input
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

    expect(html).toContain('<link rel="icon" type="image/png" href="/assets/images/favicon.png">');
    expect(existsSync(new URL('../../assets/images/favicon.png', import.meta.url))).toBeTrue();
  });
});
