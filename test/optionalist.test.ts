import { assertToBeDefined, assertToBeUndefined } from 'jest-asserts';
import 'jest-to-exit-process';
import 'jest-to-equal-type';
import { parse, unnamed, helpString, DescribedType } from '../src';
import { name as packageName, version } from './package.json';

const OPTMAP = {
  [helpString]: {
    describe: `
    UnitTest for optionalist.
      test for indent
    `,
  },
  alpha: {},
  bravo: {
    type: 'number',
    default: 1,
    describe: 'b value',
    example: 'b-value',
    alias: 'b',
  },
  charlie: {
    type: 'boolean',
    alone: true,
    alias: ['charr', 'c'],
    describe: `
    `,
  },
  delta: {
    required: true,
  },
  echo: {
    alone: true,
  },
  foxtrot: {
    default: 'racoondog',
  },
  golf: {
    constraints: ['volkswagen', 'sports'],
  },
  hotel: {
    type: 'number',
    constraints: [1234, 5678, 9012],
  },
  india: {
    type: 'number',
    constraints: {
      min: 1000,
      max: 9999,
    },
  },
  GOLF: {
    constraints: ['volkswagen', 'sports'],
    ignoreCase: true,
  },
  [unnamed]: {
    example: 'argument',
    describe: 'arguments for command',
  },
} as const;

test('optionalist normal', () => {
  const options = parse(OPTMAP, ['--delta', 'test']);
  expect(options).toEqual({
    delta: 'test',
    bravo: 1,
    foxtrot: 'racoondog',
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist normal', () => {
  const options = parse(OPTMAP, ['--alpha', 'bet', '--delta', 'test']);
  expect(options).toEqual({
    alpha: 'bet',
    delta: 'test',
    foxtrot: 'racoondog',
    bravo: 1,
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist normal', () => {
  const options = parse(OPTMAP, [
    '--alpha',
    'bet',
    '--bravo',
    '2',
    '--delta',
    'test',
  ]);
  expect(options).toEqual({
    alpha: 'bet',
    delta: 'test',
    foxtrot: 'racoondog',
    bravo: 2,
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist alone', () => {
  const options = parse(OPTMAP, ['--charlie']);
  expect(options).toEqual({ charlie: true });
  expect(options[unnamed]).toBeUndefined();
});
test('optionalist alone', () => {
  const options = parse(OPTMAP, ['--echo', 'string']);
  expect(options).toEqual({
    echo: 'string',
  });
  expect(options[unnamed]).toBeUndefined();
});
test('optionalist unnamed', () => {
  const options = parse(OPTMAP, ['--delta', 'test', 'aaa', 'bbb', 'ccc']);
  expect(options).toEqual({
    bravo: 1,
    delta: 'test',
    foxtrot: 'racoondog',
  });
  expect(options[unnamed]).toEqual(['aaa', 'bbb', 'ccc']);
});
test('optionalist unnamed', () => {
  const options = parse(OPTMAP, [
    '--delta',
    'test',
    '--',
    '--aaa',
    '-bbb',
    '-ccc',
  ]);
  expect(options).toEqual({
    bravo: 1,
    delta: 'test',
    foxtrot: 'racoondog',
  });
  expect(options[unnamed]).toEqual(['--aaa', '-bbb', '-ccc']);
});
test('optionalist string default optMap', () => {
  expect(parse({ aaa: { default: 'aaa' } }, []).aaa).toBe('aaa');
});
test('optionalist number default optMap', () => {
  expect(parse({ aaa: { type: 'number', default: 123 } }, []).aaa).toBe(123);
});
test('optionalist string default literal', () => {
  expect(parse({ aaa: 'aaa' }, []).aaa).toBe('aaa');
});
test('optionalist number default literal', () => {
  expect(parse({ aaa: 123 }, []).aaa).toBe(123);
});
test('optionalist string default optMap falsy', () => {
  expect(parse({ aaa: { default: '' } }, []).aaa).toBe('');
});
test('optionalist number default optMap falsy', () => {
  expect(parse({ aaa: { type: 'number', default: 0 } }, []).aaa).toBe(0);
});
test('optionalist string default literal falsy', () => {
  expect(parse({ aaa: '' }, []).aaa).toBe('');
});
test('optionalist number default literal falsy', () => {
  expect(parse({ aaa: 0 }, []).aaa).toBe(0);
});
test('optionalist string constraints', () => {
  const options = parse(OPTMAP, [
    '--delta',
    'required',
    '--golf',
    'volkswagen',
  ]);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    golf: 'volkswagen',
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist string constraints', () => {
  const options = parse(OPTMAP, ['--delta', 'required', '--golf', 'sports']);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    golf: 'sports',
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist string constraints', () => {
  const options = parse(OPTMAP, [
    '--delta',
    'required',
    '--GOLF',
    'VOLKSWAGEN',
  ]);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    GOLF: 'volkswagen',
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist string constraints', () => {
  const options = parse(OPTMAP, ['--delta', 'required', '--GOLF', 'SPORTS']);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    GOLF: 'sports',
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist number constraints', () => {
  const options = parse(OPTMAP, ['--delta', 'required', '--hotel', '1234']);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    hotel: 1234,
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist number constraints', () => {
  const options = parse(OPTMAP, ['--delta', 'required', '--hotel', '5678']);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    hotel: 5678,
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist number constraints', () => {
  const options = parse(OPTMAP, ['--delta', 'required', '--hotel', '9012']);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    hotel: 9012,
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist number range constraints', () => {
  const options = parse(OPTMAP, ['--delta', 'required', '--india', '1000']);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    india: 1000,
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist number range constraints', () => {
  const options = parse(OPTMAP, ['--delta', 'required', '--india', '9999']);
  expect(options).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    india: 9999,
  });
  expect(options[unnamed]).toEqual([]);
});
test('optionalist boolean multiple: no constraints', () => {
  const opt = { aaa: { type: 'boolean', multiple: true } } as const;
  for (let count = 0; count < 1000; ++count) {
    expect(parse(opt, Array(count).fill('--aaa')).aaa).toBe(count);
  }
});
test('optionalist boolean multiple: constraints.max: 2', () => {
  const opt = {
    aaa: { type: 'boolean', multiple: true, constraints: { max: 2 } },
  } as const;
  for (let count = 0; count <= opt.aaa.constraints.max; ++count) {
    expect(parse(opt, Array(count).fill('--aaa')).aaa).toBe(count);
  }
  expect(() =>
    parse(opt, Array(opt.aaa.constraints.max + 1).fill('--aaa')),
  ).toThrow('Exceeded max count(2): --aaa');
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, [])).toThrow('--delta required');
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, ['--unknown'])).toThrow(
    'unknown options: --unknown',
  );
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, ['--alpha'])).toThrow('--alpha needs a parameter');
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, ['--bravo'])).toThrow(
    '--bravo needs a number parameter as the b-value',
  );
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, ['--bravo', 'abc'])).toThrow(
    '--bravo needs a number parameter as the b-value: abc',
  );
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, ['--bravo', 'abc', '--charlie'])).toThrow(
    '--bravo needs a number parameter as the b-value: abc',
  );
});
test('optionalist usage error x', () => {
  expect(() => parse(OPTMAP, ['--charlie', '111'])).toThrow(
    '--charlie must be specified alone.',
  );
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, ['--charlie', '--', '-111'])).toThrow(
    '--charlie must be specified alone.',
  );
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, ['--alpha', 'beta', '--charlie'])).toThrow(
    '--charlie must be specified alone.',
  );
});
test('optionalist usage error', () => {
  expect(() =>
    parse(OPTMAP, ['--delta', 'required', '--golf', 'german']),
  ).toThrow('--golf must be one of volkswagen, sports');
});
test('optionalist usage error', () => {
  expect(() =>
    parse(OPTMAP, ['--delta', 'required', '--golf', 'SPORTS']),
  ).toThrow('--golf must be one of volkswagen, sports');
});
test('optionalist usage error', () => {
  expect(() => parse(OPTMAP, ['--delta', 'required', '--hotel', '0'])).toThrow(
    '--hotel must be one of 1234, 5678, 9012.',
  );
});
test('optionalist usage error', () => {
  expect(() =>
    parse(OPTMAP, ['--delta', 'required', '--india', '999']),
  ).toThrow('--india must be greater than or equal to 1000.');
});
test('optionalist usage error', () => {
  expect(() =>
    parse(OPTMAP, ['--delta', 'required', '--india', '10000']),
  ).toThrow('--india must be less than or equal to 9999.');
});
test('optionalist usage error', () => {
  expect(() => parse({ [unnamed]: { min: 2, max: 3 } }, ['111'])).toThrow(
    'At least 2 unnamed_parameters required.',
  );
  expect(() =>
    parse({ [unnamed]: { min: 2, max: 3, example: 'ppp' } }, ['111']),
  ).toThrow('At least 2 ppp required.');
});
test('optionalist usage error', () => {
  expect(() =>
    parse({ [unnamed]: { min: 2, max: 3 } }, ['111', '222', '333', '444']),
  ).toThrow('Too many unnamed_parameters specified(up to 3).');
  expect(() =>
    parse({ [unnamed]: { min: 2, max: 3, example: 'ppp' } }, [
      '111',
      '222',
      '333',
      '444',
    ]),
  ).toThrow('Too many ppp specified(up to 3).');
});

