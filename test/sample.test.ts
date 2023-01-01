import { spawn } from 'child_process';
import { resolve } from 'path';
import { platform } from 'os';

const SETTIMEOUT_LIMIT = 0x7fffffff; // max 32-bit signed integer

function templateLiteral(...a: [TemplateStringsArray, ...unknown[]]): string {
  return a[0].reduce((r, e, i) => `${r}${a[i]}${e}`);
}

class CommandStream {
  #data?: Buffer;
  #str?: string;

  toString(): string {
    try {
      return (this.#str ??= this.#data?.toString('utf8') ?? '');
    } finally {
      this.#data = undefined;
    }
  }

  add(chunk: Buffer): void {
    this.#data = this.#data ? Buffer.concat([this.#data, chunk]) : chunk;
  }
  clear(): void {
    this.#data = undefined;
    this.#str = undefined;
  }
}

class CommandPrompt {
  #out = new CommandStream();
  #err = new CommandStream();
  #cwd = process.cwd();
  readonly env = Object.create(process.env) as typeof process.env;

  set cwd(cwd: string) {
    this.#cwd = cwd;
    process.stdout.write(`cwd: ${cwd}\n`);
  }

  get stdout(): string {
    return this.#out.toString();
  }

  get stderr(): string {
    return this.#err.toString();
  }

  exec(...args: [TemplateStringsArray, ...unknown[]]) {
    const commandline = templateLiteral(...args);
    process.stdout.write(`exec: ${commandline}\n`);
    this.#out.clear();
    this.#err.clear();
    const [command, ...parameters] = [
      ...(function* () {
        const re = /(?:"([^"]*(?:\\.[^"]*)*)"|\S+)+/g;
        let match;
        while ((match = re.exec(commandline)) !== null) {
          yield match[1]?.replace(/\\(.)/g, '$1') ?? match[0];
        }
      })(),
    ];
    return new Promise<void>((resolve, reject) => {
      const proc = spawn(command, parameters, {
        cwd: this.#cwd,
        env: this.env,
      });
      proc.stdout.on('data', (chunk: Buffer) => this.#out.add(chunk));
      proc.stderr.on('data', (chunk: Buffer) => this.#err.add(chunk));
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

const npx_ext = platform() === 'win32' ? '.cmd' : '';

describe('sample package test', () => {
  const prompt = new CommandPrompt();
  const helpString = (...args: [TemplateStringsArray, ...unknown[]]) => `${
    args[0].length > 1 || args[0][0] ? `${templateLiteral(...args)}\n\n` : ''
  }Version: sample 0.0.1
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
    jest.setTimeout(SETTIMEOUT_LIMIT);
  }, SETTIMEOUT_LIMIT);

  test('show help', async () => {
    await prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --help`;
    expect(prompt.stdout).toBe(`${helpString``}\n`);
    expect(prompt.stderr).toBe('');
  });

  test('initialize', async () => {
    await prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --init`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('show help, initialize', async () => {
    await expect(prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --help --init`).rejects.toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--help must be specified alone.`);
  });

  test('show help, script_filename', async () => {
    await expect(prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --help script_filename`).rejects.toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--help must be specified alone.`);
  });

  test('no params', async () => {
    await expect(prompt.exec`npx${npx_ext} ts-node sample/src/main.ts`).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--output required`);
  });

  test('no output filename', async () => {
    await expect(prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output`).rejects.toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--output needs a parameter as the output_filename`,
    );
  });

  test('specify output', async () => {
    await prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('specify output,config', async () => {
    await prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt --config config_file`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('specify output,config without config file', async () => {
    await expect(
      prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt --config`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--config needs a parameter as the config_filename`,
    );
  });

  test('specify output,timeout', async () => {
    await prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt --timeout 5000`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('specify output,timeout without timeout', async () => {
    await expect(
      prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt --timeout`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--timeout needs a number parameter as the parameter`,
    );
  });

  test('specify output,timeout with NaN', async () => {
    await expect(
      prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt --timeout NotANumber`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--timeout needs a number parameter as the parameter: NotANumber`,
    );
  });

  test('unknown option', async () => {
    await expect(prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --unknown`).rejects.toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`unknown options: --unknown`);
  });

  test('specify output,watch', async () => {
    await prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt --watch`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test('specify output, script_filename', async () => {
    await prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt script_filename`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
    await prompt.exec`npx${npx_ext} ts-node sample/src/main.ts --output output.txt -- --unknown`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });
});
