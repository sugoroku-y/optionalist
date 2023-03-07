import { AsymmetricMatcher } from 'expect/build/asymmetricMatchers';

export class OneOf<T> extends AsymmetricMatcher<readonly T[]> {
  constructor(them: readonly [T, T, ...T[]], inverse?: true) {
    if (them.length < 2) {
      throw new TypeError(`oneOf() expects the array of 2 or more length.`);
    }
    super(them);
    this.inverse = inverse;
  }
  asymmetricMatch(other: T) {
    return this.sample.some(e => e === other);
  }
  toString() {
    return `${this.inverse ? 'No' : 'O'}neOfThem ${this.sample.join(', ')}`;
  }
  getExpectedType() {
    return typeof this.sample[0];
  }
  toAsymmetricMatcher(): string {
    return `${this.inverse ? 'No' : 'O'}ne of ${this.sample
      .slice(0, -1)
      .join(', ')} or ${this.sample.at(-1)}`;
  }
}

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      oneOf<T>(...them: [T, T, ...T[]]): unknown;
      noneOf<T>(...them: [T, T, ...T[]]): unknown;
    }
  }
}

expect.oneOf = <T>(...them: [T, T, ...T[]]) => new OneOf(them);
expect.noneOf = <T>(...them: [T, T, ...T[]]) => new OneOf(them, true);