test('optionalist invalid optMap', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    parse({ a: { default: 1 } }, ['-a', '2']),
  ).toThrow();
});
test('optionalist invalid optMap', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    parse({ a: { type: 'boolean', default: 1 } }, ['-a', '2']),
  ).toThrow();
});
test('optionalist invalid optMap', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    parse({ a: { type: 'boolean', required: true } }, ['-a', '2']),
  ).toThrow();
});
test('optionalist invalid optMap', () => {
  expect(() =>
    parse(
      // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
      { a: { type: 'number', default: '1' } },
      ['-a', '2'],
    ),
  ).toThrow();
});
test('optionalist invalid optMap: type: unknown', () => {
  // @ts-expect-error 例外を発生させるためエラーになるtypeを指定
  expect(() => parse({ a: { type: 'unknown' } })).toThrow();
});
test('optionalist helpstring', () => {
  expect(parse(OPTMAP, ['--charlie'])[helpString])
    .toBe(`Version: ${packageName} ${version}
Usage:
  node ${packageName} --delta parameter [--alpha parameter] [--bravo b-value] [--foxtrot parameter] [--golf parameter] [--hotel parameter] [--india parameter] [--GOLF parameter] [--] [argument...]
  node ${packageName} --charlie
  node ${packageName} --echo parameter

Description:
  UnitTest for optionalist.
    test for indent

Options:
  --alpha parameter
  --bravo, -b b-value
    b value
  --charlie, --charr, -c
  --delta parameter
  --echo parameter
  --foxtrot parameter
  --golf parameter
  --hotel parameter
  --india parameter
  --GOLF parameter
  [--] [argument...]
    arguments for command
`);
});
test('process.argv', () => {
  let saved;
  [saved, process.argv] = [process.argv, ['abc', 'def', 'ghi']];
  try {
    const x = parse({ a: {}, b: {}, c: {} });
    expect(x[unnamed]).toEqual(['ghi']);
  } finally {
    process.argv = saved;
  }
});
test('never', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    parse({ a: { type: 'unknown', default: 1 } }, []),
  ).toThrow();
});

/**
 * procを実行中に、streamへ出力された内容を文字列として返す。
 *
 * procが非同期の場合は、非同期で返す。
 *
 * @param {NodeJS.WriteStream} stream
 * @param {() => Promise<unknown>} proc
 * @returns {Promise<string>}
 */
function stream(
  stream: NodeJS.WriteStream,
  proc: () => Promise<unknown>,
): Promise<string>;
/**
 * procを実行中に、streamへ出力された内容を文字列として返す。
 *
 * procが非同期の場合は、非同期で返す。
 *
 * @param {NodeJS.WriteStream} stream
 * @param {() => Promise<unknown>} proc
 * @returns {Promise<string>}
 */
function stream(stream: NodeJS.WriteStream, proc: () => unknown): string;
// 実装
function stream(
  stream: NodeJS.WriteStream,
  proc: () => unknown,
): string | Promise<string> {
  // 出力バッファ
  let buffer = Buffer.of();
  // モック
  const mock = jest.spyOn(stream, 'write').mockImplementation(str => {
    // 書き込みをバッファに溜めていく
    buffer = Buffer.concat([buffer, Buffer.from(str)]);
    return true;
  });
  // モックを元に戻すかどうか
  let restorable = true;
  try {
    const result = proc();
    if (result instanceof Promise) {
      // 非同期実行するためにこの関数内ではモックを元に戻さない
      restorable = false;
      return (async () => {
        try {
          await result;
          // バッファの内容を返す
          return buffer.toString('utf8');
        } finally {
          // こちらでは問答無用で元に戻す
          mock.mockRestore();
        }
      })();
    }
    // バッファの内容を返す
    return buffer.toString('utf8');
  } finally {
    // 非同期実行を開始する場合は元に戻さない
    if (restorable) {
      mock.mockRestore();
    }
  }
}

