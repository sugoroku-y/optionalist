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
  expect(parse(OPTMAP, ['--delta', 'test'])).toEqual({
    delta: 'test',
    bravo: 1,
    foxtrot: 'racoondog',
    [unnamed]: [],
  });
});
test('optionalist normal', () => {
  expect(parse(OPTMAP, ['--alpha', 'bet', '--delta', 'test'])).toEqual({
    alpha: 'bet',
    delta: 'test',
    foxtrot: 'racoondog',
    bravo: 1,
    [unnamed]: [],
  });
});
test('optionalist normal', () => {
  expect(
    parse(OPTMAP, ['--alpha', 'bet', '--bravo', '2', '--delta', 'test']),
  ).toEqual({
    alpha: 'bet',
    delta: 'test',
    foxtrot: 'racoondog',
    bravo: 2,
    [unnamed]: [],
  });
});
test('optionalist alone', () => {
  expect(parse(OPTMAP, ['--charlie'])).toEqual({ charlie: true });
});
test('optionalist alone', () => {
  expect(parse(OPTMAP, ['--echo', 'string'])).toEqual({
    echo: 'string',
  });
});
test('optionalist unnamed', () => {
  expect(parse(OPTMAP, ['--delta', 'test', 'aaa', 'bbb', 'ccc'])).toEqual({
    bravo: 1,
    delta: 'test',
    foxtrot: 'racoondog',
    [unnamed]: ['aaa', 'bbb', 'ccc'],
  });
});
test('optionalist unnamed', () => {
  expect(
    parse(OPTMAP, ['--delta', 'test', '--', '--aaa', '-bbb', '-ccc']),
  ).toEqual({
    bravo: 1,
    delta: 'test',
    foxtrot: 'racoondog',
    [unnamed]: ['--aaa', '-bbb', '-ccc'],
  });
});
test('optionalist string constraints', () => {
  expect(
    parse(OPTMAP, ['--delta', 'required', '--golf', 'volkswagen']),
  ).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    golf: 'volkswagen',
    [unnamed]: [],
  });
});
test('optionalist string constraints', () => {
  expect(parse(OPTMAP, ['--delta', 'required', '--golf', 'sports'])).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    golf: 'sports',
    [unnamed]: [],
  });
});
test('optionalist string constraints', () => {
  expect(
    parse(OPTMAP, ['--delta', 'required', '--GOLF', 'VOLKSWAGEN']),
  ).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    GOLF: 'volkswagen',
    [unnamed]: [],
  });
});
test('optionalist string constraints', () => {
  expect(parse(OPTMAP, ['--delta', 'required', '--GOLF', 'SPORTS'])).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    GOLF: 'sports',
    [unnamed]: [],
  });
});
test('optionalist number constraints', () => {
  expect(parse(OPTMAP, ['--delta', 'required', '--hotel', '1234'])).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    hotel: 1234,
    [unnamed]: [],
  });
});
test('optionalist number constraints', () => {
  expect(parse(OPTMAP, ['--delta', 'required', '--hotel', '5678'])).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    hotel: 5678,
    [unnamed]: [],
  });
});
test('optionalist number constraints', () => {
  expect(parse(OPTMAP, ['--delta', 'required', '--hotel', '9012'])).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    hotel: 9012,
    [unnamed]: [],
  });
});
test('optionalist number range constraints', () => {
  expect(parse(OPTMAP, ['--delta', 'required', '--india', '1000'])).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    india: 1000,
    [unnamed]: [],
  });
});
test('optionalist number range constraints', () => {
  expect(parse(OPTMAP, ['--delta', 'required', '--india', '9999'])).toEqual({
    bravo: 1,
    delta: 'required',
    foxtrot: 'racoondog',
    india: 9999,
    [unnamed]: [],
  });
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
test('optionalist usage error', () => {
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
  ).toThrow('The default value of the -a parameter must be a string.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    parse({ a: { type: 'boolean', default: 1 } }, ['-a', '2']),
  ).toThrow('The default value of the -a parameter cannot be specified.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    parse({ a: { type: 'boolean', required: true } }, ['-a', '2']),
  ).toThrow('The -a cannot set to be required.');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    parse(
      // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
      { a: { type: 'number', default: '1' } },
      ['-a', '2'],
    ),
  ).toThrow('The default value of the -a parameter must be a number.: 1');
});
test('optionalist helpstring', () => {
  expect(parse(OPTMAP, ['--charlie'])[helpString])
    .toBe(`Version: ${packageName} ${version}
Usage:
  npx ${packageName} --delta parameter [--alpha parameter] [--bravo b-value] [--foxtrot parameter] [--golf parameter] [--hotel parameter] [--india parameter] [--GOLF parameter] [--] [argument...]
  npx ${packageName} --charlie
  npx ${packageName} --echo parameter

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
  ).toThrow('unknown type: unknown for the -a parameter');
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
  npx ${packageName} --aaa parameter [--] [unnamed_parameters...]

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
  npx ${packageName} [-a parameter]

Options:
  -a parameter
`);
});

