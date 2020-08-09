import * as fs from 'fs';
import * as path from 'path';

/**
 * 各オプションの説明文を取得するためのシンボル。
 */
export const helpString: unique symbol = Symbol('helpstring');
/**
 * 無名オプションの配列を取得するためのシンボル。
 */
export const unnamed: unique symbol = Symbol('unnamed');

/**
 * 各プロパティの詳細情報
 */
type OptionInformation = Readonly<
  (
    | {
        /**
         * - `string`を指定、もしくは省略すると文字列型のオプションとなる。
         */
        type?: 'string';
        /**
         * ヘルプ文字列でパラメーターとして使用される文字列(ex. --name your_name)
         */
        example?: string;
        /**
         * - `alone`を指定すると、単独で指定するオプションとなる。
         * - `required`を指定すると、必須オプションとなる。
         * - ['default', string]を指定すると、省略時に指定した値を設定する。
         */
        nature?: 'alone' | 'required' | readonly ['default', string];
      }
    | {
        /**
         * - `number`を指定すると数値型のオプションとなる。
         */
        type: 'number';
        /**
         * ヘルプ文字列でパラメーターとして使用される文字列(ex. --count max_count)
         */
        example?: string;
        /**
         * - `alone`を指定すると、単独で指定するオプションとなる。
         * - `required`を指定すると、必須オプションとなる。
         * - ['default', string]を指定すると、省略時に指定した値を設定する。
         */
        nature?: 'alone' | 'required' | readonly ['default', number];
      }
    | {
        /**
         * - `boolean`を指定すると真偽値型のオプションとなる。
         */
        type: 'boolean';
        /**
         * - `alone`を指定すると、単独で指定するオプションとなる。
         */
        nature?: 'alone';
      }
  ) & {
    /**
     * 別名。1文字だけの場合はprefixとして'-'が付き、2文字以上なら'--‘が付く
     */
    alias?: string | readonly string[];
    /**
     * オプションの説明。すべてのオプションの説明は[optionalist.helpString]で取得できる。
     */
    describe?: string;
  }
>;

/**
 * parseの第一引数の型。
 */
type OptionInformationMap = Readonly<{
  /**
   * 無名オプションの説明などを指定する。
   */
  [unnamed]?: {
    /**
     * コマンドラインオプションの説明で使用する無名オプションの名前。
     */
    example?: string;
    /**
     * 無名オプションの説明。
     */
    describe?: string;
    /**
     * 無名オプションの最小個数。
     */
    min?: number;
    /**
     * 無名オプションの最大個数。
     */
    max?: number;
  };
  /**
   * このコマンドの説明などを指定する。
   */
  [helpString]?: {
    /**
     * このコマンドの説明。
     */
    describe?: string;
    /**
     * コマンドラインに不備があったときに使用方法を表示して終了するときにはtrueを指定する。
     */
    showUsageOnError?: true;
  };
  /**
   * 名前付きオプションの詳細
   */
  [name: string]: OptionInformation;
}>;

/**
 * parseの返値の各プロパティの型
 */
type OptionType<OptionInfo extends OptionInformation> =
  // typeがbooleanなら真偽値だが、falseにすることはできないのでtrueになる。
  OptionInfo extends {type: 'boolean'}
    ? true // typeがnumberなら数値型
    : OptionInfo extends {type: 'number'}
    ? number // typeがstring、もしくは省略時には文字列型
    : OptionInfo extends {type: 'string'}
    ? string
    : OptionInfo extends {type: any}
    ? never
    : string;

/**
 * parseの返値に必ず存在しているプロパティの名前。
 */
type OptionsEssential<OPTMAP extends OptionInformationMap> = {
  [N in keyof Omit<OPTMAP, symbol>]: OPTMAP[N] extends {
    nature: 'required' | ['default', OptionType<OPTMAP[N]>];
  }
    ? N
    : never;
}[keyof Omit<OPTMAP, symbol>];

/**
 * parseの返値に存在していない可能性のあるプロパティの名前。
 */
type OptionsOptional<OPTMAP extends OptionInformationMap> = {
  [N in keyof Omit<OPTMAP, symbol>]: OPTMAP[N] extends {
    nature: 'required' | 'alone' | ['default', OptionType<OPTMAP[N]>];
  }
    ? never
    : N;
}[keyof Omit<OPTMAP, symbol>];

/**
 * 単独で指定されるオプションの返値の型
 */
type OptionsAlone<OPTMAP extends OptionInformationMap> = {
  [N in keyof Omit<OPTMAP, symbol>]: OPTMAP[N] extends {nature: 'alone'}
    ? {[N2 in N]: OptionType<OPTMAP[N2]>}
    : never;
}[keyof Omit<OPTMAP, symbol>];

