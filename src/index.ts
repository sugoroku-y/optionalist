import * as fs from 'fs';
import { resolve } from 'path';

// istanbul ignore next 例外の型チェックでしか使われていないのでcoverage対象から除外
function hasProperty<NAME extends string | number | symbol>(
  o: unknown,
  name: NAME,
): o is Record<NAME, unknown> {
  // istanbul ignore next 同上で除外
  return typeof o === 'object' && o !== null && name in o;
}

/**
 * &で結合されたオブジェクト型をまとめる。
 *
 * ```
 * type TEST = Normalize<
 *   & { aaa: string }
 *   & {
 *   bbb: number;
 * } & {
 *   ccc?: boolean;
 * }>
 * ->
 * {
 *   aaa: string;
 *   bbb: number;
 *   ccc?: boolean;
 * }
 * ```
 */
type Normalize<T extends Record<never, never>> = { [K in keyof T]: T[K] };

/**
 * |で接続された型を1つのオブジェクト型に結合する。
 *
 * ```
 * type TEST = Combination<
 *   | { aaa: string }
 *   | { bbb: number }
 *   | { ccc?: boolean }
 * >;
 * ->
 * {
 *   aaa: string;
 *   bbb: number;
 *   ccc?: boolean;
 * }
 * ```
 */
type Combination<T> = (
  T extends unknown ? (arg: T) => unknown : never
) extends (arg: infer C) => unknown
  ? Normalize<C>
  : never;

/**
 * オブジェクト型のすべての値の型を抽出する。
 *
 * ```
 * type TEST = Values<{
 *    aaa: number;
 *    bbb: string;
 *    ccc?: boolean;
 * }>;
 * ->
 * number | string | boolean | undefined
 * ```
 */
type Values<T extends object> = T[keyof T];

/** すべてのプロパティにアクセス可能な状態で、存在していない状態にする */
type OmitAsExisting<T> = Partial<Record<keyof T, never>>;

/** それぞれのプロパティが1つだけ存在している、もしくは1つも存在していない状態にする。 */
type Exclusive<T> =
  | {
      [N in keyof T]: Record<N, T[N]> &
        Partial<Record<Exclude<keyof T, N>, never>>;
    }[keyof T]
  | OmitAsExisting<T>;

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
   *
   * required、default、multipleとは同時に指定できない。
   */
  alone?: true;
  /**
   * requiredにtrueを指定すると、必須オプションとなる。
   *
   * alone、default、multipleとは同時に指定できない。
   */
  required?: true;
  /**
   * defaultに値を指定すると、省略時にその値が設定される。
   *
   * alone、required、multipleとは同時に指定できない。
   */
  default?: T extends string | number ? T : never;
  /**
   * multipleにtrueを指定すると、複数指定できる。
   *
   * alone、required、defaultとは同時に指定できない。
   */
  multiple?: true;
  /**
   * 制約。
   */
  constraints?: unknown;
};

/** 文字型/数値型オプションの共通情報 */
type OptionWithValue<T extends string | number> = OptionBase<T> &
  Exclusive<{
    multiple: true;
    alone: true;
    default: T;
    required: true;
  }>;

/** 文字列型のオプション情報 */
type StringOption = OptionWithValue<string> &
  (
    | {
        /**
         *
         * 配列の場合は文字列として指定できる候補。ここで設定した以外の文字列を指定するとエラーとなる。
         */
        constraints: readonly string[];
        /**
         * constraintsに配列を指定したときに、大文字小文字を区別しない場合にはtrueを指定する。
         */
        ignoreCase?: true;
      }
    | {
        /**
         *
         * 正規表現の場合は文字列として指定できるパターン。ここで設定したパターンにマッチしない文字列を指定するとエラーとなる。
         */
        constraints: RegExp;
        /**
         *
         * constraintsに正規表現を指定した場合は、正規表現のiフラグを使うこと。
         */
        ignoreCase?: never;
      }
    | {
        constraints?: never;
      }
  );
