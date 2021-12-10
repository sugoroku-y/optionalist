import { spawn } from 'child_process';
import { resolve } from 'path';

function templateLiteral(
  ...args: [] | [string] | [TemplateStringsArray, ...unknown[]]
): string {
  return args[0] === undefined
    ? ''
    : typeof args[0] === 'string'
    ? args[0]
    : args[0].reduce((r, e, i) => `${r}${args[i]}${e}`);
}

class CommandPrompt {
  private stdio: { out: { data?: Buffer }; err: { data?: Buffer } } = {
    out: {},
    err: {},
  };
  #cwd = process.cwd();
  readonly env = Object.create(process.env) as typeof process.env;

  set cwd(cwd: string) {
    this.#cwd = cwd;
    process.stdout.write(`cwd: ${cwd}\n`);
  }

  get stdout(): string {
    return this.stdio.out.data?.toString('utf8') ?? '';
  }

  get stderr(): string {
    return this.stdio.err.data?.toString('utf8') ?? '';
  }

  exec(...args: [string] | [TemplateStringsArray, ...unknown[]]) {
    const commandline = templateLiteral(...args);
    process.stdout.write(`exec: ${commandline}\n`);
    this.stdio.out = {};
    this.stdio.err = {};
    const [command, ...parameters] = [
      ...commandline.matchAll(/(?:"[^"]*(?:\\.[^"]*)*"|\S+)+/g),
    ].map(match =>
      match[0].replace(/"[^"]*(?:\\.[^"]*)*"/g, quoted =>
        quoted.slice(1, -1).replace(/\\./g, match => match.slice(1)),
      ),
    );
    const concatChunk = (stream: { data?: Buffer }, chunk: Buffer) =>
      (stream.data = stream.data ? Buffer.concat([stream.data, chunk]) : chunk);
    return new Promise<void>((resolve, reject) => {
      const proc = spawn(command, parameters, {
        cwd: this.#cwd,
        env: this.env,
      });
      proc.stdout.on('data', (chunk: Buffer) =>
        concatChunk(this.stdio.out, chunk),
      );
      proc.stderr.on('data', (chunk: Buffer) =>
        concatChunk(this.stdio.err, chunk),
      );
      proc
        .on('close', code => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FAILED(exit code: ${code})`));
          }
        })
        .on('error', err => reject(err));
    });
  }
}

async function unpromise<T>(promise: Promise<T>): Promise<() => T> {
  try {
    const r = await promise;
    return () => r;
  } catch (e) {
    return () => {
      throw e;
    };
  }
}

describe('sample package test', () => {
  const prompt = new CommandPrompt();
  const helpString = (
    ...args: [TemplateStringsArray, ...unknown[]] | [string] | []
  ) => `${args[0] ? `${templateLiteral(...args)}\n\n` : ''}Version: sample 0.0.1
Usage:
  npx sample --output output_filename [--config config_filename] [--watch] [--timeout parameter] [--] [script_filename...]
  npx sample --help
  npx sample --init

Description:
  The description for command.

Options:
  --help, -?, -h
    Show this help.
  --init
    Initialize your project.
  --output output_filename
    Specify the filename to output.
  --config config_filename
    Specify the configuration file for your project.
  --watch
    Specify when you want to set the watch mode.
  --timeout parameter
  [--] [script_filename...]
    Specify the script filename(s) to execute.
`;

  beforeAll(async () => {
    prompt.cwd = resolve(__dirname, '..');
    await prompt.exec(`npm run build`);
    prompt.cwd = resolve(__dirname, '..', 'sample');
    await prompt.exec(`npm ci`);
    await prompt.exec(`npm run build`);
  }, 30000);

  test('show help', async () => {
    await prompt.exec`node ./ --help`;
    expect(prompt.stdout).toBe(`${helpString()}\n`);
    expect(prompt.stderr).toBe('');
  });

  test('initialize', async () => {
    await prompt.exec`node ./ --init`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('show help, initialize', async () => {
    expect(await unpromise(prompt.exec`node ./ --help --init`)).toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--help must be specified alone.`);
  });

  test('show help, script_filename', async () => {
    expect(
      await unpromise(prompt.exec`node ./ --help script_filename`),
    ).toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--help must be specified alone.`);
  });

  test('no params', async () => {
    expect(await unpromise(prompt.exec`node ./`)).toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--output required`);
  });

  test('no output filename', async () => {
    expect(await unpromise(prompt.exec`node ./ --output`)).toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--output needs a parameter as the output_filename`,
    );
  });

  test('specify output', async () => {
    await prompt.exec`node ./ --output output.txt`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('specify output,config', async () => {
    await prompt.exec`node ./ --output output.txt --config config_file`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('specify output,config without config file', async () => {
    expect(
      await unpromise(prompt.exec`node ./ --output output.txt --config`),
    ).toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--config needs a parameter as the config_filename`,
    );
  });

  test('specify output,timeout', async () => {
    await prompt.exec`node ./ --output output.txt --timeout 5000`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('specify output,timeout without timeout', async () => {
    expect(
      await unpromise(prompt.exec`node ./ --output output.txt --timeout`),
    ).toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--timeout needs a number parameter as the parameter`,
    );
  });

  test('specify output,timeout with NaN', async () => {
    expect(
      await unpromise(
        prompt.exec`node ./ --output output.txt --timeout NotANumber`,
      ),
    ).toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--timeout needs a number parameter as the parameter: NotANumber`,
    );
  });

  test('unknown option', async () => {
    expect(await unpromise(prompt.exec`node ./ --unknown`)).toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`unknown options: --unknown`);
  });

  test('specify output,watch', async () => {
    await prompt.exec`node ./ --output output.txt --watch`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('specify output, script_filename', async () => {
    await prompt.exec`node ./ --output output.txt script_filename`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
    await prompt.exec`node ./ --output output.txt -- --unknown`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });
});
