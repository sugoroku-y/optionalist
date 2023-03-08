import { AsymmetricMatcher } from 'expect';
import { equals } from '@jest/expect-utils';

export class OneOf<T> extends AsymmetricMatcher<readonly T[]> {
  constructor(sample: readonly [T, T, ...T[]], inverse = false) {
    if (sample.length < 2) {
      throw new TypeError(`oneOf() expects the array of 2 or more length.`);
    }
    super(sample, inverse);
  }
  asymmetricMatch(other: T) {
    return !this.inverse === this.sample.some(e => equals(e, other));
  }
  toString() {
    return `${this.inverse ? 'not.' : ''}OneOf ${this.sample.join(', ')}`;
  }
  getExpectedType() {
    return typeof this.sample[0];
  }
  toAsymmetricMatcher(): string {
    return `${this.inverse ? 'No' : 'O'}ne of ${this.sample
      .slice(0, -1)
      .map(e => JSON.stringify(e))
      .join(', ')} or ${JSON.stringify(this.sample.at(-1))}`;
  }
}

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

expect.oneOf = <T>(...sample: [T, T, ...T[]]) => new OneOf(sample);
expect.not.oneOf = <T>(...sample: [T, T, ...T[]]) => new OneOf(sample, true);