test('showUsageOnError', () => {
  expect(
    stream(process.stderr, () => {
      expect(() => {
        parse(
          {
            [helpString]: {
              showUsageOnError: true,
            },
            aaa: {
              describe: 'test',
              required: true,
            },
            [unnamed]: {
              min: 0,
              max: Infinity,
            },
          },
          [],
        );
      }).toExitProcess(1);
    }),
  ).toBe(`--aaa required

Version: ${packageName} ${version}
Usage:
  node ${packageName} --aaa parameter [--] [unnamed_parameters...]

Options:
  --aaa parameter
    test
  [--] [unnamed_parameters...]
`);
});
test('helpString', () => {
  expect(parse({ a: {} }, [])[helpString])
    .toBe(`Version: ${packageName} ${version}
Usage:
  node ${packageName} [-a parameter]

Options:
  -a parameter
`);
});

test('min only', () => {
  expect(
    parse({ a: { type: 'number', constraints: { min: 10 } } }, ['-a', '10']),
  ).toEqual({ a: 10 });
});
test('max only', () => {
  expect(
    parse({ a: { type: 'number', constraints: { max: 10 } } }, ['-a', '10']),
  ).toEqual({ a: 10 });
});

test('multiple empty', () => {
  const options = parse({ a: { multiple: true } }, []);
  expect(options).toEqual({
    a: [],
  });
});
test('multiple string', () => {
  expect(
    parse({ a: { multiple: true } }, ['-a', 'abc', '-a', 'def', '-a', 'ghi']),
  ).toEqual({ a: ['abc', 'def', 'ghi'] });
});

test('multiple number', () => {
  expect(
    parse({ a: { type: 'number', multiple: true } }, [
      '-a',
      '10',
      '-a',
      '20',
      '-a',
      '30',
    ]),
  ).toEqual({ a: [10, 20, 30] });
});
test('duplicate string', () => {
  expect(() => parse({ a: {} }, ['-a', 'abc', '-a', 'def'])).toThrow(
    'Duplicate -a: abc, def',
  );
});

test('duplicate number', () => {
  expect(() =>
    parse({ a: { type: 'number' } }, ['-a', '10', '-a', '20']),
  ).toThrow('Duplicate -a: 10, 20');
});

test('duplicate flag', () => {
  expect(() => parse({ a: { type: 'boolean' } }, ['-a', '-a'])).toThrow(
    'Duplicate -a',
  );
});

test('invalid optMap', () => {
  expect(() => parse({ '': {} })).toThrow('empty option name');
  expect(() => parse({ '-': {} })).toThrow('Invalid option name: -');
});

test('pattern constraints', () => {
  expect(parse({ a: { constraints: /^\w+=/ } }, ['-a', 'aaabbb=']).a).toBe(
    'aaabbb=',
  );
  expect(
    () => parse({ a: { constraints: /^\w+=/ } }, ['-a', 'aaabbb']).a,
  ).toThrow('-a does not match /^\\w+=/.: aaabbb');
});
test('string constraints array caseSensitive', () => {
  const opt = {
    aaa: { constraints: ['aaa', 'bbb', 'ccc'] },
  } as const;
  expect(parse(opt, ['--aaa', 'aaa']).aaa).toBe('aaa');
  expect(parse(opt, ['--aaa', 'bbb']).aaa).toBe('bbb');
  expect(parse(opt, ['--aaa', 'ccc']).aaa).toBe('ccc');
  expect(() => parse(opt, ['--aaa', 'AAA'])).toThrow(
    '--aaa must be one of aaa, bbb, ccc.: AAA',
  );
});
test('string constraints array ignoreCase', () => {
  const opt = {
    aaa: { constraints: ['aaa', 'bbb', 'ccc'], ignoreCase: true },
  } as const;
  expect(parse(opt, ['--aaa', 'aaa']).aaa).toBe('aaa');
  expect(parse(opt, ['--aaa', 'BBB']).aaa).toBe('bbb');
  expect(parse(opt, ['--aaa', 'CcC']).aaa).toBe('ccc');
  expect(() => parse(opt, ['--aaa', 'ddd'])).toThrow(
    '--aaa must be one of aaa, bbb, ccc.: ddd',
  );
});

test('number constraints array', () => {
  const opt = {
    aaa: { type: 'number', constraints: [1, 3, 5] },
  } as const;
  expect(parse(opt, ['--aaa', '1']).aaa).toBe(1);
  expect(parse(opt, ['--aaa', '3']).aaa).toBe(3);
  expect(parse(opt, ['--aaa', '5']).aaa).toBe(5);
  expect(() => parse(opt, ['--aaa', '2'])).toThrow(
    '--aaa must be one of 1, 3, 5.: 2',
  );
});
test('number constraints array & autoAdjust', () => {
  const opt = {
    aaa: { type: 'number', constraints: [1, 3, 5], autoAdjust: true },
  } as const;
  expect(parse(opt, ['--aaa', '1']).aaa).toBe(1);
  expect(parse(opt, ['--aaa', '3']).aaa).toBe(3);
  expect(parse(opt, ['--aaa', '5']).aaa).toBe(5);
  expect(parse(opt, ['--aaa', '0']).aaa).toBe(1);
  expect(parse(opt, ['--aaa', '2']).aaa).toBe(1);
  expect(parse(opt, ['--aaa', '4']).aaa).toBe(3);
  expect(parse(opt, ['--aaa', '6']).aaa).toBe(5);
});

test('min', () => {
  const opt = {
    a: { type: 'number', constraints: { min: 1 } },
  } as const;
  expect(parse(opt, ['-a', '1']).a).toBe(1);
  expect(() => parse(opt, ['-a', '0.9']).a).toThrow(
    '-a must be greater than or equal to 1.: 0.9',
  );
});
test('minExclusive', () => {
  const opt = {
    a: { type: 'number', constraints: { minExclusive: 1 } },
  } as const;
  expect(parse(opt, ['-a', '1.1']).a).toBe(1.1);
  expect(() => parse(opt, ['-a', '1']).a).toThrow(
    '-a must be greater than 1.: 1',
  );
});

test('max', () => {
  const opt = {
    a: { type: 'number', constraints: { max: 10 } },
  } as const;
  expect(parse(opt, ['-a', '10']).a).toBe(10);
  expect(() => parse(opt, ['-a', '10.1']).a).toThrow(
    '-a must be less than or equal to 10.: 10.1',
  );
});

test('maxExclusive', () => {
  const opt = {
    a: { type: 'number', constraints: { maxExclusive: 10 } },
  } as const;
  expect(parse(opt, ['-a', '9.9']).a).toBe(9.9);
  expect(() => parse(opt, ['-a', '10']).a).toThrow(
    '-a must be less than 10.: 10',
  );
});
test('min & autoAdjust', () => {
  const opt = {
    a: { type: 'number', constraints: { min: 1 }, autoAdjust: true },
  } as const;
  expect(parse(opt, ['-a', '1']).a).toBe(1);
  expect(parse(opt, ['-a', '0.9']).a).toBe(1);
});
test('minExclusive & autoAdjust', () => {
  const opt = {
    a: { type: 'number', constraints: { minExclusive: 1 }, autoAdjust: true },
  } as const;
  expect(parse(opt, ['-a', '1.1']).a).toBe(1.1);
  expect(parse(opt, ['-a', '1']).a).toBeGreaterThan(1);
});