/**
 * parseの返値の型。
 */
type Options<OPTMAP extends OptionInformationMap> = (
  | ({
      readonly [unnamed]: readonly string[];
    } & ({
      readonly [N in OptionsEssential<OPTMAP>]: OptionType<OPTMAP[N]>;
    } &
      {
        readonly [N in OptionsOptional<OPTMAP>]?: OptionType<OPTMAP[N]>;
      }))
  | OptionsAlone<OPTMAP>
) & {
  readonly [helpString]: string;
};

function checkNever(obj: never, message?: string): never {
  throw new Error(message ?? 'Illegal value: ${obj}');
}

/**
 * Iteratorをfor-ofやスプリット構文で使用できるように変換する。
 * @param itr
 */
function toIterable<T>(itr: Iterator<T>): Iterable<T> {
  return {
    [Symbol.iterator]() {
      return itr;
    },
  };
}

/**
 *
 * @param strings argsで指定された引数のうちいずれかがundefinedかnullならば空文字列を返す
 * @param args
 */
function optional(strings: TemplateStringsArray, ...args: any[]): string {
  return args.every(arg => arg !== undefined && arg !== null)
    ? strings[0] + args.map((arg, i) => arg + strings[i + 1]).join('')
    : '';
}

/**
 * 指定によっては使い方を表示して終了する例外を投げる。ユーザーの指定間違い。
 * @param strings
 * @param args
 */
function usage(strings: TemplateStringsArray, ...args: any[]): never {
  throw strings[0] + args.map((arg, i) => arg + strings[i + 1]).join('');
}

/**
 * 通常のエラー。プログラム上のミス。
 * @param strings
 * @param args
 */
function error(strings: TemplateStringsArray, ...args: any[]): never {
  throw new Error(
    strings[0] + args.map((arg, i) => arg + strings[i + 1]).join('')
  );
}

/**
 * コマンドラインをoptMapにしたがってパースする。
 * @param optMap 解析するための情報。
 * @param args 解析するコマンドライン。
 * 省略時はprocess.argvの3つめ以降をパースする
 * @throws optMapに問題がある場合はErrorを投げる。
 * argsに問題がある場合にはstringを投げる。
 */