/** 数値型のオプション情報 */
type NumberOption = OptionWithValue<number> &
  (
    | {
        /**
         *
         * 配列の場合は、ここで設定した値以外を指定するとエラーになる。
         */
        constraints: readonly number[];
      }
    | {
        /**
         *
         * 最小値、最大値の指定の場合は、ここで設定した範囲外の数値を指定するとエラーになる。
         */
        constraints: Exclude<
          Exclusive<{
            /**
             * 数値として指定できる最小値。ここで設定した数値未満の数値が指定されるとエラーになる。
             */
            min: number;
            /**
             * 数値として指定できる最小値(この値は含まない)。ここで設定した数値以下の数値が指定されるとエラーになる。
             */
            minExclusive: number;
          }> &
            Exclusive<{
              /**
               * 数値として指定できる最大値。ここで設定した数値より大きい数値が指定されるとエラーになる。
               */
              max: number;
              /**
               * 数値として指定できる最大値(この値は含まない)。ここで設定した数値以上の数値が指定されるとエラーになる。
               */
              maxExclusive: number;
            }>,
          // それぞれ省略可能だが、すべて省略された場合はエラーとする
          Partial<Record<string, never>>
        >;
      }
    | {
        constraints?: never;
      }
  );
/** 真偽値型のオプション情報 */
type FlagOption = OptionBase<boolean> &
  Exclusive<{ alone: true }> &
  OmitAsExisting<{
    /**
     *
     * booleanには指定できない。
     */
    constraints: unknown;
    /**
     *
     * booleanには指定できない。
     */
    required: unknown;
    /**
     *
     * booleanには指定できない。
     */
    multiple: unknown;
    /**
     *
     * booleanには指定できない。
     */
    default: unknown;
  }>;

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
 * 他のオプションと一緒に使用するオプションで指定されるプロパティ。
 */
type OptionsAccompany<OPTMAP extends OptionInformationMap> = Combination<
  | {
      [N in keyof OPTMAP]: OptionType<OPTMAP[N]> extends infer OptType
        ? N extends string
          ? // aloneが指定されているものは存在しないプロパティ
            OPTMAP[N] extends { alone: true }
            ? { readonly [K in N]?: never }
            : // requiredやdefaultが指定されているものは必ず存在しているプロパティ
            OPTMAP[N] extends { required: true } | { default: OptType }
            ? { readonly [K in N]: OptType }
            : // multipleが指定されているものは配列型
            OPTMAP[N] extends { multiple: true }
            ? { readonly [K in N]: OptType[] }
            : // それ以外は存在していない可能性のあるプロパティ
              { readonly [K in N]?: OptType }
          : // プロパティキーが文字列以外の場合は除外
            never
        : never;
    }[keyof OPTMAP]
  | {
      readonly [unnamed]: readonly string[];
      readonly [helpString]: string;
    }
>;
/**
 * 単独で指定されるオプションのプロパティ
 */
type OptionsAlone<OPTMAP extends OptionInformationMap> = Values<{
  [N in keyof OPTMAP as OPTMAP[N] extends { alone: true }
    ? N
    : never]: Normalize<
    { readonly [K in N]: OptionType<OPTMAP[N]> } & {
      readonly [K in Exclude<keyof OPTMAP, N | symbol | number>]?: never;
    } & {
      readonly [unnamed]?: never;
      readonly [helpString]: string;
    }
  >;
}>;

/**
 * parseの返値の型。
 */
type Options<OPTMAP extends OptionInformationMap> =
  | OptionsAccompany<OPTMAP>
  | OptionsAlone<OPTMAP>;

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
 * コマンドラインに不備があるときに投げられる例外
 */
class CommandLineParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandLineParsingError';
  }
}

/**
 * 指定によっては使い方を表示して終了する例外を投げる。ユーザーの指定間違い。
 * @param strings
 * @param args
 */
function usage(...args: [TemplateStringsArray, ...unknown[]]): never {
  throw new CommandLineParsingError(
    args[0].reduce((r, e, i) => `${r}${args[i]}${e}`),
  );
}

/**
 * 通常のエラー。プログラム上のミス。
 * @param strings
 * @param args
 */