test('max & autoAdjust', () => {
  const opt = {
    a: { type: 'number', constraints: { max: 10 }, autoAdjust: true },
  } as const;
  expect(parse(opt, ['-a', '10']).a).toBe(10);
  expect(parse(opt, ['-a', '10.1']).a).toBe(10);
});

test('maxExclusive & autoAdjust', () => {
  const opt = {
    a: { type: 'number', constraints: { maxExclusive: 10 }, autoAdjust: true },
  } as const;
  expect(parse(opt, ['-a', '9.9']).a).toBe(9.9);
  expect(parse(opt, ['-a', '10']).a).toBeLessThan(10);
});
test('max&maxExclusive', () => {
  expect(() =>
    parse(
      // @ts-expect-error maxとmaxExclusiveは同時に指定できない
      { a: { type: 'number', constraints: { max: 11, maxExclusive: 10 } } },
      [],
    ),
  ).toThrow();
  expect(() =>
    parse(
      // @ts-expect-error minとminExclusiveは同時に指定できない
      { a: { type: 'number', constraints: { min: 11, minExclusive: 10 } } },
      [],
    ),
  ).toThrow();
  // @ts-expect-error min、minExclusive、max、maxExclusiveのどれも指定しないのはエラー
  expect(() => parse({ a: { type: 'number', constraints: {} } }, [])).toThrow();
});
describe('invalid constraints', () => {
  test('empty string constraints array', () => {
    // @ts-expect-error constraintsに空配列は指定できない
    expect(() => parse({ a: { constraints: [] } })).toThrow();
  });
  test('number array to string constraints', () => {
    // @ts-expect-error string型のconstraintsに数値の配列は指定できない
    expect(() => parse({ a: { constraints: [1] } })).toThrow();
  });
  test('string to string constraints', () => {
    // @ts-expect-error string型のconstraintsに数値の配列は指定できない
    expect(() => parse({ a: { constraints: '' } })).toThrow();
  });
  test('empty number constraints array', () => {
    // @ts-expect-error constraintsに空配列は指定できない
    expect(() => parse({ a: { type: 'number', constraints: [] } })).toThrow();
  });
  test('string array to number constraints', () => {
    // @ts-expect-error number型のconstraintsに文字列の配列は指定できない
    expect(() => parse({ a: { type: 'number', constraints: [''] } })).toThrow();
  });
  test('empty object to number constraints', () => {
    // @ts-expect-error number型のconstraintsにmin/max/minExclusive/maxExclusiveのどれも存在していないオブジェクトは指定できない
    expect(() => parse({ a: { type: 'number', constraints: {} } })).toThrow();
  });
  test('string to number constraints', () => {
    // @ts-expect-error number型のconstraintsにmin/max/minExclusive/maxExclusiveのどれも存在していないオブジェクトは指定できない
    expect(() => parse({ a: { type: 'number', constraints: '' } })).toThrow();
  });
  test('any constraits to boolean', () => {
    expect(() =>
      // @ts-expect-error boolean型のconstraintsには指定できない
      parse({ a: { type: 'boolean', constraints: true } }),
    ).toThrow();
  });
});

