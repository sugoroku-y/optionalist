import { spawn } from 'child_process';
import { extname, resolve } from 'path';
import { platform } from 'os';
import { existsSync } from 'fs';

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
    const [_command, ...parameters] = (function* () {
      // matchAllが使えない環境向けに自前で同等の処理
      for (const match of function*(str, re) {
        let match;
        while (!!(match = re.exec(str))) {
          yield match;
        }
      }(commandline, /(?:"[^"]*(?:\\.[^"]*)*"|\S+)+/g)) {
        yield match[0].replace(
          /"([^"]*(?:\\.[^"]*)*)"|\S+/gy,
          (whole, quoted: string | undefined) =>
            // ""で囲われているところは""を外してエスケープを解除
            quoted?.replace(/\\./g, ch => ch[1]) ?? whole,
        );
      }
    })();
    const command = (_command => {
      // Windowsでcommandに拡張子の指定がなくexe以外の拡張子のものしかPATHに存在していないときspawnで実行できないので、自前で検索して拡張子を付加する
      BLOCK: {
        if (extname(_command)) {
          // 拡張子が指定されているなら何もしない
          break BLOCK;
        }
        if (platform() !== 'win32') {
          // Windows以外では何もしない
          break BLOCK;
        }
        if (!process.env.PATH || !process.env.PATHEXT) {
          // 環境変数PATHとPATHEXTが設定されていなければ何もしない
          break BLOCK;
        }
        // 実行形式として検索する拡張子
        const pathext = process.env.PATHEXT.split(';');
        // PATHを先頭から検索
        for (const p of process.env.PATH.split(';')) {
          const ext = pathext.find(ext =>
            existsSync(resolve(p, `${_command}${ext}`)),
          );
          if (ext) {
            return `${_command}${ext}`;
          }
        }
      }
      return _command;
    })(_command);
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

describe('sample package test', () => {
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
    jest.setTimeout(SETTIMEOUT_LIMIT);
  });

  test.concurrent('show help', async () => {
    const prompt = new CommandPrompt();
    await prompt.exec`npx ts-node sample/ --help`;
    expect(prompt.stdout).toBe(`${helpString``}\n`);
    expect(prompt.stderr).toBe('');
  });

  test.concurrent('initialize', async () => {
    const prompt = new CommandPrompt();
    await prompt.exec`npx ts-node sample/ --init`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test.concurrent('show help, initialize', async () => {
    const prompt = new CommandPrompt();
    await expect(
      prompt.exec`npx ts-node sample/ --help --init`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--help must be specified alone.`);
  });

  test.concurrent('show help, script_filename', async () => {
    const prompt = new CommandPrompt();
    await expect(
      prompt.exec`npx ts-node sample/ --help script_filename`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--help must be specified alone.`);
  });

  test.concurrent('no params', async () => {
    const prompt = new CommandPrompt();
    await expect(prompt.exec`npx ts-node sample/`).rejects.toThrow(
      'FAILED(exit code: 1)',
    );
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`--output required`);
  });

  test.concurrent('no output filename', async () => {
    const prompt = new CommandPrompt();
    await expect(
      prompt.exec`npx ts-node sample/ --output`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--output needs a parameter as the output_filename`,
    );
  });

  test.concurrent('specify output', async () => {
    const prompt = new CommandPrompt();
    await prompt.exec`npx ts-node sample/ --output output.txt`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test.concurrent('specify output,config', async () => {
    const prompt = new CommandPrompt();
    await prompt.exec`npx ts-node sample/ --output output.txt --config config_file`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test.concurrent('specify output,config without config file', async () => {
    const prompt = new CommandPrompt();
    await expect(
      prompt.exec`npx ts-node sample/ --output output.txt --config`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--config needs a parameter as the config_filename`,
    );
  });

  test.concurrent('specify output,timeout', async () => {
    const prompt = new CommandPrompt();
    await prompt.exec`npx ts-node sample/ --output output.txt --timeout 5000`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test.concurrent('specify output,timeout without timeout', async () => {
    const prompt = new CommandPrompt();
    await expect(
      prompt.exec`npx ts-node sample/ --output output.txt --timeout`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--timeout needs a number parameter as the parameter`,
    );
  });

  test.concurrent('specify output,timeout with NaN', async () => {
    const prompt = new CommandPrompt();
    await expect(
      prompt.exec`npx ts-node sample/ --output output.txt --timeout NotANumber`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(
      helpString`--timeout needs a number parameter as the parameter: NotANumber`,
    );
  });

  test.concurrent('unknown option', async () => {
    const prompt = new CommandPrompt();
    await expect(
      prompt.exec`npx ts-node sample/ --unknown`,
    ).rejects.toThrow('FAILED(exit code: 1)');
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe(helpString`unknown options: --unknown`);
  });

  test.concurrent('specify output,watch', async () => {
    const prompt = new CommandPrompt();
    await prompt.exec`npx ts-node sample/ --output output.txt --watch`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test.concurrent('specify output, script_filename', async () => {
    const prompt = new CommandPrompt();
    await prompt.exec`npx ts-node sample/ --output output.txt script_filename`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });

  test.concurrent('specify output, --unknown', async () => {
    const prompt = new CommandPrompt();
    await prompt.exec`npx ts-node sample/ --output output.txt -- --unknown`;
    expect(prompt.stdout).toBe('');
    expect(prompt.stderr).toBe('');
  });
});
