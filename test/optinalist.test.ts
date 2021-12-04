import * as fs from 'fs';
import * as path from 'path';
import * as optionalist from '../src';
import { assertNotToHaveProperty } from './asserts';
import './toExitProcess';

const OPTMAP = {
  [optionalist.helpString]: {
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
  [optionalist.unnamed]: {
    example: 'argument',
    describe: 'arguments for command',
  },
} as const;

test('optionalist normal', () => {
  expect(optionalist.parse(OPTMAP, ['--delta', 'test'])).toEqual({
    delta: 'test',
    bravo: 1,
    foxtrot: 'racoondog',
  });
});
test('optionalist normal', () => {
  expect(
    optionalist.parse(OPTMAP, ['--alpha', 'bet', '--delta', 'test']),
  ).toEqual({ alpha: 'bet', delta: 'test', foxtrot: 'racoondog', bravo: 1 });
});
test('optionalist normal', () => {
  expect(
    optionalist.parse(OPTMAP, [
      '--alpha',
      'bet',
      '--bravo',
      '2',
      '--delta',
      'test',
    ]),
  ).toEqual({ alpha: 'bet', delta: 'test', foxtrot: 'racoondog', bravo: 2 });
});
test('optionalist alone', () => {
  expect(optionalist.parse(OPTMAP, ['--charlie'])).toEqual({ charlie: true });
});
test('optionalist alone', () => {
  expect(optionalist.parse(OPTMAP, ['--echo', 'string'])).toEqual({
    echo: 'string',
  });
});
test('optionalist unnamed', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'test',
    'aaa',
    'bbb',
    'ccc',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options[optionalist.unnamed]).toEqual(['aaa', 'bbb', 'ccc']);
});
test('optionalist unnamed', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'test',
    '--',
    '--aaa',
    '-bbb',
    '-ccc',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options[optionalist.unnamed]).toEqual(['--aaa', '-bbb', '-ccc']);
});
test('optionalist string constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--golf',
    'volkswagen',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.golf).toBe('volkswagen');
});
test('optionalist string constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--golf',
    'sports',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.golf).toBe('sports');
});
test('optionalist string constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--GOLF',
    'VOLKSWAGEN',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.GOLF).toBe('volkswagen');
});
test('optionalist string constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--GOLF',
    'SPORTS',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.GOLF).toBe('sports');
});
test('optionalist number constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--hotel',
    '1234',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.hotel).toBe(1234);
});
test('optionalist number constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--hotel',
    '5678',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.hotel).toBe(5678);
});
test('optionalist number constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--hotel',
    '9012',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.hotel).toBe(9012);
});
test('optionalist number range constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--india',
    '1000',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.india).toBe(1000);
});
test('optionalist number range constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--india',
    '9999',
  ]);
  assertNotToHaveProperty(options, 'charlie');
  assertNotToHaveProperty(options, 'echo');
  expect(options.india).toBe(9999);
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, [])).toThrow('--delta required');
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--unknown'])).toThrow(
    'unknown options: --unknown',
  );
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--alpha'])).toThrow(
    '--alpha needs a parameter',
  );
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--bravo'])).toThrow(
    '--bravo needs a number parameter as the b-value',
  );
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--bravo', 'abc'])).toThrow(
    '--bravo needs a number parameter as the b-value: abc',
  );
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse(OPTMAP, ['--bravo', 'abc', '--charlie']),
  ).toThrow('--bravo needs a number parameter as the b-value: abc');
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--charlie', '111'])).toThrow(
    '--charlie must be specified alone.',
  );
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--charlie', '--', '-111'])).toThrow(
    '--charlie must be specified alone.',
  );
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse(OPTMAP, ['--alpha', 'beta', '--charlie']),
  ).toThrow('--charlie must be specified alone.');
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse(OPTMAP, ['--delta', 'required', '--golf', 'german']),
  ).toThrow('--golf must be one of volkswagen, sports');
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse(OPTMAP, ['--delta', 'required', '--golf', 'SPORTS']),
  ).toThrow('--golf must be one of volkswagen, sports');
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse(OPTMAP, ['--delta', 'required', '--hotel', '0']),
  ).toThrow('--hotel must be one of 1234, 5678, 9012.');
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse(OPTMAP, ['--delta', 'required', '--india', '999']),
  ).toThrow('--india must be greater than or equal to 1000.');
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse(OPTMAP, ['--delta', 'required', '--india', '10000']),
  ).toThrow('--india must be less than or equal to 9999.');
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse({ [optionalist.unnamed]: { min: 2, max: 3 } }, ['111']),
  ).toThrow('At least 2 unnamed_parameters required.');
  expect(() =>
    optionalist.parse(
      { [optionalist.unnamed]: { min: 2, max: 3, example: 'ppp' } },
      ['111'],
    ),
  ).toThrow('At least 2 ppp required.');
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse({ [optionalist.unnamed]: { min: 2, max: 3 } }, [
      '111',
      '222',
      '333',
      '444',
    ]),
  ).toThrow('Too many unnamed_parameters specified(up to 3).');
  expect(() =>
    optionalist.parse(
      { [optionalist.unnamed]: { min: 2, max: 3, example: 'ppp' } },
      ['111', '222', '333', '444'],
    ),
  ).toThrow('Too many ppp specified(up to 3).');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    optionalist.parse({ a: { default: 1 } }, ['-a', '2']),
  ).toThrow('The default value of the -a parameter must be a string.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    optionalist.parse({ a: { type: 'boolean', default: 1 } }, ['-a', '2']),
  ).toThrow('The default value of the -a parameter cannot be specified.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    optionalist.parse({ a: { type: 'boolean', required: true } }, ['-a', '2']),
  ).toThrow('The -a cannot set to be required.');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse(
      // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
      { a: { type: 'number', default: '1' } },
      ['-a', '2'],
    ),
  ).toThrow('The default value of the -a parameter must be a number.: 1');
});
test('optionalist helpstring', () => {
  const { name: packageName, version } = JSON.parse(
    fs.readFileSync(path.join(path.dirname(__dirname), 'package.json'), 'utf8'),
  ) as { name: string; version: string };
  expect(optionalist.parse(OPTMAP, ['--charlie'])[optionalist.helpString])
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
    const x = optionalist.parse({ a: {}, b: {}, c: {} });
    expect(x[optionalist.unnamed]).toEqual(['ghi']);
  } finally {
    process.argv = saved;
  }
});
test('never', () => {
  expect(() =>
    // @ts-expect-error 例外を発生させるためエラーになる組み合わせを指定
    optionalist.parse({ a: { type: 'unknown', default: 1 } }, []),
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
        optionalist.parse(
          {
            [optionalist.helpString]: {
              showUsageOnError: true,
            },
            aaa: {
              describe: 'test',
              required: true,
            },
            [optionalist.unnamed]: {
              min: 0,
              max: Infinity,
            },
          },
          [],
        );
      }).toExitProcess(1);
    }),
  ).toMatchInlineSnapshot(`
"--aaa required

Version: optionalist 2.0.2
Usage:
  npx optionalist --aaa parameter [--] [unnamed_parameters...]

Options:
  --aaa parameter
    test
  [--] [unnamed_parameters...]
"
`);
});
test('helpString', () => {
  expect(optionalist.parse({ a: {} }, [])[optionalist.helpString])
    .toMatchInlineSnapshot(`
"Version: optionalist 2.0.2
Usage:
  npx optionalist [-a parameter]

Options:
  -a parameter
"
`);
});

test('min only', () => {
  expect(
    optionalist.parse({ a: { type: 'number', constraints: { min: 10 } } }, [
      '-a',
      '10',
    ]),
  ).toEqual({ a: 10 });
});
test('max only', () => {
  expect(
    optionalist.parse({ a: { type: 'number', constraints: { max: 10 } } }, [
      '-a',
      '10',
    ]),
  ).toEqual({ a: 10 });
});