describe('type check Options', () => {
  // コンパイルエラーのチェック
  /**
   * | name  | type      | nature   | optional |
   * | :---- | :-------- | :------- | :------- |
   * | aaa   | (string)  | -        | true     |
   * | bbb   | (string)  | required | false    |
   * | ccc   | (string)  | default  | false    |
   * | ddd   | (string)  | alone    | -        |
   * | eee   | number    | -        | true     |
   * | fff   | number    | required | false    |
   * | ggg   | number    | default  | false    |
   * | hhh   | number    | alone    | -        |
   * | iii   | boolean   | -        | true     |
   * | jjj   | boolean   | alone    | -        |
   * | kkk   | string    | -        | true     |
   * | lll   | string    | required | false    |
   * | mmm   | string    | default  | false    |
   * | nnn   | string    | alone    | -        |
   * | ooo   | (string)  | multiple | false    |
   * | ppp   | number    | multiple | false    |
   * | qqq   | string    | multiple | false    |
   *
   * ※ booleanにはrequired/defaultを指定できない
   */
  const optMap = {
    aaa: { describe: 'aaa' },
    bbb: { describe: 'bbb', required: true },
    ccc: { describe: 'ccc', default: 'abc' },
    ddd: { describe: 'ddd', alone: true },
    eee: { describe: 'eee', type: 'number' },
    fff: { describe: 'fff', type: 'number', required: true },
    ggg: { describe: 'ggg', type: 'number', default: 1 },
    hhh: { describe: 'hhh', type: 'number', alone: true },
    iii: { describe: 'iii', type: 'boolean' },
    jjj: { describe: 'jjj', type: 'boolean', alone: true },
    kkk: { describe: 'kkk', type: 'string' },
    lll: { describe: 'lll', type: 'string', required: true },
    mmm: { describe: 'mmm', type: 'string', default: 'abc' },
    nnn: { describe: 'nnn', type: 'string', alone: true },
    ooo: { describe: 'ooo', multiple: true },
    ppp: { describe: 'ppp', type: 'number', multiple: true },
    qqq: { describe: 'qqq', type: 'string', multiple: true },
    rrr: 'rrr',
    sss: 123,
    ttt: true,
    uuu: {
      describe: 'uuu',
      multiple: true,
      constraints: ['uuu', 'vvv', 'www'],
    },
    vvv: {
      describe: 'vvv',
      multiple: true,
      constraints: /^[uvw]{3}$/,
    },
    www: {
      type: 'number',
      describe: 'www',
      multiple: true,
      constraints: [123, 456, 789],
    },
    xxx: {
      type: 'number',
      describe: 'xxx',
      multiple: true,
      constraints: {
        min: 10,
        maxExclusive: 100,
      },
    },
  } as const;
  test('alone (string)', () => {
    const options = parse(optMap, ['--ddd', 'ddd']);
    assertToBeDefined(options.ddd);
    // dddが有効な場合はdddとhelpStringだけ使える
    expect(options.ddd).toEqualType<
      DescribedType<
        string,
        ['--ddd parameter: ddd', 'must be specified alone.']
      >
    >();
    expect(options[helpString]).toEqualType<string>();
    // その他のオプションは使えない
    expect(options.aaa).toEqualType<undefined>();
    expect(options.bbb).toEqualType<undefined>();
    expect(options.ccc).toEqualType<undefined>();
    expect(options.eee).toEqualType<undefined>();
    expect(options.fff).toEqualType<undefined>();
    expect(options.ggg).toEqualType<undefined>();
    expect(options.hhh).toEqualType<undefined>();
    expect(options.iii).toEqualType<undefined>();
    expect(options.jjj).toEqualType<undefined>();
    expect(options.kkk).toEqualType<undefined>();
    expect(options.lll).toEqualType<undefined>();
    expect(options.mmm).toEqualType<undefined>();
    expect(options.nnn).toEqualType<undefined>();
    expect(options.ooo).toEqualType<undefined>();
    expect(options.ppp).toEqualType<undefined>();
    expect(options.qqq).toEqualType<undefined>();
    expect(options.rrr).toEqualType<undefined>();
    expect(options.sss).toEqualType<undefined>();
    expect(options.ttt).toEqualType<undefined>();
    expect(options.uuu).toEqualType<undefined>();
    expect(options.vvv).toEqualType<undefined>();
    expect(options.www).toEqualType<undefined>();
    expect(options.xxx).toEqualType<undefined>();
    expect(options[unnamed]).toEqualType<undefined>();
  });
  test('alone number', () => {
    const options = parse(optMap, ['--hhh', '0']);
    assertToBeDefined(options.hhh);
    // hhhが有効な場合はhhhとhelpStringだけ使える
    expect(options.hhh).toEqualType<
      DescribedType<
        number,
        ['--hhh parameter: hhh', 'must be specified alone.']
      >
    >();
    expect(options[helpString]).toEqualType<string>();
    // その他のオプションは使えない
    expect(options.aaa).toEqualType<undefined>();
    expect(options.bbb).toEqualType<undefined>();
    expect(options.ccc).toEqualType<undefined>();
    expect(options.ddd).toEqualType<undefined>();
    expect(options.eee).toEqualType<undefined>();
    expect(options.fff).toEqualType<undefined>();
    expect(options.ggg).toEqualType<undefined>();
    expect(options.iii).toEqualType<undefined>();
    expect(options.jjj).toEqualType<undefined>();
    expect(options.kkk).toEqualType<undefined>();
    expect(options.lll).toEqualType<undefined>();
    expect(options.mmm).toEqualType<undefined>();
    expect(options.nnn).toEqualType<undefined>();
    expect(options.ooo).toEqualType<undefined>();
    expect(options.ppp).toEqualType<undefined>();
    expect(options.qqq).toEqualType<undefined>();
    expect(options.rrr).toEqualType<undefined>();
    expect(options.sss).toEqualType<undefined>();
    expect(options.ttt).toEqualType<undefined>();
    expect(options.uuu).toEqualType<undefined>();
    expect(options.vvv).toEqualType<undefined>();
    expect(options.www).toEqualType<undefined>();
    expect(options.xxx).toEqualType<undefined>();
    expect(options[unnamed]).toEqualType<undefined>();
  });
  test('alone boolean', () => {
    const options = parse(optMap, ['--jjj']);
    assertToBeDefined(options.jjj);
    // jjjが有効な場合はjjjとhelpStringだけ使える
    expect(options.jjj).toEqualType<
      DescribedType<true, ['--jjj: jjj', 'must be specified alone.']>
    >();
    expect(options[helpString]).toEqualType<string>();
    // その他のオプションは使えない
    expect(options.aaa).toEqualType<undefined>();
    expect(options.bbb).toEqualType<undefined>();
    expect(options.ccc).toEqualType<undefined>();
    expect(options.ddd).toEqualType<undefined>();
    expect(options.eee).toEqualType<undefined>();
    expect(options.fff).toEqualType<undefined>();
    expect(options.ggg).toEqualType<undefined>();
    expect(options.hhh).toEqualType<undefined>();
    expect(options.iii).toEqualType<undefined>();
    expect(options.kkk).toEqualType<undefined>();
    expect(options.lll).toEqualType<undefined>();
    expect(options.mmm).toEqualType<undefined>();
    expect(options.nnn).toEqualType<undefined>();
    expect(options.ooo).toEqualType<undefined>();
    expect(options.ppp).toEqualType<undefined>();
    expect(options.qqq).toEqualType<undefined>();
    expect(options.rrr).toEqualType<undefined>();
    expect(options.sss).toEqualType<undefined>();
    expect(options.ttt).toEqualType<undefined>();
    expect(options.uuu).toEqualType<undefined>();
    expect(options.vvv).toEqualType<undefined>();
    expect(options.www).toEqualType<undefined>();
    expect(options.xxx).toEqualType<undefined>();
    expect(options[unnamed]).toEqualType<undefined>();
  });
  test('alone string', () => {
    const options = parse(optMap, ['--nnn', 'nnn']);
    assertToBeDefined(options.nnn);
    // nnnが有効な場合はnnnとhelpStringだけ使える
    expect(options.nnn).toEqualType<
      DescribedType<
        string,
        ['--nnn parameter: nnn', 'must be specified alone.']
      >
    >();
    expect(options[helpString]).toEqualType<string>();
    // その他のオプションは使えない
    expect(options.aaa).toEqualType<undefined>();
    expect(options.bbb).toEqualType<undefined>();
    expect(options.ccc).toEqualType<undefined>();
    expect(options.ddd).toEqualType<undefined>();
    expect(options.eee).toEqualType<undefined>();
    expect(options.fff).toEqualType<undefined>();
    expect(options.ggg).toEqualType<undefined>();
    expect(options.hhh).toEqualType<undefined>();
    expect(options.iii).toEqualType<undefined>();
    expect(options.jjj).toEqualType<undefined>();
    expect(options.kkk).toEqualType<undefined>();
    expect(options.lll).toEqualType<undefined>();
    expect(options.mmm).toEqualType<undefined>();
    expect(options.ooo).toEqualType<undefined>();
    expect(options.ppp).toEqualType<undefined>();
    expect(options.qqq).toEqualType<undefined>();
    expect(options.rrr).toEqualType<undefined>();
    expect(options.sss).toEqualType<undefined>();
    expect(options.ttt).toEqualType<undefined>();
    expect(options.uuu).toEqualType<undefined>();
    expect(options.vvv).toEqualType<undefined>();
    expect(options.www).toEqualType<undefined>();
    expect(options.xxx).toEqualType<undefined>();
    expect(options[unnamed]).toEqualType<undefined>();
  });
  test('not alone', () => {
    const options = parse(optMap, [
      '--bbb',
      'bbb',
      '--fff',
      '1',
      '--lll',
      'lll',
    ]);
    // aloneなオプションがどれも指定されていないとき
    assertToBeUndefined(options.ddd);
    assertToBeUndefined(options.hhh);
    assertToBeUndefined(options.jjj);
    assertToBeUndefined(options.nnn);
    // aloneなオプションはどれも使えない。
    expect(options.ddd).toEqualType<undefined>();
    expect(options.hhh).toEqualType<undefined>();
    expect(options.jjj).toEqualType<undefined>();
    expect(options.nnn).toEqualType<undefined>();
    // aloneでないオプションすべてが使える。
    expect(options.aaa).toEqualType<
      DescribedType<string, ['--aaa parameter: aaa']> | undefined
    >();
    expect(options.bbb).toEqualType<
      DescribedType<
        string,
        ['--bbb parameter: bbb', 'must be specified always.']
      >
    >();
    expect(options.ccc).toEqualType<
      DescribedType<
        string,
        ['--ccc parameter: ccc', "is equal to 'abc' if omitted."]
      >
    >();
    expect(options.eee).toEqualType<
      DescribedType<number, ['--eee parameter: eee']> | undefined
    >();
    expect(options.fff).toEqualType<
      DescribedType<
        number,
        ['--fff parameter: fff', 'must be specified always.']
      >
    >();
    expect(options.ggg).toEqualType<
      DescribedType<
        number,
        ['--ggg parameter: ggg', 'is equal to 1 if omitted.']
      >
    >();
    expect(options.iii).toEqualType<
      DescribedType<true, ['--iii: iii']> | undefined
    >();
    expect(options.kkk).toEqualType<
      DescribedType<string, ['--kkk parameter: kkk']> | undefined
    >();
    expect(options.lll).toEqualType<
      DescribedType<
        string,
        ['--lll parameter: lll', 'must be specified always.']
      >
    >();
    expect(options.mmm).toEqualType<
      DescribedType<
        string,
        ['--mmm parameter: mmm', "is equal to 'abc' if omitted."]
      >
    >();
    expect(options.ooo).toEqualType<
      DescribedType<
        readonly string[],
        ['--ooo parameter: ooo', 'can be specified more than once.']
      >
    >();
    expect(options.ppp).toEqualType<
      DescribedType<
        readonly number[],
        ['--ppp parameter: ppp', 'can be specified more than once.']
      >
    >();
    expect(options.qqq).toEqualType<
      DescribedType<
        readonly string[],
        ['--qqq parameter: qqq', 'can be specified more than once.']
      >
    >();
    // 簡易指定なオプションは説明文がつかない
    expect(options.rrr).toEqualType<
      DescribedType<
        string,
        ['--rrr parameter', "is equal to 'rrr' if omitted."]
      >
    >();
    expect(options.sss).toEqualType<
      DescribedType<number, ['--sss parameter', 'is equal to 123 if omitted.']>
    >();
    expect(options.ttt).toEqualType<
      DescribedType<true, ['--ttt']> | undefined
    >();
    expect(options.uuu).toEqualType<
      DescribedType<
        readonly ('uuu' | 'vvv' | 'www')[],
        ['--uuu parameter: uuu', 'can be specified more than once.']
      >
    >();
    expect(options.vvv).toEqualType<
      DescribedType<
        readonly string[],
        [
          '--vvv parameter: vvv',
          'can be specified more than once.',
          'must match the regular expression.',
        ]
      >
    >();
    expect(options.www).toEqualType<
      DescribedType<
        readonly (123 | 456 | 789)[],
        ['--www parameter: www', 'can be specified more than once.']
      >
    >();
    expect(options.xxx).toEqualType<
      DescribedType<
        readonly number[],
        [
          '--xxx parameter: xxx',
          'can be specified more than once.',
          'must be 10 or greater.',
          'must be less than 100.',
        ]
      >
    >();
    expect(options[unnamed]).toEqualType<readonly string[]>();
    // helpStringももちろん使える。
    expect(options[helpString]).toEqualType<string>();
  });
});

