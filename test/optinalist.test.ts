import { parse, unnamed, helpString } from '../src';
import './toExitProcess';
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
  let buffer = Buffer.alloc(0);
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

/**
 * AとBが型として一致するかどうかを判定する。
 */
type Equal<A, B> = (<T>(a: A) => T extends A ? 1 : 2) extends <T>(
  a: B,
) => T extends B ? 1 : 2
  ? true
  : false;

/**
 * 引数に指定したインスタンスの型がSに一致するかどうかをチェックする。
 *
 * 一致しない場合はコンパイルエラーになる。
 *
 * 実態はないので実際には実行してはいけない。
 */
declare function TypeOf<T>(a: T): {
  isExpectedToBe<S>(
    ...args: Equal<S, T> extends true ? [] : ['型が一致しません']
  ): void;
};

() => {
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
   *
   * ※ booleanにはrequired/defaultを指定できない
   */
  const options = parse({
    aaa: {},
    bbb: { required: true },
    ccc: { default: 'abc' },
    ddd: { alone: true },
    eee: { type: 'number' },
    fff: { type: 'number', required: true },
    ggg: { type: 'number', default: 1 },
    hhh: { type: 'number', alone: true },
    iii: { type: 'boolean' },
    jjj: { type: 'boolean', alone: true },
    kkk: { type: 'string' },
    lll: { type: 'string', required: true },
    mmm: { type: 'string', default: 'abc' },
    nnn: { type: 'string', alone: true },
  });
  options.ccc ? options : options.ddd !== undefined ? options : options;
  // それぞれの型チェック
  if (options.ddd !== undefined) {
    // dddが有効な場合はdddとhelpStringだけ使える
    TypeOf(options).isExpectedToBe<{
      readonly aaa?: never;
      readonly bbb?: never;
      readonly ccc?: never;
      readonly ddd: string;
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
      readonly [unnamed]?: never;
      readonly [helpString]: string;
    }>();
  } else if (options.hhh !== undefined) {
    // hhhが有効な場合はhhhとhelpStringだけ使える
    TypeOf(options).isExpectedToBe<{
      readonly aaa?: never;
      readonly bbb?: never;
      readonly ccc?: never;
      readonly ddd?: never;
      readonly eee?: never;
      readonly fff?: never;
      readonly ggg?: never;
      readonly hhh: number;
      readonly iii?: never;
      readonly jjj?: never;
      readonly kkk?: never;
      readonly lll?: never;
      readonly mmm?: never;
      readonly nnn?: never;
      readonly [unnamed]?: never;
      readonly [helpString]: string;
    }>();
  } else if (options.jjj) {
    // jjjが有効な場合はjjjとhelpStringだけ使える
    TypeOf(options).isExpectedToBe<{
      readonly aaa?: never;
      readonly bbb?: never;
      readonly ccc?: never;
      readonly ddd?: never;
      readonly eee?: never;
      readonly fff?: never;
      readonly ggg?: never;
      readonly hhh?: never;
      readonly iii?: never;
      readonly jjj: true;
      readonly kkk?: never;
      readonly lll?: never;
      readonly mmm?: never;
      readonly nnn?: never;
      readonly [unnamed]?: never;
      readonly [helpString]: string;
    }>();
  } else if (options.nnn !== undefined) {
    // nnnが有効な場合はnnnとhelpStringだけ使える
    TypeOf(options).isExpectedToBe<{
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
      readonly nnn: string;
      readonly [unnamed]?: never;
      readonly [helpString]: string;
    }>();
  } else {
    // aloneなオプションがどれも指定されていないときはaloneでないオプションすべてが使える。aloneなオプションはどれも使えない
    TypeOf(options).isExpectedToBe<{
      readonly aaa?: string;
      readonly bbb: string;
      readonly ccc: string;
      readonly ddd?: never;
      readonly eee?: number;
      readonly fff: number;
      readonly ggg: number;
      readonly hhh?: never;
      readonly iii?: true;
      readonly jjj?: never;
      readonly kkk?: string;
      readonly lll: string;
      readonly mmm: string;
      readonly nnn?: never;
      readonly [unnamed]: readonly string[];
      readonly [helpString]: string;
    }>();
  }
};
() => {
  // 組み合わせエラーチェック
  parse({
    // @ts-expect-error booleanにはrequiredを指定できない
    aaa: { type: 'boolean', required: true },
    // @ts-expect-error booleanにはdefaultを指定できない
    bbb: { type: 'boolean', default: 'true' },
    // @ts-expect-error aloneとrequiredは同じオプションに指定できない
    ccc: { alone: true, required: true },
    // @ts-expect-error aloneとrequiredは同じオプションに指定できない
    ddd: { type: 'number', alone: true, required: true },
    // @ts-expect-error aloneとdefaultは同じオプションに指定できない
    eee: { alone: true, default: 'true' },
    // @ts-expect-error aloneとdefaultは同じオプションに指定できない
    fff: { type: 'number', alone: true, default: 1 },
    // @ts-expect-error requiredとdefaultは同じオプションに指定できない
    ggg: { required: true, default: 'true' },
    // @ts-expect-error requiredとdefaultは同じオプションに指定できない
    hhh: { type: 'number', required: true, default: 1 },
  });
};