export function parse<OptMap extends OptionInformationMap>(
  optMap: OptMap,
  args?: Iterable<string>
): Options<OptMap> {
  try {
    // argsが省略されたらprocess.argvの３つ目から始める
    const itr =
      args?.[Symbol.iterator]() ??
      (() => {
        const itr = process.argv[Symbol.iterator]();
        //２つスキップ
        itr.next();
        itr.next();
        return itr;
      })();
    // エイリアスを含めたオプションの詳細マップ
    const optMapAlias: {
      [name: string]: {name: string; info: OptionInformation};
    } = {};
    for (const [name, info] of Object.entries(optMap)) {
      // 1文字だけのときは`-`も一つ
      const optArg = `${name.length > 1 ? '--' : '-'}${name}`;
      // エイリアスを展開
      optMapAlias[optArg] = {name, info};
      if (info.alias) {
        for (const alias of typeof info.alias === 'string'
          ? [info.alias]
          : info.alias) {
          const optAlias = `${alias.length > 1 ? '--' : '-'}${alias}`;
          optMapAlias[optAlias] = {name, info};
        }
      }
      if (info.type === 'boolean' && (info as any).nature === 'required') {
        error`The ${optArg} cannot set to be required.`;
      }
      if (info.nature?.[0] === 'default') {
        const defaultValue = info.nature[1];
        switch (info.type) {
          case 'boolean':
            // boolean型ではdefault値は指定できない
            error`The default value of the ${optArg} parameter cannot be specified.: ${defaultValue}`;
          case 'number':
            // number型なのに数値以外が指定された
            if (typeof defaultValue !== 'number') {
              error`The default value of the ${optArg} parameter must be a number.: ${defaultValue}`;
            }
            break;
          case undefined:
          case 'string':
            // string型なのに文字列以外が指定された
            if (typeof defaultValue !== 'string') {
              error`The default value of the ${optArg} parameter must be a string.: ${defaultValue}`;
            }
            break;
          default:
            checkNever(
              info,
              `unknown type: ${
                (info as OptionInformation).type
              } for the ${optArg} parameter`
            );
        }
      }
    }
    // ↑ optMapの不備はここから上でerror`～`で投げる
    // ↓ コマンドラインの不備はここから下でusage`～`で投げる 
    // 無名オプション
    const unnamedList: string[] = [];
    // 名前付きオプション
    const options: {[name: string]: string | number | true} = {};
    // 単独で指定されるはずのオプション
    let aloneOpt: string | undefined;
    // 一つ前に指定されたオプション
    let prevOpt: string | undefined;
    for (const arg of toIterable(itr)) {
      if (arg === '--') {
        if (aloneOpt) {
          // 単独で指定されるはずなのに他のオプションが指定された
          usage`${aloneOpt || arg} must be specified alone.`;
        }
        // --以降はすべて無名オプション
        unnamedList.push(...toIterable(itr));
        break;
      }
      if (!optMapAlias[arg]) {
        if (arg[0] === '-') {
          // optMapにないオプションが指定された
          usage`unknown options: ${arg}`;
        }
        unnamedList.push(arg);
        continue;
      }
      const {name, info} = optMapAlias[arg];
      if (aloneOpt || (prevOpt && info.nature === 'alone')) {
        // 単独で指定されるはずなのに他のオプションが指定された
        usage`${aloneOpt || arg} must be specified alone.`;
      }
      prevOpt = arg;
      if (info.nature === 'alone') {
        aloneOpt = arg;
      }
      switch (info.type) {
        case 'boolean':
          options[name] = true;
          continue;
        case 'number': {
          const r = itr.next();
          if (r.done) {
            usage`${arg} needs a number parameter${optional` as the ${info.example}`}`;
          }
          const value = r.value;
          if (!isFinite(+value)) {
            usage`${arg} needs a number parameter${optional` as the ${info.example}`}: ${value}`;
          }
          options[name] = +value;
          continue;
        }
        case undefined:
        case 'string': {
          const r = itr.next();
          if (r.done) {
            usage`${arg} needs a parameter${optional` as the ${info.example}`}`;
          }
          options[name] = r.value;
          continue;
        }
        default:
          checkNever(
            info,
            `unknown type: ${
              (info as OptionInformation).type
            } for the ${arg} parameter`
          );
      }
    }
    // 単独オプションが指定されていなかったらデフォルト値の設定を行う
    if (!aloneOpt) {
      for (const [name, info] of Object.entries(optMap)) {
        const optArg = `${name.length > 1 ? '--' : '-'}${name}`;
        // 指定されていればスキップ
        if (name in options) {
          continue;
        }
        // requiredなのに指定されていなかったらエラー
        if (info.nature === 'required') {
          usage`${optArg} required`;
        }
        // デフォルト値が指定されていたら設定
        if (info.nature?.[0] === 'default') {
          options[name] = info.nature[1];
        }
      }
      const min = optMap[unnamed]?.min ?? NaN;
      if (unnamedList.length < min) {
        usage`At least ${min} ${
          optMap[unnamed]?.example ?? 'unnamed_parameters'
        } required.`;
      }
      const max = optMap[unnamed]?.max ?? NaN;
      if (unnamedList.length > max) {
        usage`Too many ${
          optMap[unnamed]?.example ?? 'unnamed_parameters'
        } specified(up to ${max}).`;
      }
      // 無名オプションを追加
      Object.defineProperty(options, unnamed, {
        value: Object.freeze(unnamedList),
      });
    } else if (unnamedList.length > 0) {
      usage`${aloneOpt} must be specified alone.`;
    }
    // ヘルプ用文字列を追加して終了
    return Object.freeze(Object.defineProperty(options, helpString, {
      get: () => makeHelpString(optMap),
    }));
  } catch (ex) {
    if (optMap[helpString]?.showUsageOnError && typeof ex === 'string') {
      // showUsageOnErrorが指定されていた場合は、解析時にエラーが発生したらヘルプを表示して終了する
      process.stderr.write(`${ex}\n\n${makeHelpString(optMap)}`);
      process.exit(1);
    }
    throw ex;
  }
}

/**
 * 実行中のコマンドに用意されているpackage.jsonの内容を解析して返す。
 *
 * @returns
 */
function loadPackageJson() {
  for (
    let dirname =
        ('mainModule' in process)
          ? path.dirname(
              ((process as unknown) as {mainModule: {filename: string}})[
                'mainModule'
              ].filename
            )
          : __dirname,
      prev;
    dirname !== prev;
    prev = dirname, dirname = path.dirname(prev)
  ) {
    try {
      // node_modulesまで親ディレクトリをさかのぼる
      if (path.basename(dirname) === 'node_modules') {
        dirname = path.dirname(dirname);
      } else {
        const stat = fs.statSync(path.join(dirname, 'node_modules'));
        // node_modulesがディレクトリでなければさかのぼりを継続
        if (!stat.isDirectory()) {
          continue;
        }
      }
      // node_modulesを見つけたらそこのpackage.jsonを読み込んで解析
      return JSON.parse(
        fs.readFileSync(path.join(dirname, 'package.json'), 'utf8')
      );
    } catch (ex) {
      if (ex.code !== 'ENOENT') {
        // ファイルが見つからない、以外のエラーはエラーとする
        throw ex;
      }
      // ファイルが見つからなかったらさかのぼりを継続
    }
  }
  // package.jsonが見つからなければエラー
  error`package.json not found`;
}

