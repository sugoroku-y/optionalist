import 'jest-to-match-sample-code';

describe('sample code', () => {
  test('README.md', () => {
    expect('../README.md' as const).toMatchSampleCode();
  });
});