describe('combination error', () => {
  // 組み合わせエラーチェック
  test('boolean required', () => {
    expect(() =>
      // @ts-expect-error booleanにはrequiredを指定できない
      parse({ aaa: { type: 'boolean', required: true } }),
    ).toThrow();
  });
  test('boolean default', () => {
    expect(() =>
      // @ts-expect-error booleanにはdefaultを指定できない
      parse({ bbb: { type: 'boolean', default: 'true' } }),
    ).toThrow();
  });
  test('alone required (string)', () => {
    expect(() =>
      // @ts-expect-error aloneとrequiredは同じオプションに指定できない
      parse({ ccc: { alone: true, required: true } }),
    ).toThrow();
  });
  test('alone required number', () => {
    expect(() =>
      // @ts-expect-error aloneとrequiredは同じオプションに指定できない
      parse({ ddd: { type: 'number', alone: true, required: true } }),
    ).toThrow();
  });
  test('alone default (string)', () => {
    expect(() =>
      // @ts-expect-error aloneとdefaultは同じオプションに指定できない
      parse({ eee: { alone: true, default: 'true' } }),
    ).toThrow();
  });
  test('alone default number', () => {
    expect(() =>
      // @ts-expect-error aloneとdefaultは同じオプションに指定できない
      parse({ fff: { type: 'number', alone: true, default: 1 } }),
    ).toThrow();
  });
  test('required default (string)', () => {
    expect(() =>
      // @ts-expect-error requiredとdefaultは同じオプションに指定できない
      parse({ ggg: { required: true, default: 'true' } }),
    ).toThrow();
  });
  test('required default number', () => {
    expect(() =>
      // @ts-expect-error requiredとdefaultは同じオプションに指定できない
      parse({ hhh: { type: 'number', required: true, default: 1 } }),
    ).toThrow();
  });
  test('alone multiple (string)', () => {
    expect(() =>
      // @ts-expect-error aloneとmultipleは同じオプションに指定できない
      parse({ iii: { alone: true, multiple: true } }),
    ).toThrow();
  });
  test('required multiple (string)', () => {
    expect(() =>
      // @ts-expect-error requiredとmultipleは同じオプションに指定できない
      parse({ jjj: { required: true, multiple: true } }),
    ).toThrow();
  });
  test('multiple default (string)', () => {
    expect(() =>
      // @ts-expect-error defaultとmultipleは同じオプションに指定できない
      parse({ kkk: { default: '', multiple: true } }),
    ).toThrow();
  });
  test('alone multiple number', () => {
    expect(() =>
      // @ts-expect-error aloneとmultipleは同じオプションに指定できない
      parse({ lll: { type: 'number', alone: true, multiple: true } }),
    ).toThrow();
  });
  test('required multiple number', () => {
    expect(() =>
      // @ts-expect-error requiredとmultipleは同じオプションに指定できない
      parse({ mmm: { type: 'number', required: true, multiple: true } }),
    ).toThrow();
  });
  test('multiple default number', () => {
    expect(() =>
      // @ts-expect-error defaultとmultipleは同じオプションに指定できない
      parse({ nnn: { type: 'number', default: 1, multiple: true } }),
    ).toThrow();
  });
});