test('min only', () => {
  expect(
    parse({ a: { type: 'number', constraints: { min: 10 } } }, ['-a', '10']),
  ).toEqual({ a: 10, [unnamed]: [] });
});
test('max only', () => {
  expect(
    parse({ a: { type: 'number', constraints: { max: 10 } } }, ['-a', '10']),
  ).toEqual({ a: 10, [unnamed]: [] });
});

test('multiple string', () => {
  expect(
    parse({ a: { multiple: true } }, ['-a', 'abc', '-a', 'def', '-a', 'ghi']),
  ).toEqual({ a: ['abc', 'def', 'ghi'], [unnamed]: [] });
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
  ).toEqual({ a: [10, 20, 30], [unnamed]: [] });
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

test('invalid optMap', () => {
  expect(() => parse({ '': {} })).toThrow('empty option name');
  expect(() => parse({ '-': {} })).toThrow('Invalid option name: -');
});

test('pattern constraints', () => {
  expect(() =>
    parse({ a: { constraints: /^\w+=/ } }, ['-a', 'aaabbb']),
  ).toThrow('-a does not match /^\\w+=/: aaabbb');
});

test('minExclusive', () => {
  expect(
    parse({ a: { type: 'number', constraints: { minExclusive: 1 } } }, [
      '-a',
      '1.1',
    ]),
  ).toEqual({
    a: 1.1,
    [unnamed]: [],
  });
  expect(() =>
    parse({ a: { type: 'number', constraints: { minExclusive: 1 } } }, [
      '-a',
      '1',
    ]),
  ).toThrow('-a must be greater than 1.');
});

test('maxExclusive', () => {
  expect(
    parse({ a: { type: 'number', constraints: { maxExclusive: 10 } } }, [
      '-a',
      '9.9',
    ]),
  ).toEqual({
    a: 9.9,
    [unnamed]: [],
  });
  expect(() =>
    parse({ a: { type: 'number', constraints: { maxExclusive: 10 } } }, [
      '-a',
      '10',
    ]),
  ).toThrow('-a must be less than 10.');
});
test('max&maxExclusive', () => {
  parse(
    // @ts-expect-error maxとmaxExclusiveは同時に指定できない
    { a: { type: 'number', constraints: { max: 11, maxExclusive: 10 } } },
    [],
  );
  parse(
    // @ts-expect-error minとminExclusiveは同時に指定できない
    { a: { type: 'number', constraints: { min: 11, minExclusive: 10 } } },
    [],
  );
  // @ts-expect-error min、minExclusive、max、maxExclusiveのどれも指定しないのはエラー
  parse({ a: { type: 'number', constraints: {} } }, []);
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
  } as const;
  test('alone (string)', () => {
    const options = parse(optMap, ['--ddd', 'ddd']);
    assertToBeDefined(options.ddd);
    expect(options).toEqualType<{
      // dddが有効な場合はdddとhelpStringだけ使える
      readonly ddd: DescribedType<string, 'ddd', { describe: 'ddd' }>;
      readonly [helpString]: string;
      // その他のオプションは使えない
      readonly aaa?: never;
      readonly bbb?: never;
      readonly ccc?: never;
      readonly eee?: never;
      readonly fff?: never;
      readonly ggg?: never;
      readonly hhh?: never;
      readonly iii?: never;
      readonly jjj?: never;
      readonly kkk?: never;
      readonly lll?: never;
      readonly mmm?: never;
      readonly nnn?: never;
      readonly ooo?: never;
      readonly ppp?: never;
      readonly qqq?: never;
      readonly rrr?: never;
      readonly sss?: never;
      readonly ttt?: never;
      readonly [unnamed]?: never;
    }>();
  });
  test('alone number', () => {
    const options = parse(optMap, ['--hhh', '0']);
    assertToBeDefined(options.hhh);
    expect(options).toEqualType<{
      // hhhが有効な場合はhhhとhelpStringだけ使える
      readonly hhh: DescribedType<number, 'hhh', { describe: 'hhh' }>;
      readonly [helpString]: string;
      // その他のオプションは使えない
      readonly aaa?: never;
      readonly bbb?: never;
      readonly ccc?: never;
      readonly ddd?: never;
      readonly eee?: never;
      readonly fff?: never;
      readonly ggg?: never;
      readonly iii?: never;
      readonly jjj?: never;
      readonly kkk?: never;
      readonly lll?: never;
      readonly mmm?: never;
      readonly nnn?: never;
      readonly ooo?: never;
      readonly ppp?: never;
      readonly qqq?: never;
      readonly rrr?: never;
      readonly sss?: never;
      readonly ttt?: never;
      readonly [unnamed]?: never;
    }>();
  });
  test('alone boolean', () => {
    const options = parse(optMap, ['--jjj']);
    assertToBeDefined(options.jjj);
    expect(options).toEqualType<{
      // jjjが有効な場合はjjjとhelpStringだけ使える
      readonly jjj: DescribedType<true, 'jjj', { describe: 'jjj' }>;
      readonly [helpString]: string;
      // その他のオプションは使えない
      readonly aaa?: never;
      readonly bbb?: never;
      readonly ccc?: never;
      readonly ddd?: never;
      readonly eee?: never;
      readonly fff?: never;
      readonly ggg?: never;
      readonly hhh?: never;
      readonly iii?: never;
      readonly kkk?: never;
      readonly lll?: never;
      readonly mmm?: never;
      readonly nnn?: never;
      readonly ooo?: never;
      readonly ppp?: never;
      readonly qqq?: never;
      readonly rrr?: never;
      readonly sss?: never;
      readonly ttt?: never;
      readonly [unnamed]?: never;
    }>();
  });
  test('alone string', () => {
    const options = parse(optMap, ['--nnn', 'nnn']);
    assertToBeDefined(options.nnn);
    expect(options).toEqualType<{
      // nnnが有効な場合はnnnとhelpStringだけ使える
      readonly nnn: DescribedType<string, 'nnn', { describe: 'nnn' }>;
      readonly [helpString]: string;
      readonly aaa?: never;
      readonly bbb?: never;
      readonly ccc?: never;
      readonly ddd?: never;
      readonly eee?: never;
      readonly fff?: never;
      readonly ggg?: never;
      readonly hhh?: never;
      readonly iii?: never;
      readonly jjj?: never;
      readonly kkk?: never;
      readonly lll?: never;
      readonly mmm?: never;
      readonly ooo?: never;
      readonly ppp?: never;
      readonly qqq?: never;
      readonly rrr?: never;
      readonly sss?: never;
      readonly ttt?: never;
      readonly [unnamed]?: never;
    }>();
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
    expect(options).toEqualType<{
      // aloneなオプションはどれも使えない。
      readonly ddd?: never;
      readonly hhh?: never;
      readonly jjj?: never;
      readonly nnn?: never;
      // aloneでないオプションすべてが使える。
      readonly aaa?: DescribedType<string, 'aaa', { describe: 'aaa' }>;
      readonly bbb: DescribedType<string, 'bbb', { describe: 'bbb' }>;
      readonly ccc: DescribedType<string, 'ccc', { describe: 'ccc' }>;
      readonly eee?: DescribedType<number, 'eee', { describe: 'eee' }>;
      readonly fff: DescribedType<number, 'fff', { describe: 'fff' }>;
      readonly ggg: DescribedType<number, 'ggg', { describe: 'ggg' }>;
      readonly iii?: DescribedType<true, 'iii', { describe: 'iii' }>;
      readonly kkk?: DescribedType<string, 'kkk', { describe: 'kkk' }>;
      readonly lll: DescribedType<string, 'lll', { describe: 'lll' }>;
      readonly mmm: DescribedType<string, 'mmm', { describe: 'mmm' }>;
      readonly ooo: DescribedType<readonly string[], 'ooo', { describe: 'ooo' }>;
      readonly ppp: DescribedType<readonly number[], 'ppp', { describe: 'ppp' }>;
      readonly qqq: DescribedType<readonly string[], 'qqq', { describe: 'qqq' }>;
      readonly rrr?: string;
      readonly sss?: number;
      readonly ttt?: true;
      readonly [unnamed]: readonly string[];
      // helpStringももちろん使える。
      readonly [helpString]: string;
    }>();
  });
});

