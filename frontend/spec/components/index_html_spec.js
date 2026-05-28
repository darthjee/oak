import { existsSync, readFileSync } from 'node:fs';

describe('frontend index.html', function() {
  it('references the generated favicon asset', function() {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

    expect(html).toContain('<link rel="icon" type="image/png" href="/assets/images/favicon.png">');
    expect(existsSync(new URL('../../assets/images/favicon.png', import.meta.url))).toBeTrue();
  });
});
