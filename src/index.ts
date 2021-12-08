import * as fs from 'fs';
import { resolve } from 'path';

function hasProperty<NAME extends string | number | symbol>(
  o: unknown,
  name: NAME,
): o is { [N in NAME]: unknown } {
  return typeof o === 'object' && o !== null && name in o;
}

type ExcludeEmpty<T> = { [K in never]: never } extends T ? never : T;

type Normalize<T> = T extends { [K in never]: never }
  ? { [K in keyof T]: T[K] }
  : never;

/**
 * 各オプションの説明文を取得するためのシンボル。
 */
export const helpString: unique symbol = Symbol('helpstring');
/**
 * 無名オプションの配列を取得するためのシンボル。
 */
export const unnamed: unique symbol = Symbol('unnamed');

/**
 * 共通オプション情報
 */
type OptionBase<T extends string | number | boolean> = (T extends boolean
  ? { readonly type: 'boolean' }
  : T extends number
  ? { type: 'number' }
  : { readonly type?: 'string' }) & {
  /**
   * オプションの型。
   *
   * - `string`を指定、もしくは省略すると文字列型のオプションとなる。
   * - `number`を指定すると数値型のオプションとなる。
   * - `boolean`を指定すると真偽値型のオプションとなる。
   */
  type?: 'string' | 'number' | 'boolean';
  /**
   * 別名。1文字だけの場合はprefixとして'-'が付き、2文字以上なら'--‘が付く
   */
  alias?: string | readonly string[];
  /**
   * オプションの説明。すべてのオプションの説明は[optionalist.helpString]で取得できる。
   */
  describe?: string;
  /**
   * ヘルプ文字列でパラメーターとして使用される文字列(ex. --name your_name)
   */
  example?: string;
  /**
   * aloneにtrueを指定すると、単独で指定するオプションとなる。
   */
  alone?: true;
  /**
   * requiredにtrueを指定すると、必須オプションとなる。
   */
  required?: true;
  /**
   * defaultに値を指定すると、省略時にその値が設定される。
   */
  default?: T extends string | number ? T : never;
};

/** オプションの特性無し */
type OptionNonNature = {
  /** alone指定なし */
  alone?: never;
  /** required指定なし */
  required?: never;
  /** default指定なし */
  default?: never;
};

/** オプションの特性: 単独で指定 */
type OptionAlone = {
  alone: true;
  /**
   *
   * **aloneを指定したときは、 同時にrequiredを指定できない**。
   */
  required?: never;
  /**
   *
   * **aloneを指定したときは、同時にdefaultを指定できない。**
   */
  default?: never;
};

/** オプションの特性: 省略不可 */
type OptionRequired = {
  required: true;
  /**
   *
   * **requiredを指定したときは、同時にaloneを指定できない。**
   */
  alone?: never;
  /**
   *
   * **requiredを指定したときは、同時にdefaultを指定できない。**
   */
  default?: never;
};

/** オプションの特性: 省略時のデフォルト値あり */
type OptionDefaultSpecified<T extends string | number> = {
  default: T;
  /**
   *
   * **defaultを指定したときは、同時にaloneを指定できない。**
   */
  alone?: never;
  /**
   *
   * **defaultを指定したときは、同時にrequiredを指定できない。**
   */
  required?: never;
};

/** 文字型/数値型オプションの共通情報 */
type OptionWithValue<T extends string | number> = OptionBase<T> &
  (OptionNonNature | OptionAlone | OptionRequired | OptionDefaultSpecified<T>);