describe('combination error', () => {
  // 組み合わせエラーチェック
  test('boolean required', () => {
    expect(() =>
      // @ts-expect-error booleanにはrequiredを指定できない
      parse({ aaa: { type: 'boolean', required: true } }),
    ).toThrow('The --aaa cannot set to be required.');
  });
  test('boolean default', () => {
    expect(() =>
      // @ts-expect-error booleanにはdefaultを指定できない
      parse({ bbb: { type: 'boolean', default: 'true' } }),
    ).toThrow(
      'The default value of the --bbb parameter cannot be specified.: true',
    );
  });
  test('alone required (string)', () => {
    expect(() =>
      // @ts-expect-error aloneとrequiredは同じオプションに指定できない
      parse({ ccc: { alone: true, required: true } }),
    ).toThrow('The --ccc cannot be both alone and required.');
  });
  test('alone required number', () => {
    expect(() =>
      // @ts-expect-error aloneとrequiredは同じオプションに指定できない
      parse({ ddd: { type: 'number', alone: true, required: true } }),
    ).toThrow('The --ddd cannot be both alone and required.');
  });
  test('alone default (string)', () => {
    expect(() =>
      // @ts-expect-error aloneとdefaultは同じオプションに指定できない
      parse({ eee: { alone: true, default: 'true' } }),
    ).toThrow('The --eee cannot be set to both alone and default value.');
  });
  test('alone default number', () => {
    expect(() =>
      // @ts-expect-error aloneとdefaultは同じオプションに指定できない
      parse({ fff: { type: 'number', alone: true, default: 1 } }),
    ).toThrow('The --fff cannot be set to both alone and default value.');
  });
  test('required default (string)', () => {
    expect(() =>
      // @ts-expect-error requiredとdefaultは同じオプションに指定できない
      parse({ ggg: { required: true, default: 'true' } }),
    ).toThrow('The --ggg cannot be set to both required and default value.');
  });
  test('required default number', () => {
    expect(() =>
      // @ts-expect-error requiredとdefaultは同じオプションに指定できない
      parse({ hhh: { type: 'number', required: true, default: 1 } }),
    ).toThrow('The --hhh cannot be set to both required and default value.');
  });
  test('alone multiple (string)', () => {
    expect(() =>
      // @ts-expect-error aloneとmultipleは同じオプションに指定できない
      parse({ iii: { alone: true, multiple: true } }),
    ).toThrow('The --iii cannot be both alone and multiple.');
  });
  test('required multiple (string)', () => {
    expect(() =>
      // @ts-expect-error requiredとmultipleは同じオプションに指定できない
      parse({ jjj: { required: true, multiple: true } }),
    ).toThrow('The --jjj cannot be both required and multiple.');
  });
  test('multiple default (string)', () => {
    expect(() =>
      // @ts-expect-error defaultとmultipleは同じオプションに指定できない
      parse({ kkk: { default: '', multiple: true } }),
    ).toThrow('The --kkk cannot be set to both multiple and default value.');
  });
  test('alone multiple number', () => {
    expect(() =>
      // @ts-expect-error aloneとmultipleは同じオプションに指定できない
      parse({ lll: { type: 'number', alone: true, multiple: true } }),
    ).toThrow('The --lll cannot be both alone and multiple.');
  });
  test('required multiple number', () => {
    expect(() =>
      // @ts-expect-error requiredとmultipleは同じオプションに指定できない
      parse({ mmm: { type: 'number', required: true, multiple: true } }),
    ).toThrow('The --mmm cannot be both required and multiple.');
  });
  test('multiple default number', () => {
    expect(() =>
      // @ts-expect-error defaultとmultipleは同じオプションに指定できない
      parse({ nnn: { type: 'number', default: 1, multiple: true } }),
    ).toThrow('The --nnn cannot be set to both multiple and default value.');
  });
});