// 型だけチェック
describe('type check', () => {
  test('named property', () => {
    expect(parse({ aaa: {} } as const, []).aaa).toEqualType<
      DescribedType<string, ['--aaa parameter']> | undefined
    >();
    expect(parse({ aaa: { describe: 'abcdef' } } as const, []).aaa).toEqualType<
      DescribedType<string, ['--aaa parameter: abcdef']> | undefined
    >();
    expect(parse({ aaa: { example: 'AAA' } } as const, []).aaa).toEqualType<
      DescribedType<string, ['--aaa AAA']> | undefined
    >();
    expect(parse({ aaa: { alone: true } } as const, []).aaa).toEqualType<
      | DescribedType<string, ['--aaa parameter', 'must be specified alone.']>
      | undefined
    >();
    expect(
      parse({ aaa: { required: true } } as const, ['--aaa', 'aaa']).aaa,
    ).toEqualType<
      DescribedType<string, ['--aaa parameter', 'must be specified always.']>
    >();
    expect(parse({ aaa: { default: 'abc' } } as const, []).aaa).toEqualType<
      DescribedType<
        string,
        ['--aaa parameter', "is equal to 'abc' if omitted."]
      >
    >();
    expect(parse({ aaa: { multiple: true } } as const, []).aaa).toEqualType<
      DescribedType<
        readonly string[],
        ['--aaa parameter', 'can be specified more than once.']
      >
    >();
    expect(parse({ aaa: { constraints: /abc/ } } as const, []).aaa).toEqualType<
      | DescribedType<
          string,
          ['--aaa parameter', 'must match the regular expression.']
        >
      | undefined
    >();
    expect(
      parse({ aaa: { constraints: ['abc', 'def', 'ghi'] } } as const, []).aaa,
    ).toEqualType<
      | DescribedType<
          'abc' | 'def' | 'ghi',
          ['--aaa parameter', "must be either 'abc', 'def', 'ghi'."]
        >
      | undefined
    >();
    expect(
      parse({ aaa: { type: 'number', constraints: [123, 456, 789] } } as const)
        .aaa,
    ).toEqualType<
      | DescribedType<
          123 | 456 | 789,
          ['--aaa parameter', 'must be either 123, 456, 789.']
        >
      | undefined
    >();
    expect(
      parse({ aaa: { type: 'number', constraints: { min: 10 } } } as const, [])
        .aaa,
    ).toEqualType<
      | DescribedType<number, ['--aaa parameter', 'must be 10 or greater.']>
      | undefined
    >();
    expect(
      parse(
        {
          aaa: { type: 'number', constraints: { minExclusive: 10 } },
        } as const,
        [],
      ).aaa,
    ).toEqualType<
      | DescribedType<number, ['--aaa parameter', 'must be greater than 10.']>
      | undefined
    >();
    expect(
      parse({ aaa: { type: 'number', constraints: { max: 20 } } } as const, [])
        .aaa,
    ).toEqualType<
      | DescribedType<number, ['--aaa parameter', 'must be 20 or less.']>
      | undefined
    >();
    expect(
      parse(
        {
          aaa: { type: 'number', constraints: { maxExclusive: 20 } },
        } as const,
        [],
      ).aaa,
    ).toEqualType<
      | DescribedType<number, ['--aaa parameter', 'must be less than 20.']>
      | undefined
    >();
    expect(
      parse(
        {
          aaa: { type: 'number', constraints: { min: 10, max: 20 } },
        } as const,
        [],
      ).aaa,
    ).toEqualType<
      | DescribedType<
          number,
          ['--aaa parameter', 'must be 10 or greater.', 'must be 20 or less.']
        >
      | undefined
    >();
    expect(
      parse(
        {
          aaa: {
            type: 'number',
            constraints: { minExclusive: 10, maxExclusive: 20 },
          },
        } as const,
        [],
      ).aaa,
    ).toEqualType<
      | DescribedType<
          number,
          [
            '--aaa parameter',
            'must be greater than 10.',
            'must be less than 20.',
          ]
        >
      | undefined
    >();
    expect(
      parse(
        {
          aaa: { type: 'number', constraints: { minExclusive: 10, max: 20 } },
        } as const,
        [],
      ).aaa,
    ).toEqualType<
      | DescribedType<
          number,
          ['--aaa parameter', 'must be greater than 10.', 'must be 20 or less.']
        >
      | undefined
    >();
    expect(
      parse(
        {
          aaa: { type: 'number', constraints: { min: 10, maxExclusive: 20 } },
        } as const,
        [],
      ).aaa,
    ).toEqualType<
      | DescribedType<
          number,
          ['--aaa parameter', 'must be 10 or greater.', 'must be less than 20.']
        >
      | undefined
    >();
    expect(
      parse({ aaa: { multiple: true, constraints: /abc/ } } as const, []).aaa,
    ).toEqualType<
      DescribedType<
        readonly string[],
        [
          '--aaa parameter',
          'can be specified more than once.',
          'must match the regular expression.',
        ]
      >
    >();
    expect(parse({ aaa: 'abc' } as const, []).aaa).toEqualType<
      DescribedType<
        string,
        ['--aaa parameter', "is equal to 'abc' if omitted."]
      >
    >();
    expect(parse({ aaa: 123 } as const, []).aaa).toEqualType<
      DescribedType<number, ['--aaa parameter', 'is equal to 123 if omitted.']>
    >();
    expect(parse({ aaa: true } as const, []).aaa).toEqualType<
      DescribedType<true, ['--aaa']> | undefined
    >();
  });
  test('unnamed', () => {
    expect(parse({ aaa: {} } as const, [])[unnamed]).toEqualType<
      readonly string[]
    >();
    expect(parse({ aaa: { alone: true } } as const, [])[unnamed]).toEqualType<
      readonly string[] | undefined
    >();
  });
  test('help string', () => {
    expect(parse({ aaa: {} } as const, [])[helpString]).toEqualType<string>();
    expect(
      parse({ aaa: { alone: true } } as const, [])[helpString],
    ).toEqualType<string>();
  });
});

describe('camel case', () => {
  test('empty', () => {
    expect(parse({ 'abc-def': '' }, []).abcDef).toBe('');
  });
  test('1st', () => {
    expect(parse({ 'abc-def': '' }, ['--abc-def', 'test']).abcDef).toBe('test');
  });
  test('2nd', () => {
    expect(() => parse({ 'abc-def': '' }, ['--abcDef', 'test'])).toThrow(
      'unknown',
    );
  });
});