function error(...args: [TemplateStringsArray, ...unknown[]]): never {
  throw new TypeError(args[0].reduce((r, e, i) => `${r}${args[i]}${e}`));
}

declare global {
  interface ArrayConstructor {
    // 標準のArray.isArrayの宣言では、ReadonlyArrayに対して型ガードが有効にならないので宣言を追加
    isArray(o: unknown): o is readonly unknown[];
  }
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
function example(info: { example?: string }, unnamed?: true): string {
  return info.example ?? (unnamed ? 'unnamed_parameters' : 'parameter');
}

/**
 * オプション名の前に`-`(hyphen)を付ける。
 *
 * 名前が1文字であれば`-`1文字だけ、2文字以上の名前のときは'--'を付ける。
 * @template NAME
 * @param {NAME} name
 * @returns
 */
function hyphenate(name: string): `${'--' | '-'}${string}` {
  if (name.length === 0) {
    throw new Error('empty option name');
  }
  if (name.charAt(0) === '-') {
    throw new Error(`Invalid option name: ${name}`);
  }
  return `${name.length > 1 ? '--' : '-'}${name}`;
}

/**
 * optMapに問題がないかチェックする。
 *
 * @template OptMap
 * @param optMap 解析するための情報。
 * @throws optMapに問題がある場合はTypeErrorを投げる。
 */
function assertValidOptMap<OptMap extends OptionInformationMap>(
  optMap: OptMap,
): void {
  for (const [name, info] of Object.entries(optMap)) {
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
          } for the ${hyphenate(name)} parameter`,
        );
    }
    if (info.type === 'boolean' && info.required) {
      // boolean型ではrequiredを指定できないはずだが念の為
      return error`The ${hyphenate(name)} cannot set to be required.`;
    }
    if (info.default !== undefined) {
      const defaultValue = info.default;
      switch (info.type) {
        case 'number':
          // number型なのに数値以外が指定された
          if (typeof defaultValue !== 'number') {
            return error`The default value of the ${hyphenate(
              name,
            )} parameter must be a number.: ${defaultValue}`;
          }
          break;
        case undefined:
        case 'string':
          // string型なのに文字列以外が指定された
          if (typeof defaultValue !== 'string') {
            return error`The default value of the ${hyphenate(
              name,
            )} parameter must be a string.: ${defaultValue}`;
          }
          break;
        // number型、string型以外(つまりboolean型)ではdefault値は指定できないが、念のため
        default:
          return error`The default value of the ${hyphenate(
            name,
          )} parameter cannot be specified.: ${defaultValue}`;
      }
      if (info.alone) {
        // defaultとaloneは一緒に指定できないはずだが念の為
        return error`The ${hyphenate(
          name,
        )} cannot be set to both alone and default value.`;
      }
      if (info.required) {
        // defaultとrequiredは一緒に指定できないはずだが念の為
        return error`The ${hyphenate(
          name,
        )} cannot be set to both required and default value.`;
      }
      if (info.multiple) {
        // defaultとmultipleは一緒に指定できないはずだが念の為
        return error`The ${hyphenate(
          name,
        )} cannot be set to both multiple and default value.`;
      }
    }
    if (info.alone && info.required) {
      // aloneとrequiredは一緒に指定できないはずだが念の為
      return error`The ${hyphenate(name)} cannot be both alone and required.`;
    }
    if (info.alone && info.multiple) {
      // aloneとmultipleは一緒に指定できないはずだが念の為
      return error`The ${hyphenate(name)} cannot be both alone and multiple.`;
    }
    if (info.required && info.multiple) {
      // requiredとmultipleは一緒に指定できないはずだが念の為
      return error`The ${hyphenate(
        name,
      )} cannot be both required and multiple.`;
    }
  }
}

type ParseContext = {
  /** 名前付きオプション(ヘルプ用文字列付き) */
  readonly options: Partial<
    Record<string, string | number | true | string[] | number[]>
  > & {
    readonly [helpString]: string;
  };
  /** エイリアスを含めたオプションの詳細マップ */
  readonly optMapAlias: Record<
    string,
    {
      readonly name: string;
      readonly info: Readonly<OptionInformation>;
    }
  >;
  /** 無名オプション */
  readonly unnamedList: string[];
  /** 単独で指定されるはずのオプション */
  aloneOpt?: string;
  /** 一つ前に指定されたオプション */
  prevOpt?: string;
};

function initParseContext<OptMap extends OptionInformationMap>(
  optMap: OptMap,
): ParseContext {
  return {
    /** 名前付きオプション(ヘルプ用文字列付き) */
    options: Object.defineProperty({}, helpString, {
      // ヘルプ用文字列は使わない可能性があるのでgetterとして用意
      get: () => makeHelpString(optMap),
    }) as ParseContext['options'],
    // エイリアスを含めたオプションの詳細マップ
    optMapAlias: expandAlias<OptMap>(optMap),
    /** 無名オプション */
    unnamedList: [],
  };
}

/**
 * aliasを含めたオプションの詳細マップを構築する。
 *
 * @template OptMap
 * @param {OptMap} optMap
 * @returns
 */
function expandAlias<OptMap extends OptionInformationMap>(optMap: OptMap) {
  const map: Record<string, { name: string; info: OptionInformation }> = {};
  for (const [name, info] of Object.entries(optMap)) {
    const value = { name, info };
    map[hyphenate(name)] = value;
    if (!info.alias) {
      continue;
    }
    for (const alias of Array.isArray(info.alias) ? info.alias : [info.alias]) {
      map[hyphenate(alias)] = value;
    }
  }
  return map;
}

/**
 * オプションを1つ解析する。
 *
 * @param {string} arg
 * @param {Iterator<string, unknown, undefined>} itr
 * @param {ParseContext} context
 * @returns {boolean} 次以降のオプション解析を終了する場合はfalseを返す。
 */
function parseOption(
  arg: string,
  itr: Iterator<string, unknown, undefined>,
  context: ParseContext,
): boolean {
  const { options, optMapAlias, unnamedList, aloneOpt, prevOpt } = context;
  if (arg === '--') {
    if (aloneOpt) {
      // 単独で指定されるはずなのに他のオプションが指定された
      return usage`${aloneOpt} must be specified alone.`;
    }
    // --以降はすべて無名オプション
    unnamedList.push(...toIterable(itr));
    return false;
  }
  if (!optMapAlias[arg]) {
    if (arg[0] === '-') {
      // optMapにないオプションが指定された
      return usage`unknown options: ${arg}`;
    }
    unnamedList.push(arg);
    return true;
  }
  const { name, info } = optMapAlias[arg];
  if (aloneOpt || (prevOpt && info.alone)) {
    // 単独で指定されるはずなのに他のオプションが指定された
    return usage`${aloneOpt || arg} must be specified alone.`;
  }
  context.prevOpt = arg;
  if (info.alone) {
    context.aloneOpt = arg;
  }
  switch (info.type) {
    case 'boolean':
      options[name] = true;
      return true;
    case 'number': {
      const r = itr.next();
      if (r.done) {
        return usage`${arg} needs a number parameter as the ${example(info)}`;
      }
      const value = +r.value;
      if (!isFinite(value)) {
        return usage`${arg} needs a number parameter as the ${example(info)}: ${
          r.value
        }`;
      }
      if (info.constraints) {
        if (Array.isArray(info.constraints)) {
          if (!info.constraints.includes(value)) {
            return usage`${arg} must be one of ${info.constraints.join(', ')}.`;
          }
        } else {
          if (
            info.constraints.min !== undefined &&
            value < info.constraints.min
          ) {
            return usage`${arg} must be greater than or equal to ${info.constraints.min}.`;
          }
          if (
            info.constraints.minExclusive !== undefined &&
            value <= info.constraints.minExclusive
          ) {
            return usage`${arg} must be greater than ${info.constraints.minExclusive}.`;
          }
          if (
            info.constraints.max !== undefined &&
            value > info.constraints.max
          ) {
            return usage`${arg} must be less than or equal to ${info.constraints.max}.`;
          }
          if (
            info.constraints.maxExclusive !== undefined &&
            value >= info.constraints.maxExclusive
          ) {
            return usage`${arg} must be less than ${info.constraints.maxExclusive}.`;
          }
        }
      }
      if (info.multiple) {
        ((options[name] ??= []) as number[]).push(value);
      } else {
        if (name in options) {
          return usage`Duplicate ${arg}: ${options[name]}, ${value}`;
        }
        options[name] = value;
      }
      return true;
    }
    case undefined:
    case 'string': {
      const r = itr.next();
      if (r.done) {
        return usage`${arg} needs a parameter as the ${example(info)}`;
      }
      let value = r.value;
      if (info.constraints) {
        if (info.constraints instanceof RegExp) {
          if (!info.constraints.test(value)) {
            return usage`${arg} does not match ${info.constraints}: ${r.value}`;
          }
        } else {
          const [constraints, findValue] = info.ignoreCase
            ? [
                info.constraints.map(s => s.toUpperCase()),
                r.value.toUpperCase(),
              ]
            : [info.constraints, r.value];
          const index = constraints.indexOf(findValue);
          if (index < 0) {
            return usage`${arg} must be one of ${info.constraints.join(', ')}.`;
          }
          if (info.ignoreCase) {
            value = info.constraints[index];
          }
        }
      }
      if (info.multiple) {
        ((options[name] ??= []) as string[]).push(value);
      } else {
        if (name in options) {
          return usage`Duplicate ${arg}: ${options[name]}, ${r.value}`;
        }
        options[name] = value;
      }
      return true;
    }
  }
}

/**
 * 解析結果が適切かどうかチェックする。
 *
 * @param {ParseContext} context
 * @param {OptionInformationMap[typeof unnamed]} [optUnnamed]
 */
function validateOptions(
  { optMapAlias, aloneOpt, unnamedList, options }: ParseContext,
  optUnnamed?: OptionInformationMap[typeof unnamed],
): void {
  if (aloneOpt) {
    if (unnamedList.length > 0) {
      // 単独オプションが指定されていたら無名オプションがあればエラー
      return usage`${aloneOpt} must be specified alone.`;
    }
    // 単独オプションが指定されていたらデフォルト値の設定を行わない
    return;
  }
  for (const [optArg, { name, info }] of Object.entries(optMapAlias)) {
    // 指定されていればスキップ
    if (name in options) {
      continue;
    }
    // requiredなのに指定されていなかったらエラー
    if (info.required) {
      return usage`${optArg} required`;
    }
    // デフォルト値が指定されていたら設定
    if (info.default !== undefined) {
      options[name] = info.default;
      continue;
    }
    // 複数指定の場合は指定されていなくても空配列を設定
    if (info.multiple) {
      options[name] = [];
      continue;
    }
  }
  if (optUnnamed) {
    const { min, max } = optUnnamed;
    if (min !== undefined && unnamedList.length < min) {
      return usage`At least ${min} ${example(optUnnamed, true)} required.`;
    }
    if (max !== undefined && unnamedList.length > max) {
      return usage`Too many ${example(
        optUnnamed,
        true,
      )} specified(up to ${max}).`;
    }
  }
  // 無名オプションを追加
  Object.defineProperty(options, unnamed, {
    value: Object.freeze(unnamedList),
    enumerable: true,
  });
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
 * ヘルプ文字列のインデントを調整する。
 *
 * @param {(string | undefined)} text
 * @param {string} indent
 * @returns {string}
 */
function indent(text: string | undefined, indent: string): string[] {
  // undefinedもしくは空白以外の文字が見つからなかったら空文字列を返す
  if (!text || !/\S/.test(text)) {
    return [];
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
  const trim: (line: string) => string = srcIndent
    ? line => line.slice(srcIndent)
    : line => line.replace(/^[ \t]*/, '');
  return [first, ...rest].map(line => `${indent}${trim(line)}`);
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
  const help: string[] = [];
  /* istanbul ignore next テスト実行時に親モジュールがないことはないのでcoverage対象から除外 */
  if (processName && version) {
    help.push(`Version: ${processName} ${version}`);
  }
  help.push('Usage:');
  const requiredList: string[] = [];
  const optionalList: string[] = [];
  const aloneList: string[] = [];
  for (const [name, info] of Object.entries(optMap)) {
    (info.alone ? aloneList : info.required ? requiredList : optionalList).push(
      `${hyphenate(name)}${info.type === 'boolean' ? '' : ' ' + example(info)}`,
    );
  }
  if (requiredList.length + optionalList.length > 0) {
    const line = [...requiredList, ...optionalList.map(o => `[${o}]`)];
    const info = optMap[unnamed];
    if (info) {
      line.push(`[--] [${example(info, true)}...]`);
    }
    aloneList.unshift(line.join(' '));
  }
  help.push(
    ...aloneList.map(
      option =>
        `  npx ${
          // istanbul ignore next テスト実行時に親モジュールがないことはないのでcoverage対象から除外
          processName ?? process.argv[1]
        } ${option}`,
    ),
  );
  {
    const describe = indent(optMap[helpString]?.describe, '  ');
    if (describe.length) {
      help.push(
        // 説明の前に改行を入れる。
        '',
        'Description:',
        ...describe,
      );
    }
  }
  help.push(
    // オプションの説明の前に改行を入れる。
    '',
    'Options:',
  );
  for (const [name, info] of Object.entries(optMap)) {
    const optNames = [name];
    if (info.alias) {
      if (typeof info.alias === 'string') {
        optNames.push(info.alias);
      } else {
        optNames.push(...info.alias);
      }
    }
    help.push(
      `  ${optNames.map(hyphenate).join(', ')}${
        info.type === 'boolean' ? '' : ' ' + example(info)
      }`,
      ...indent(info.describe, '    '),
    );
  }
  const info = optMap[unnamed];
  if (info) {
    help.push(
      `  [--] [${example(info, true)}...]`,
      ...indent(info.describe, '    '),
    );
  }
  return help.join('\n') + '\n';
}

/**
 * CommandLineParsingErrorを受け取った場合はヘルプを表示して終了
 *
 * @param {unknown} ex
 * @param {{ readonly [helpString]: string }} options
 */
function showUsageOnCommandLineParsingError(
  ex: unknown,
  options: { readonly [helpString]: string },
) {
  if (ex instanceof CommandLineParsingError) {
    // showUsageOnErrorが指定されていた場合は、解析時にエラーが発生したらヘルプを表示して終了する
    process.stderr.write(`${ex.message}\n\n${options[helpString]}`);
    process.exit(1);
  }
}

/**
 * コマンドラインをoptMapにしたがって解析する。
 *
 * @param optMap 解析するための情報。
 * @param args 解析するコマンドライン。
 * 省略時はprocess.argvの3つめから開始する。
 * @throws argsに問題がある場合には{@link CommandLineParsingError}を投げる。
 */
export function parse<OptMap extends OptionInformationMap>(
  optMap: OptMap,
  args?: Iterable<string>,
): Options<OptMap> {
  // optMapの内容チェック
  assertValidOptMap(optMap);
  const context: ParseContext = initParseContext<OptMap>(optMap);
  const itr =
    args?.[Symbol.iterator]() ??
    (() => {
      // argsが省略されたらprocess.argvの３つ目から始める
      const itr = process.argv[Symbol.iterator]();
      //２つスキップ
      itr.next();
      itr.next();
      return itr;
    })();
  try {
    for (const arg of toIterable(itr)) {
      if (!parseOption(arg, itr, context)) {
        break;
      }
    }
    validateOptions(context, optMap[unnamed]);
  } catch (ex: unknown) {
    if (optMap[helpString]?.showUsageOnError) {
      showUsageOnCommandLineParsingError(ex, context.options);
    }
    throw ex;
  }
  // 変更不可にして返す
  return Object.freeze(context.options) as Options<OptMap>;
}