/** 文字列型のオプション情報 */
type StringOption = OptionWithValue<string> & {
  /**
   * 文字列として指定できる候補。ここで設定した以外の文字列を指定するとエラーとなる。
   */
  constraints?: readonly string[];
  /**
   * constraintsを指定したときに、大文字小文字を区別しない場合にはtrueを指定する。
   */
  ignoreCase?: true;
};
/** 数値型のオプション情報 */
type NumberOption = OptionWithValue<number> & {
  /**
   * 数値として指定できる制約。配列の場合は、ここで設定した値以外を指定するとエラーになる。
   */
  constraints?:
    | readonly number[]
    | {
        /**
         * 数値として指定できる最小値。ここで設定した数値未満の数値が指定されるとエラーになる。
         */
        readonly min?: number;
        /**
         * 数値として指定できる最大値。ここで設定した数値より大きい数値が指定されるとエラーになる。
         */
        readonly max?: number;
      };
};
/** 真偽値型のオプション情報 */
type FlagOption = OptionBase<boolean> & (OptionNonNature | OptionAlone);

/**
 * 各プロパティの詳細情報
 */
type OptionInformation = Normalize<NumberOption | FlagOption | StringOption>;

/**
 * parseの第一引数の型。
 */
type OptionInformationMap = Readonly<{
  /**
   * 無名オプションの説明などを指定する。
   */
  [unnamed]?: Readonly<{
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
  }>;
  /**
   * このコマンドの説明などを指定する。
   */
  [helpString]?: Readonly<{
    /**
     * このコマンドの説明。
     */
    describe?: string;
    /**
     * コマンドラインに不備があったときに使用方法を表示して終了するときにはtrueを指定する。
     */
    showUsageOnError?: true;
  }>;
  /**
   * 名前付きオプションの詳細
   */
  [name: string]: Readonly<OptionInformation>;
}>;

/**
 * parseの返値の各プロパティの型
 */
type OptionType<OptionInfo extends OptionInformation> =
  // typeの値で振り分け
  OptionInfo extends { type: 'boolean' }
    ? // typeがbooleanなら真偽値
      true // だが、falseにすることはできないのでtrueになる。
    : OptionInfo extends { type: 'number' }
    ? // typeがnumberなら数値型
      OptionInfo extends { constraints: readonly number[] }
      ? // constraintsが指定されていれば数値の列挙型
        OptionInfo['constraints'][number]
      : number
    : OptionInfo extends { type: 'string' }
    ? // typeがstringなら文字列型
      OptionInfo extends { constraints: readonly string[] }
      ? // constraintsが指定されていれば文字列の列挙型
        OptionInfo['constraints'][number]
      : string
    : OptionInfo extends { type: unknown }
    ? // typeにその他の値が指定されていることはない
      never
    : // type省略時にも文字列型
    OptionInfo extends { constraints: readonly string[] }
    ? // constraintsが指定されていれば文字列の列挙型
      OptionInfo['constraints'][number]
    : string;

/**
 * parseの返値に必ず存在しているプロパティ。
 */
type OptionsEssential<OPTMAP extends OptionInformationMap> = {
  [N in keyof Omit<OPTMAP, symbol> as OPTMAP[N] extends
    | {
        required: true;
      }
    | { default: OptionType<OPTMAP[N]> }
    ? N
    : never]: OptionType<OPTMAP[N]>;
};

/**
 * parseの返値に存在していない可能性のあるプロパティ。
 */
type OptionsOptional<OPTMAP extends OptionInformationMap> = {
  [N in keyof Omit<OPTMAP, symbol> as OPTMAP[N] extends
    | {
        required: true;
      }
    | { alone: true }
    | { default: OptionType<OPTMAP[N]> }
    ? never
    : N]?: OptionType<OPTMAP[N]>;
};

/**
 * 単独で指定されるオプション
 */
type OptionsAlone<OPTMAP extends OptionInformationMap> = {
  [N in keyof Omit<OPTMAP, symbol> as OPTMAP[N] extends { alone: true }
    ? N
    : never]: OptionType<OPTMAP[N]>;
};

type OptionUnnamed = {
  readonly [unnamed]: readonly string[];
};

type OptionHelpString = {
  readonly [helpString]: string;
};

/**
 * parseの返値の型。
 */
type Options<OPTMAP extends OptionInformationMap> = Normalize<
  (
    | (OptionUnnamed & OptionsEssential<OPTMAP> & OptionsOptional<OPTMAP>)
    | ExcludeEmpty<OptionsAlone<OPTMAP>>
  ) &
    OptionHelpString
