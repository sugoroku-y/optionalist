export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      oneOf<T>(...them: [T, T, ...T[]]): unknown;
    }
    interface InverseAsymmetricMatchers {
      oneOf<T>(...them: [T, T, ...T[]]): unknown;
    }
  }
}

expect.extend({
  oneOf: function oneOf<T>(
    this: jest.MatcherContext,
    received: unknown,
    ...sample: [T, T, ...T[]]
  ): jest.CustomMatcherResult {
    if ('promise' in this) {
      throw new TypeError(
        'This is CustomAsymmetricMatcher, but called as CustomMatcher',
      );
    }
    return {
      pass: sample.some(e => this.equals(e, received)),
      message: () => '',
    };
  },
});
