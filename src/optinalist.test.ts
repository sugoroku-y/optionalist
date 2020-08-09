import * as optionalist from './index';

const OPTMAP = {
  [optionalist.helpString]: {
    describe: `
    UnitTest for optionalist.
      test for indent
    `
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
    alias: ['charl', 'c'],
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
  [optionalist.unnamed]: {
    example: 'argument',
    describe: 'arguments for command'
  }
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
    optionalist.parse(OPTMAP, ['--alpha', 'bet', '--delta', 'test'])
  ).toEqual({alpha: 'bet', delta: 'test', foxtrot: 'racoondog', bravo: 1});
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
    ])
  ).toEqual({alpha: 'bet', delta: 'test', foxtrot: 'racoondog', bravo: 2});
});
test('optionalist alone', () => {
  expect(optionalist.parse(OPTMAP, ['--charlie'])).toEqual({charlie: true});
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
  expect(options[optionalist.unnamed]).toEqual(['--aaa', '-bbb', '-ccc']);
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, [])).toThrow('--delta required');
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--unknown'])).toThrow(
    'unknown options: --unknown'
  );
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--alpha'])).toThrow(
    '--alpha needs a parameter'
  );
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--bravo'])).toThrow(
    '--bravo needs a number parameter as the b-value'
  );
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--bravo', 'abc'])).toThrow(
    '--bravo needs a number parameter as the b-value: abc'
  );
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse(OPTMAP, ['--bravo', 'abc', '--charlie'])
  ).toThrow('--bravo needs a number parameter as the b-value: abc');
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--charlie', '111'])).toThrow(
    '--charlie must be specified alone.'
  );
});
test('optionalist usage error', () => {
  expect(() => optionalist.parse(OPTMAP, ['--alpha', 'beta', '--charlie'])).toThrow(
    '--charlie must be specified alone.'
  );
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse({[optionalist.unnamed]: {min: 2, max: 3}}, ['111'])
  ).toThrow('At least 2 unnamed_parameters required.');
});
test('optionalist usage error', () => {
  expect(() =>
    optionalist.parse({[optionalist.unnamed]: {min: 2, max: 3}}, [
      '111',
      '222',
      '333',
      '444',
    ])
  ).toThrow('Too many unnamed_parameters specified(up to 3).');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({a: {nature: ['default', 1]}} as any, ['-a', '2'])
  ).toThrow('The default value of the -a parameter must be a string.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({a: {nature: ['default']}} as any, ['-a', '2'])
  ).toThrow(
    'The default value of the -a parameter must be a string.: undefined'
  );
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({a: {type: 'boolean', nature: ['default', 1]}} as any, [
      '-a',
      '2',
    ])
  ).toThrow('The default value of the -a parameter cannot be specified.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({a: {type: 'boolean', nature: ['default']}} as any, [
      '-a',
      '2',
    ])
  ).toThrow(
    'The default value of the -a parameter cannot be specified.: undefined'
  );
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({a: {type: 'boolean', nature: 'required'}} as any, [
      '-a',
      '2',
    ])
  ).toThrow('The -a cannot set to be required.');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({a: {type: 'number', nature: ['default', '1']}} as any, [
      '-a',
      '2',
    ])
  ).toThrow('The default value of the -a parameter must be a number.: 1');
});
test('optionalist invalid optMap', () => {
  expect(() =>
    optionalist.parse({a: {type: 'number', nature: ['default']}} as any, [
      '-a',
      '2',
    ])
  ).toThrow(
    'The default value of the -a parameter must be a number.: undefined'
  );
});
test('optionalist helpstring', () => {
  expect(optionalist.parse(OPTMAP, ['--charlie'])[optionalist.helpString]).toBe(`Version: optionalist 1.0.0
Usage:
  npx optionalist --delta parameter [--alpha parameter] [--bravo b-value] [--foxtrot parameter] [--] [argument...]
  npx optionalist --charlie
  npx optionalist --echo parameter

Description:
  UnitTest for optionalist.
    test for indent

Options:
  --alpha parameter
  --bravo, -b b-value
    b value
  --charlie, --charl, -c
  --delta parameter
  --echo parameter
  --foxtrot parameter
  [--] [argument...]
    arguments for command
`);
});