>;

/**
 * never型になっているかどうかチェックする。
 *
 * never型であれば本来この関数は呼び出されないはずだが、
 * TypeScript以外から使用されたときには
 * この関数が呼び出される可能性もあるので
 * 実装としては例外を投げておく。
 *
 * @param {never} obj
 * @param {string} [message]
 * @returns {never}
 */
function checkNever(obj: never, message: string): never {
  throw new Error(message);
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
 * 指定によっては使い方を表示して終了する例外を投げる。ユーザーの指定間違い。
 * @param strings
 * @param args
 */
function usage(strings: TemplateStringsArray, ...args: unknown[]): never {
  throw strings.reduce((r, e, i) => r + String(args[i - 1]) + e);
}

/**
 * 通常のエラー。プログラム上のミス。
 * @param strings
 * @param args
 */
function error(strings: TemplateStringsArray, ...args: unknown[]): never {
  throw new Error(strings.reduce((r, e, i) => r + String(args[i - 1]) + e));
}

function isNumberArray(
  o: readonly number[] | { min?: number; max?: number },
): o is readonly number[] {
  return Array.isArray(o);
}

/**
 * オプション情報から例示用文字列を取得。
 *
 * 指定がなければdefで指定された文字列を使う。
 *
 * @param {{ example?: string }} info
 * @param {string} [def='parameter']
 * @returns {string}
 */
function example(info: { example?: string }, def = 'parameter'): string {
  return info.example ?? def;
}
/**
 * コマンドラインをoptMapにしたがって解析する。
 *
 * @param optMap 解析するための情報。
 * @param args 解析するコマンドライン。
 * 省略時はprocess.argvの3つめから開始する。
 * @throws optMapに問題がある場合はErrorを投げる。
 * argsに問題がある場合にはstringを投げる。
 */
export function parse<OptMap extends OptionInformationMap>(
  optMap: OptMap,
  args?: Iterable<string>,
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
      [name: string]: { name: string; info: OptionInformation };
    } = {};
    for (const [name, info] of Object.entries(optMap)) {
      // 1文字だけのときは`-`も一つ
      const optArg = `${name.length > 1 ? '--' : '-'}${name}`;
      // 型指定のチェック
      switch (info.type) {
        case undefined:
        case 'string':
        case 'number':
        case 'boolean':
          break;
        // TypeScriptのエラーになるので他のタイプは指定できないはずだが念のため
        default:
          checkNever(
            info,
            `unknown type: ${
              (info as OptionInformation).type
            } for the ${optArg} parameter`,
          );
      }
      // エイリアスを展開
      optMapAlias[optArg] = { name, info };
      if (info.alias) {
        for (const alias of typeof info.alias === 'string'
          ? [info.alias]
          : info.alias) {
          const optAlias = `${alias.length > 1 ? '--' : '-'}${alias}`;
          optMapAlias[optAlias] = { name, info };
        }
      }
      if (info.type === 'boolean' && info.required) {
        error`The ${optArg} cannot set to be required.`;
      }
      if (info.default !== undefined) {
        const defaultValue = info.default;
        switch (info.type) {
          case 'number':
            // number型なのに数値以外が指定された
            if (typeof defaultValue !== 'number') {
              return error`The default value of the ${optArg} parameter must be a number.: ${defaultValue}`;
            }
            break;
          case undefined:
          // eslint-disable-next-line no-fallthrough
          case 'string':
            // string型なのに文字列以外が指定された
            if (typeof defaultValue !== 'string') {
              return error`The default value of the ${optArg} parameter must be a string.: ${defaultValue}`;
            }
            break;
          // @ts-expect-error boolean型ではdefault値は指定できないが、念のため
          case 'boolean':
            return error`The default value of the ${optArg} parameter cannot be specified.: ${defaultValue}`;
        }
      }
    }
    // ↑ optMapの不備はここから上でerror`～`で投げる
    // ↓ コマンドラインの不備はここから下でusage`～`で投げる
    // 無名オプション
    const unnamedList: string[] = [];
    // 名前付きオプション
    const options: { [name: string]: string | number | true } = {};
    // 単独で指定されるはずのオプション
    let aloneOpt: string | undefined;
    // 一つ前に指定されたオプション
    let prevOpt: string | undefined;
    for (const arg of toIterable(itr)) {
      if (arg === '--') {
        if (aloneOpt) {
          // 単独で指定されるはずなのに他のオプションが指定された
          usage`${aloneOpt} must be specified alone.`;
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
      const { name, info } = optMapAlias[arg];
      if (aloneOpt || (prevOpt && info.alone)) {
        // 単独で指定されるはずなのに他のオプションが指定された
        usage`${aloneOpt || arg} must be specified alone.`;
      }
      prevOpt = arg;
      if (info.alone) {
        aloneOpt = arg;
      }
      switch (info.type) {
        case 'boolean':
          options[name] = true;
          continue;
        case 'number': {
          const r = itr.next();
          if (r.done) {
            return usage`${arg} needs a number parameter as the ${example(
              info,
            )}`;
          }
          const value = +r.value;
          if (!isFinite(value)) {
            return usage`${arg} needs a number parameter as the ${example(
              info,
            )}: ${r.value}`;
          }
          if (info.constraints) {
            if (isNumberArray(info.constraints)) {
              if (!info.constraints.includes(value)) {
                return usage`${arg} must be one of ${info.constraints.join(
                  ', ',
                )}.`;
              }
            } else {
              if (value < (info.constraints.min ?? -Infinity)) {
                return usage`${arg} must be greater than or equal to ${info.constraints.min}.`;
              }
              if (value > (info.constraints.max ?? Infinity)) {
                return usage`${arg} must be less than or equal to ${info.constraints.max}.`;
              }
            }
          }
          options[name] = value;
          continue;
        }
        case undefined:
        case 'string': {
          const r = itr.next();
          if (r.done) {
            return usage`${arg} needs a parameter as the ${example(info)}`;
          }
          if (info.constraints) {
            const [constraints, findValue] = info.ignoreCase
              ? [
                  info.constraints.map(s => s.toUpperCase()),
                  r.value.toUpperCase(),
                ]
              : [info.constraints, r.value];
            const index = constraints.findIndex(v => v === findValue);
            if (index < 0) {
              return usage`${arg} must be one of ${info.constraints.join(
                ', ',
              )}.`;
            }
            if (info.ignoreCase) {
              r.value = info.constraints[index];
            }
          }
          options[name] = r.value;
          continue;
        }
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
        if (info.required) {
          usage`${optArg} required`;
        }
        // デフォルト値が指定されていたら設定
        if (info.default !== undefined) {
          options[name] = info.default;
        }
      }
      const min = optMap[unnamed]?.min ?? NaN;
      if (unnamedList.length < min) {
        usage`At least ${min} ${example(
          // optMap[unnamed]?.minが存在しているのでoptMap[unnamed]も存在している
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          optMap[unnamed]!,
          'unnamed_parameters',
        )} required.`;
      }
      const max = optMap[unnamed]?.max ?? NaN;
      if (unnamedList.length > max) {
        usage`Too many ${example(
          // optMap[unnamed]?.maxが存在しているのでoptMap[unnamed]も存在している
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          optMap[unnamed]!,
          'unnamed_parameters',
        )} specified(up to ${max}).`;
      }
      // 無名オプションを追加
      Object.defineProperty(options, unnamed, {
        value: Object.freeze(unnamedList),
      });
    } else if (unnamedList.length > 0) {
      usage`${aloneOpt} must be specified alone.`;
    }
    // ヘルプ用文字列を追加して終了
    return Object.freeze(
      Object.defineProperty(options, helpString, {
        get: () => makeHelpString(optMap),
      }),
    ) as Options<OptMap>;
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
  // istanbul ignore next テスト実行時に親モジュールがないことはないのでcoverage対象から除外
  if (!module.parent) {
    // 親モジュールがない≒プログラムとしての起動ではないので空の情報を返す
    // istanbul ignore next 同上でcoverage対象から除外
    return {};
  }
  for (const path of module.parent.paths) {
    let text;
    try {
      // package.jsonを読み込む
      text = fs.readFileSync(resolve(path, '..', 'package.json'), 'utf8');
    } catch (ex: unknown) {
      // ファイルが見つからない、以外のエラーはエラーとする
      // istanbul ignore next ファイルが存在しない以外のエラーを発生させるのは大変なのでcoverage対象から除外
      if (!hasProperty(ex, 'code') || ex.code !== 'ENOENT') {
        // istanbul ignore next 同上でcoverage対象から除外
        throw ex;
      }
      // ファイルが見つからなかったらさかのぼりを継続
      // istanbul ignore next package.jsonがない場所を用意できないのでcoverage対象から除外
      continue;
    }
    return JSON.parse(text) as { version?: string; name?: string };
  }
  // package.jsonが見つからなければエラー
  // istanbul ignore next module.parent.pathsから遡って見つからないことはあり得ないのでcoverage対象から除外
  return error`package.json not found`;
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
  optMap: OptMap,
): string {
  const { version, name: processName } = loadPackageJson();
  let help = `Version: ${processName} ${version}\nUsage:\n`;
  const requiredList: string[] = [];
  const optionalList: string[] = [];
  const aloneList: string[] = [];
  for (const [name, info] of Object.entries(optMap)) {
    (info.alone ? aloneList : info.required ? requiredList : optionalList).push(
      `${name.length > 1 ? '--' : '-'}${name}${
        info.type === 'boolean' ? '' : ' ' + example(info)
      }`,
    );
  }
  if (requiredList.length + optionalList.length > 0) {
    const line = [...requiredList, ...optionalList.map(o => `[${o}]`)];
    const info = optMap[unnamed];
    if (info) {
      line.push(`[--] [${example(info, 'unnamed_parameters')}...]`);
    }
    aloneList.unshift(line.join(' '));
  }
  help += aloneList.map(option => `  npx ${processName} ${option}\n`).join('');
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
      info.type === 'boolean' ? '' : ' ' + example(info)
    }\n${indent(info.describe, '    ')}`;
  }
  const info = optMap[unnamed];
  if (info) {
    help += `  [--] [${example(info, 'unnamed_parameters')}...]\n${indent(
      info.describe,
      '    ',
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
  // undefinedもしくは空白以外の文字が見つからなかったら空文字列を返す
  if (!text || !/\S/.test(text)) {
    return '';
  }
  // 先頭、末尾の空白行を除去、行末の空白を除去しつつ一行ごとに分割
  const [first, ...rest] = text
    .replace(/^(?:[ \t]*[\r\n]+)+|(?:[\r\n]+[ \t]*)+$/g, '')
    .replace(/^[ \t]+$/, '')
    .split(/[ \t]*\r?\n/);
  // 行頭の空白で共通のものを抽出
  let srcIndent = 0;
  for (
    let ch: string;
    // 最初の行がまだ続いていて
    srcIndent < first.length &&
    // 空白文字が続いていて
    ((ch = first.charAt(srcIndent)) === ' ' || ch === '\t') &&
    // 他の行にも同じ位置に同じ文字があれば
    rest.every(
      line => srcIndent < line.length && line.charAt(srcIndent) === ch,
    );
    // 継続
    ++srcIndent
  );
  // 終わればそこまでを共通の空白文字とする。
  // 共通の空白文字がなければsrcIndentは0

  // 各行頭に共通の空白文字があれば、共通部分だけを指定されたインデントと置き換え
  // なければ、行頭の空白文字すべてを指定されたインデントと置き換える
  return [first, ...rest]
    .map(
      srcIndent
        ? line => line.slice(srcIndent)
        : line => line.replace(/^[ \t]*/, ''),
    )
    .map(line => `${indent}${line}\n`)
    .join('');
}