/**
 * コマンドラインオプションのヘルプ用文字列を生成する。
 *
 * package.jsonの内容やparseメソッドの引数として渡されたコマンドラインオプションの詳細情報から自動的に生成する。
 *
 * @template OptMap
 * @param {OptMap} optMap コマンドラインオプションの詳細情報。
 * @returns {string} コマンドラインオプションのヘルプ用文字列。
 */
function makeHelpString<OptMap extends OptionInformationMap>(
  optMap: OptMap
): string {
  const {version, name: processName} = loadPackageJson();
  let help = `Version: ${processName} ${version}\nUsage:\n`;
  const requireds: string[] = [];
  const options: string[] = [];
  const alones: string[] = [];
  for (const [name, info] of Object.entries(optMap)) {
    const example = `${name.length > 1 ? '--' : '-'}${name}${
      info.type === 'boolean' ? '' : ' ' + (info.example || 'parameter')
    }`;
    (info.nature === 'alone'
      ? alones
      : info.nature === 'required'
      ? requireds
      : options
    ).push(example);
  }
  if (requireds.length + options.length > 0) {
    const line = [...requireds, ...options.map(o => `[${o}]`)];
    const info = optMap[unnamed];
    if (info) {
      line.push(`[--] [${info.example || 'parameter'}...]`);
    }
    alones.unshift(line.join(' '));
  }
  help += alones.map(option => `  npx ${processName} ${option}\n`).join('');
  {
    const info = optMap[helpString];
    if (info?.describe) {
      help += `\nDescription:\n${indent(info.describe, '  ')}`;
    }
  }
  help += '\nOptions:\n';
  for (const [name, info] of Object.entries(optMap)) {
    const optNames = [name];
    if (info.alias) {
      if (typeof info.alias === 'string') {
        optNames.push(info.alias);
      } else {
        optNames.push(...info.alias);
      }
    }
    help += `  ${optNames
      .map(n => `${n.length > 1 ? '--' : '-'}${n}`)
      .join(', ')}${
      info.type === 'boolean' ? '' : ' ' + (info.example || 'parameter')
    }\n${indent(info.describe, '    ')}`;
  }
  const info = optMap[unnamed];
  if (info) {
    help += `  [--] [${info.example || 'parameter'}...]\n${indent(
      info.describe,
      '    '
    )}`;
  }
  return help;
}

/**
 * ヘルプ文字列のインデントを調整する。
 *
 * @param {(string | undefined)} text
 * @param {string} indent
 * @returns {string}
 */
function indent(text: string | undefined, indent: string): string {
  // 先頭、末尾の空白行を除去
  text = text?.replace(/^(?:[ \t]*[\r\n]+)+|(?:[\r\n]+[ \t]*)+$/g, '');
  // undefinedもしくは空白以外の文字が見つからなかったら空文字列を返す
  if (!text?.match(/[^ \t]/)) {
    return '';
  }
  // 、行末の空白を除去しつつ一行ごとに分割
  const lines = text.replace(/^[ \t]+$/, '').split(/[ \t]*\r?\n/);
  // 行頭の空白で共通のものを抽出
  let srcIindent: number | undefined;
  for (const line of lines) {
    const [current] = line.match(/^[ \t]+/) || [];
    if (!current) {
      srcIindent = 0;
    } else if (srcIindent === undefined) {
      srcIindent = current.length;
    } else {
      for (let l = Math.min(srcIindent, current.length); l >= 0; --l) {
        if (lines[0].slice(0, l) === line.slice(0, l)) {
          srcIindent = l;
          break;
        }
      }
    }
    if (!srcIindent) {
      break;
    }
  }
  // 各行頭に共通の空白文字があれば、共通部分だけを指定されたインデントと置き換え
  // なければ、行頭の空白文字をすべて除去して指定されたインデントを入れる
  const re =
    srcIindent && srcIindent > 0
      ? new RegExp(`^${lines[0].slice(0, srcIindent)}`)
      : /^[ \t]*/;
  return lines.map(line => line.replace(re, indent) + '\n').join('');
}