describe('double camel case', () => {
  test('empty', () => {
    const options = parse(
      {
        'abc-def': '',
        'ghi-jkl': 0,
      },
      [],
    );
    expect(options.abcDef).toBe('');
    expect(options.ghiJkl).toBe(0);
  });
  test('1st', () => {
    const options = parse(
      {
        'abc-def': '',
        'ghi-jkl': 0,
      },
      ['--abc-def', 'test'],
    );
    expect(options.abcDef).toBe('test');
    expect(options.ghiJkl).toBe(0);
  });
  test('2nd', () => {
    const options = parse(
      {
        'abc-def': '',
        'ghi-jkl': 0,
      },
      ['--ghi-jkl', '123'],
    );
    expect(options.abcDef).toBe('');
    expect(options.ghiJkl).toBe(123);
  });
  test('3rd', () => {
    const options = parse(
      {
        'abc-def': '',
        'ghi-jkl': 0,
      },
      ['--abc-def', 'test', '--ghi-jkl', '123'],
    );
    expect(options.abcDef).toBe('test');
    expect(options.ghiJkl).toBe(123);
  });
});

describe('invalid name', () => {
  test('last hyphen', () => {
    expect(() => parse({ 'abc-': 0 }, [])).toThrow('Invalid option name: abc-');
  });
  test('first hyphen', () => {
    expect(() => parse({ '-def': 0 }, [])).toThrow('Invalid option name: -def');
  });
  test('duplicate name', () => {
    expect(() => parse({ abcDef: '', 'abc-def': 0 }, [])).toThrow(
      'Duplicate option name: abc-def, abcDef',
    );
  });
  test('duplicate name#2', () => {
    expect(() => parse({ abc012: '', 'abc-012': 0 }, [])).toThrow(
      'Duplicate option name: abc-012, abc012',
    );
  });
  test('duplicate name#3', () => {
    expect(() =>
      parse({ abc: { alias: 'abc-def' }, 'abc-def': 0 }, []),
    ).toThrow('Duplicate alias name: abc-def, abc');
  });
  test('duplicate name#4', () => {
    expect(() =>
      parse({ 'abc-def': 0, abc: { alias: 'abc-def' } }, []),
    ).toThrow('Duplicate alias name: abc, abc-def');
  });
  test('deprecated property: nature: alone', () => {
    expect(() =>
      // @ts-expect-error natureを指定するとエラーになることの確認
      parse({ abc: { nature: 'alone' } }, []),
    ).toThrow();
  });
  test('deprecated property: nature: alone', () => {
    expect(() =>
      // @ts-expect-error natureを指定するとエラーになることの確認
      parse({ abc: { type: 'string', nature: 'alone' } }, []),
    ).toThrow();
  });
  test('deprecated property: nature: alone', () => {
    expect(() =>
      // @ts-expect-error natureを指定するとエラーになることの確認
      parse({ abc: { type: 'boolean', nature: 'alone' } }, []),
    ).toThrow();
  });
  test('deprecated property: nature: required', () => {
    expect(() =>
      // @ts-expect-error natureを指定するとエラーになることの確認
      parse({ abc: { type: 'number', nature: 'required' } }, []),
    ).toThrow();
  });
  test('deprecated property: nature: default', () => {
    expect(() =>
      // @ts-expect-error natureを指定するとエラーになることの確認
      parse({ abc: { type: 'number', nature: ['default', 1] } }, []),
    ).toThrow();
  });
});

/**
 * 2のexponent乗の近傍の数値を取得する。
 *
 * @param exponent 乗数
 * @param sign 負号
 * @param direction 近傍の方向。絶対値が大きくなる方向であれば正を指定する。
 * @returns 取得した近傍の数値。
 */
function neighborhood(
  exponent: number,
  sign: 1 | -1,
  direction: 1 | -1,
): number {
  const power = Math.pow(2, exponent);
  const neighbor = (power + Math.pow(2, exponent - 52) * direction) * sign;
  if (power === neighbor) {
    throw new Error(`expected neighborhood, but same number ${power}`);
  }
  return neighbor;
}

describe.each`
  constraint
  ${'minExclusive'}
  ${'maxExclusive'}
`(
  'autoAdjust $constraint',
  ({ constraint }: { constraint: 'minExclusive' | 'maxExclusive' }) => {
    test.each`
      number
      ${0}
      ${1}
      ${-1}
      ${0.1}
      ${-0.1}
      ${5.25}
      ${-5.25
// eslint-disable-next-line prettier/prettier
//
      }
      Math.log2で丸めが発生するため、2の乗数近傍の値でテスト
      ${neighborhood(50, 1, 1)}
      ${neighborhood(50, -1, 1)}
      ${neighborhood(50, 1, -1)}
      ${neighborhood(50, -1, -1)}
      ${neighborhood(100, 1, 1)}
      ${neighborhood(100, -1, 1)}
      ${neighborhood(100, 1, -1)}
      ${neighborhood(100, -1, -1)}
      ${neighborhood(200, 1, 1)}
      ${neighborhood(200, -1, 1)}
      ${neighborhood(200, 1, -1)}
      ${neighborhood(200, -1, -1)}
      ${neighborhood(300, 1, 1)}
      ${neighborhood(300, -1, 1)}
      ${neighborhood(300, 1, -1)}
      ${neighborhood(300, -1, -1)
// eslint-disable-next-line prettier/prettier
//
      }
      Numberに用意されている定数でも正負それぞれチェック
      ${Number.MIN_VALUE}
      ${-Number.MIN_VALUE}
      ${Number.MAX_VALUE}
      ${-Number.MAX_VALUE}
      ${Number.MIN_SAFE_INTEGER}
      ${Number.MAX_SAFE_INTEGER}
      ${Number.EPSILON}
      ${-Number.EPSILON}
    `('$number', ({ number }: { number: number }) => {
      const map = {
        a: {
          type: 'number',
          constraints: { [constraint]: number } as
            | { minExclusive: number }
            | { maxExclusive: number },
          autoAdjust: true,
          required: true,
        },
      } as const;
      const next = parse(map, ['-a', String(number)]).a;
      if (constraint === 'minExclusive') {
        expect(next).toBeGreaterThan(number);
      } else {
        expect(next).toBeLessThan(number);
      }
      expect(number + (next - number) / 2).toEqual(
        new OneOfThem([number, next]),
      );
    });
  },
);

import { AsymmetricMatcher } from 'expect/build/asymmetricMatchers';

class OneOfThem<T> extends AsymmetricMatcher<readonly T[]> {
  constructor(them: readonly [T, T, ...T[]]) {
    if (them.length < 2) {
      throw new TypeError(`oneOfThem() expects the array of 2 or more length.`);
    }
    super(them);
  }
  asymmetricMatch(other: T) {
    return this.sample.some(e => e === other);
  }
  toString() {
    return `OneOfThem ${this.sample.join(', ')}`;
  }
  getExpectedType() {
    return typeof this.sample[0];
  }
  toAsymmetricMatcher(): string {
    return `One of ${this.sample.slice(0, -1).join(', ')} or ${this.sample.at(
      -1,
    )}`;
  }
}
