import * as fs from 'fs';
import * as path from 'path';
import * as optionalist from '../src/index';

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
    nature: ['default', 1],
    describe: 'b value',
    example: 'b-value',
    alias: 'b',
  },
  charlie: {
    type: 'boolean',
    nature: 'alone',
    alias: ['charr', 'c'],
    describe: `
    `,
  },
  delta: {
    nature: 'required',
  },
  echo: {
    nature: 'alone',
  },
  foxtrot: {
    nature: ['default', 'racoondog'],
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
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
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
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options[optionalist.unnamed]).toEqual(['--aaa', '-bbb', '-ccc']);
});
test('optionalist string constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--golf',
    'volkswagen',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options.golf).toBe('volkswagen');
});
test('optionalist string constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--golf',
    'sports',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options.golf).toBe('sports');
});
test('optionalist string constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--GOLF',
    'VOLKSWAGEN',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options.GOLF).toBe('volkswagen');
});
test('optionalist string constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--GOLF',
    'SPORTS',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options.GOLF).toBe('sports');
});
test('optionalist number constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--hotel',
    '1234',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options.hotel).toBe(1234);
});
test('optionalist number constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--hotel',
    '5678',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options.hotel).toBe(5678);
});
test('optionalist number constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--hotel',
    '9012',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options.hotel).toBe(9012);
});
test('optionalist number range constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--india',
    '1000',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
  expect(options.india).toBe(1000);
});
test('optionalist number range constraints', () => {
  const options = optionalist.parse(OPTMAP, [
    '--delta',
    'required',
    '--india',
    '9999',
  ]);
  if ('charlie' in options) {
    throw new Error('must be unreachable');
  }
  if ('echo' in options) {
    throw new Error('must be unreachable');
  }
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
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({ a: { nature: ['default', 1] } } as any, ['-a', '2']),
  ).toThrow('The default value of the -a parameter must be a string.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({ a: { nature: ['default'] } } as any, ['-a', '2']),
  ).toThrow(
    'The default value of the -a parameter must be a string.: undefined',
  );
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse(
      { a: { type: 'boolean', nature: ['default', 1] } } as any,
      ['-a', '2'],
    ),
  ).toThrow('The default value of the -a parameter cannot be specified.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({ a: { type: 'boolean', nature: ['default'] } } as any, [
      '-a',
      '2',
    ]),
  ).toThrow(
    'The default value of the -a parameter cannot be specified.: undefined',
  );
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({ a: { type: 'boolean', nature: 'required' } } as any, [
      '-a',
      '2',
    ]),
  ).toThrow('The -a cannot set to be required.');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse(
      { a: { type: 'number', nature: ['default', '1'] } } as any,
      ['-a', '2'],
    ),
  ).toThrow('The default value of the -a parameter must be a number.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({ a: { type: 'number', nature: ['default'] } } as any, [
      '-a',
      '2',
    ]),
  ).toThrow(
    'The default value of the -a parameter must be a number.: undefined',
  );
});
test('optionalist helpstring', () => {
  const { name: packageName, version } = JSON.parse(
    fs.readFileSync(path.join(path.dirname(__dirname), 'package.json'), 'utf8'),
  );
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
  let save;
  [save, process.argv] = [process.argv, ['a', 'b', 'c']];
  expect(optionalist.parse({})[optionalist.unnamed]).toEqual(['c']);
});
