import * as fs from 'fs';
import { resolve } from 'path';

/**
 * 説明付きの型で説明を表示するためのダミーのシンボル。
 *
 * 実際には存在しないのでアクセスできない。
 * @deprecated
 */
declare const description: unique symbol;
/** 説明つきの型 */
export type DescribedType<TYPE, DESCRIPTION> = DESCRIPTION extends string[]
  ? TYPE & {
      [description]: DESCRIPTION;
    }
  : TYPE;

/**
 * 文字数に応じて前に`-`をつける。
 *
 * 1文字なら`-x`のように1つだけ、2文字以上なら`--xx`のように2文字の`-`をつける。
 */
type Hyphenate<NAME extends string> =
  NAME extends `${infer _}${infer _}${infer _}` ? `--${NAME}` : `-${NAME}`;
/** ケバブケースをキャメルケースに変換 */
type CamelCase<KEBABCASE extends string> =
  KEBABCASE extends `${infer FIRST}-${infer REST}`
    ? CamelCase<`${FIRST}${Capitalize<REST>}`>
    : KEBABCASE;

/**
 * 配列を連結する
 */
type Join<A extends readonly (string | number)[]> = A extends readonly [
  infer FIRST,
  ...infer REST,
]
  ? FIRST extends string | number
    ? REST extends readonly [string | number, ...(string | number)[]]
      ? `${FIRST extends string ? `'${FIRST}'` : FIRST}, ${Join<REST>}`
      : FIRST extends string
      ? `'${FIRST}'`
      : FIRST
    : never
  : '';

type RangeConstraints<CONSTRAINTS> = CONSTRAINTS extends Record<string, number>
  ? [
      ...(CONSTRAINTS extends { min: infer MIN }
        ? MIN extends number
          ? number extends MIN
            ? []
            : [`must be ${MIN} or greater.`]
          : []
        : CONSTRAINTS extends { minExclusive: infer MIN }
        ? MIN extends number
          ? number extends MIN
            ? []
            : [`must be greater than ${MIN}.`]
          : []
        : []),
      ...(CONSTRAINTS extends { max: infer MAX }
        ? MAX extends number
          ? number extends MAX
            ? []
            : [`must be ${MAX} or less.`]
          : []
        : CONSTRAINTS extends { maxExclusive: infer MAX }
        ? MAX extends number
          ? number extends MAX
            ? []
            : [`must be less than ${MAX}.`]
          : []
        : []),
    ]
  : never;

type PropertyDescribedType<TYPE, NAME, OPT> = NAME extends string
  ? DescribedType<
      TYPE,
      [
        `${Hyphenate<NAME>}${TYPE extends boolean
          ? ''
          : OPT extends { type: 'boolean' }
          ? ''
          : ` ${OPT extends { example: `${infer EXAMPLE}` }
              ? EXAMPLE
              : 'parameter'}`}${OPT extends {
          readonly describe: `${infer DESCRIPTION}`;
        }
          ? `: ${DESCRIPTION}`
          : ''}`,
        ...(TYPE extends string | number
          ? OPT extends { readonly required: true }
            ? ['must be specified always.']
            : []
          : []),
        ...(OPT extends { readonly alone: true }
          ? ['must be specified alone.']
          : []),
        ...(TYPE extends string | number
          ? OPT extends { readonly default: infer DEFAULT }
            ? DEFAULT extends TYPE
              ? TYPE extends DEFAULT
                ? []
                : [
                    `is equal to ${DEFAULT extends string
                      ? `'${DEFAULT}'`
                      : DEFAULT} if omitted.`,
                  ]
              : []
            : OPT extends string | number
            ? TYPE extends OPT
              ? []
              : [
                  `is equal to ${OPT extends string
                    ? `'${OPT}'`
                    : OPT} if omitted.`,
                ]
            : []
          : []),
        ...(OPT extends { readonly multiple: true }
          ? ['can be specified more than once.']
          : []),
        ...(OPT extends { readonly constraints: infer CONSTRAINTS }
          ? CONSTRAINTS extends RegExp
            ? TYPE extends string
              ? ['must match the regular expression.']
              : TYPE extends readonly string[]
              ? ['must match the regular expression.']
              : []
            : CONSTRAINTS extends readonly (string | number)[]
            ? TYPE extends string | number
              ? [`must be either ${Join<CONSTRAINTS>}.`]
              : []
            : CONSTRAINTS extends Record<string, number>
            ? TYPE extends number
              ? RangeConstraints<CONSTRAINTS>
              : TYPE extends readonly number[]
              ? RangeConstraints<CONSTRAINTS>
              : []
            : []
          : []),
      ]
    >
  : never;

/**
 * 型同士が一致するかどうかを返す型関数。
 */
type Equal<A, B> = (<T>(a: T) => A) extends <T>(a: T) => B
  ? (<T>(a: T) => B) extends <T>(a: T) => A
    ? true
    : false
  : false;
/**
 * ユーティリティー型関数のテスト用の型。
 *
 * Validateに渡すことで型関数のテストができる。
 *
 * @param ACTUAL テストしたい型
 * @param EXPECT 期待する型
 * @returns ACTUALがEXPECTに一致したかどうかの真偽値と`{actual: ACTUAL}`の交差型。
 *
 * 結果の`actual`プロパティにACTUALそのものが設定されているので、その型を見てデバッグできる。
 */
type TypeTest<ACTUAL, EXPECT> = Equal<ACTUAL, EXPECT> & { actual: ACTUAL };
/**
 * ユーティリティー型関数のテスト用の型。
 *
 * TにTypeTestでテストした結果を渡すことで型関数のテストができる。
 *
 * @param T TypeTestでテストした結果。true以外はエラーとなる。
 * @returns Tそのもの。
 *
 * TypeTestの結果はテストに成功したかどうかの真偽値と
 * actualプロパティにACTUALが指定されたオブジェクトの交差型になるので
 * Validate<TypeTest<ACTUAL, EXPECT>>の結果を見ればACTUALの実際の型がわかる。
 */
type Validate<T extends true> = T;

// 型自体や内部で使用するSymbolをexportしていないため外部ではテストできない型のテスト
// これらのテスト用の型はindex.d.tsからは消えているのでよしとする
type _TEST_Hyphenate1 = Validate<TypeTest<Hyphenate<'a'>, '-a'>>;
type _TEST_Hyphenate2 = Validate<TypeTest<Hyphenate<'aa'>, '--aa'>>;

type _TEST_CamelCase1 = Validate<TypeTest<CamelCase<''>, ''>>;
type _TEST_CamelCase2 = Validate<TypeTest<CamelCase<'abc'>, 'abc'>>;
type _TEST_CamelCase3 = Validate<TypeTest<CamelCase<'ABC'>, 'ABC'>>;
type _TEST_CamelCase4 = Validate<TypeTest<CamelCase<'abc-def'>, 'abcDef'>>;
type _TEST_CamelCase5 = Validate<TypeTest<CamelCase<'ABC-def'>, 'ABCDef'>>;
type _TEST_CamelCase6 = Validate<TypeTest<CamelCase<'abc-DEF'>, 'abcDEF'>>;
type _TEST_CamelCase7 = Validate<TypeTest<CamelCase<'ABC-DEF'>, 'ABCDEF'>>;

type _TEST_Join1 = Validate<TypeTest<Join<[]>, ''>>;
type _TEST_Join2 = Validate<TypeTest<Join<[123, 456, 789]>, '123, 456, 789'>>;
type _TEST_Join3 = Validate<
  TypeTest<Join<['abc', 'def', 'ghi']>, "'abc', 'def', 'ghi'">
>;
type _TEST_Join4 = Validate<TypeTest<Join<readonly []>, ''>>;
type _TEST_Join5 = Validate<
  TypeTest<Join<readonly [123, 456, 789]>, '123, 456, 789'>
>;
type _TEST_Join6 = Validate<
  TypeTest<Join<readonly ['abc', 'def', 'ghi']>, "'abc', 'def', 'ghi'">
>;

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
type Normalize<T> = T extends Record<never, never>
  ? { [K in keyof T]: T[K] }
  : never;

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
  ? C extends Record<never, never>
    ? Normalize<C>
    : never
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
      [N in keyof T]: Pick<T, N> & OmitAsExisting<Omit<T, N>>;
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
  ? { readonly type: 'number' }
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
  /**
   * 旧バージョンでalone、required、defaultを指定するためのプロパティ。
   *
   * 現行バージョンでは各プロパティで指定するため廃止。
   *
   * @deprecated
   */
  nature?: never;
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
        constraints: readonly [string, ...string[]];
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
        constraints: readonly [number, ...number[]];
        /**
         * 指定された値が配列になかった場合に一番近い値にする場合はtrueを指定する。
         *
         * 差が同じ場合は配列の先に存在する方を選択する。
         */
        autoAdjust?: true;
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
        /**
         * 指定された値が範囲内になかった場合に一番範囲に近い値にする場合はtrueを指定する。
         *
         * maxExclusive/minExclusiveが指定されている場合は、その値からNumber.EPSILONを増減した値とする。
         */
        autoAdjust?: true;
      }
    | {
        constraints?: never;
      }
  );

/** 真偽値型のオプション情報 */
type FlagOption = OptionBase<boolean> & {
  alone?: true;
} & (
    | {
        /**
         *
         * booleanではmultipleを指定するとその指定された回数が取得できる。
         */
        multiple: true;
        /**
         *
         * booleanではmultipleを指定したときだけconstraintsにmaxを指定できる。
         */
        constraints?: {
          /**
           * 複数回指定できる最大回数を設定する。
           */
          max: number;
        };
      }
    | {
        multiple?: never;
        constraints?: never;
      }
  ) &
  Partial<Record<'required' | 'default', never>>; // booleanにはこれらを指定できない。

interface UnnamedOptionInfo {
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
}

interface HelpStringOptionInfo {
  /**
   * このコマンドの説明。
   */
  describe?: string;
  /**
   * コマンドラインに不備があったときに使用方法を表示して終了するときにはtrueを指定する。
   */
  showUsageOnError?: true;
}

/**
 * parseの第一引数の型。
 */
type OptionInformationMap = Readonly<{
  /**
   * 無名オプションの説明などを指定する。
   */
  [unnamed]?: Readonly<UnnamedOptionInfo>;
  /**
   * このコマンドの説明などを指定する。
   */
  [helpString]?: Readonly<HelpStringOptionInfo>;
  /**
   * 名前付きオプションの詳細
   */
  [name: string]: Readonly<
    NumberOption | FlagOption | StringOption | string | number | true
  >;
}>;

type NormalizedOptionInformationMap = {
  [unnamed]?: UnnamedOptionInfo;
  [helpString]?: HelpStringOptionInfo;
  [name: string]:
    | (StringOption & { type: 'string' })
    | NumberOption
    | FlagOption;
};

type OptionTypeName<
  OptionInfo extends Record<string, unknown> | string | number | true,
> = OptionInfo extends true
  ? 'boolean'
  : OptionInfo extends number
  ? 'number'
  : OptionInfo extends string
  ? 'string'
  : OptionInfo extends { type: 'boolean' }
  ? 'boolean'
  : OptionInfo extends { type: 'number' }
  ? 'number'
  : OptionInfo extends { type: 'string' }
  ? 'string'
  : OptionInfo extends { type: unknown }
  ? never
  : 'string';

/**
 * parseの返値の各プロパティの型
 */
type OptionType<
  OptionInfo extends Record<string, unknown> | string | number | true,
> =
  // typeの値で振り分け
  OptionTypeName<OptionInfo> extends 'boolean'
    ? // typeがbooleanなら
      OptionInfo extends { multiple: true }
      ? // multipleが指定されていれば指定された回数なのでnumber
        number
      : // でなければ真偽値
        true // だが、falseにすることはできないのでtrueになる。
    : OptionTypeName<OptionInfo> extends 'number'
    ? // typeがnumberなら数値型
      OptionInfo extends { constraints: readonly number[] }
      ? // constraintsが指定されていれば数値の列挙型
        OptionInfo['constraints'][number]
      : number
    : OptionTypeName<OptionInfo> extends 'string'
    ? // typeがstringもしくは省略されていれば文字列型
      OptionInfo extends { constraints: readonly string[] }
      ? // constraintsが指定されていれば文字列の列挙型
        OptionInfo['constraints'][number]
      : string
    : // typeにその他の値が指定されていることはない
      never;

/**
 * 他のオプションと一緒に使用するオプションで指定されるプロパティ。
 */
type OptionsAccompany<OPTMAP extends OptionInformationMap> = Combination<
  | {
      [N in keyof OPTMAP]: OptionType<OPTMAP[N]> extends infer OptType
        ? N extends string
          ? // aloneが指定されているものは存在しないプロパティ
            OPTMAP[N] extends { alone: true }
            ? { readonly [K in N as CamelCase<K>]?: never }
            : // requiredやdefaultが指定されているものは必ず存在しているプロパティ
            OPTMAP[N] extends
                | { required: true }
                | { default: OptType }
                | string
                | number
            ? {
                readonly [K in N as CamelCase<K>]: PropertyDescribedType<
                  OptType,
                  N,
                  OPTMAP[N]
                >;
              }
            : // multipleが指定されている真偽値なら数値型
            OPTMAP[N] extends { type: 'boolean'; multiple: true }
            ? {
                readonly [K in N as CamelCase<K>]: PropertyDescribedType<
                  number,
                  N,
                  OPTMAP[N]
                >;
              }
            : // 上記以外でmultipleが指定されているものは配列型
            OPTMAP[N] extends { multiple: true }
            ? {
                readonly [K in N as CamelCase<K>]: PropertyDescribedType<
                  readonly OptType[],
                  N,
                  OPTMAP[N]
                >;
              }
            : // それ以外は存在していない可能性のあるプロパティ
              {
                readonly [K in N as CamelCase<K>]?: PropertyDescribedType<
                  OptType,
                  N,
                  OPTMAP[N]
                >;
              }
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
  [N in keyof OPTMAP as N extends string
    ? OPTMAP[N] extends { alone: true }
      ? N
      : never
    : never]: N extends string
    ? Normalize<
        {
          readonly [K in N as CamelCase<K>]: PropertyDescribedType<
            OptionType<OPTMAP[N]>,
            N,
            OPTMAP[N]
          >;
        } & {
          readonly [K in Exclude<
            keyof OPTMAP,
            N | symbol | number
          > as CamelCase<K>]?: never;
        } & {
          readonly [unnamed]?: never;
          readonly [helpString]: string;
        }
      >
    : never;
}>;

/**
 * parseの返値の型。
 */
type Options<OPTMAP extends OptionInformationMap> =
  | OptionsAccompany<OPTMAP>
  | OptionsAlone<OPTMAP>;

type _TEST_Options1 = Validate<
  TypeTest<
    Options<{
      // eslint-disable-next-line @typescript-eslint/ban-types
      aaa: {};
      bbb: { type: 'number' };
      ccc: { type: 'boolean' };
      ddd: { type: 'boolean'; multiple: true };
      eee: { type: 'number'; multiple: true };
      fff: { multiple: true };
      ggg: { type: 'string' };
      hhh: { type: 'number'; required: true };
      iii: { required: true };
      jjj: { type: 'string'; required: true };
      kkk: { default: 'kkk' };
      lll: { type: 'string'; default: 'lll' };
      mmm: { type: 'number'; default: 123 };
      nnn: { constraints: ['nnn', 'NNN', 'NnN'] };
      ooo: { type: 'string'; constraints: ['ooo', 'OOO', 'oOo'] };
      ppp: { type: 'number'; constraints: [1, 3, 5] };
      qqq: { type: 'boolean'; alone: true };
    }>,
    | {
        readonly [unnamed]: readonly string[];
        readonly [helpString]: string;
        readonly aaa?: string & { [description]: ['--aaa parameter'] };
        readonly bbb?: number & { [description]: ['--bbb parameter'] };
        readonly ccc?: true & { [description]: ['--ccc'] };
        readonly ddd: number & {
          [description]: ['--ddd', 'can be specified more than once.'];
        };
        readonly eee: readonly number[] & {
          [description]: [
            '--eee parameter',
            'can be specified more than once.',
          ];
        };
        readonly fff: readonly string[] & {
          [description]: [
            '--fff parameter',
            'can be specified more than once.',
          ];
        };
        readonly ggg?: string & { [description]: ['--ggg parameter'] };
        readonly hhh: number & {
          [description]: ['--hhh parameter', 'must be specified always.'];
        };
        readonly iii: string & {
          [description]: ['--iii parameter', 'must be specified always.'];
        };
        readonly jjj: string & {
          [description]: ['--jjj parameter', 'must be specified always.'];
        };
        readonly kkk: string & {
          [description]: ['--kkk parameter', "is equal to 'kkk' if omitted."];
        };
        readonly lll: string & {
          [description]: ['--lll parameter', "is equal to 'lll' if omitted."];
        };
        readonly mmm: number & {
          [description]: ['--mmm parameter', 'is equal to 123 if omitted.'];
        };
        readonly nnn?: ('nnn' | 'NNN' | 'NnN') & {
          [description]: [
            '--nnn parameter',
            "must be either 'nnn', 'NNN', 'NnN'.",
          ];
        };
        readonly ooo?: ('ooo' | 'OOO' | 'oOo') & {
          [description]: [
            '--ooo parameter',
            "must be either 'ooo', 'OOO', 'oOo'.",
          ];
        };
        readonly ppp?: (1 | 3 | 5) & {
          [description]: ['--ppp parameter', 'must be either 1, 3, 5.'];
        };
        readonly qqq?: never;
      }
    | {
        readonly [unnamed]?: never;
        readonly [helpString]: string;
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
        readonly nnn?: never;
        readonly ooo?: never;
        readonly ppp?: never;
        readonly qqq: true & {
          [description]: ['--qqq', 'must be specified alone.'];
        };
      }
  >
>;

/**
 * 指定した第1引数がnever型になっているかどうかチェックする。
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
function assertNever(_: never, message: string): never {
  throw new Error(message);
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
 * @param {string} name
 * @returns
 */
function hyphenate(name: string): `${'--' | '-'}${string}` {
  // 空文字列はエラー
  assert(name.length, 'empty option name');
  // 先頭や末尾に`-`があればエラー
  assert(name.charAt(0) !== '-', `Invalid option name: ${name}`);
  assert(name.charAt(name.length - 1) !== '-', `Invalid option name: ${name}`);
  return `${name.length > 1 ? '--' : '-'}${name}`;
}

/**
 * ケバブケースをキャメルケースに変換
 * @template {string} KEBABCASE
 * @param {KEBABCASE} kebabCase キャメルケースに変換するケバブケース
 * @returns {CamelCase<KEBABCASE>} ケバブケースからキャメルケースに変換した文字列。
 *
 * `kebabCase`が`-`を含まない場合は元の文字列を返す。
 */
function camelCase<KEBABCASE extends string>(
  kebabCase: KEBABCASE,
): CamelCase<KEBABCASE> {
  return kebabCase.replace(
    /(?<!^)-[^-]+/g,
    word => `${word.charAt(1).toUpperCase()}${word.slice(2)}`,
  ) as CamelCase<KEBABCASE>;
}

/**
 * optMapの内容を値に応じて正規化する。
 * - 文字列が指定されていた場合はStringOptionに変換する。
 * - 数値が指定されていた場合はNumberOptionに変換する。
 * - trueが指定されていた場合はFlagOptionに変換する。
 * - StringOptionのtypeが省略されていれば`string`を設定する。
 * 上記以外はそのまま。
 *
 * @param {OptionInformationMap} optMap 文字列や数値なども含むOptionInformationを値に持つマップ
 * @returns {NormalizedOptionInformationMap} 正規化したマップ
 */
function normalizeOptMap(
  optMap: OptionInformationMap,
): NormalizedOptionInformationMap {
  const normalizedOptMap: NormalizedOptionInformationMap = {};
  for (const [name, info] of Object.entries(optMap)) {
    normalizedOptMap[name] =
      typeof info === 'string'
        ? { type: 'string', default: info }
        : typeof info === 'number'
        ? { type: 'number', default: info }
        : info === true
        ? { type: 'boolean' }
        : info.type === undefined || info.type === 'string'
        ? ({ ...info, type: 'string' } as StringOption & { type: 'string' })
        : info.type === 'number' || info.type === 'boolean'
        ? info
        : assertNever(
            info.type,
            'info.typeはstring/number/booleanのいずれか、もしくは省略されているはず',
          );
  }
  if (unnamed in optMap) {
    normalizedOptMap[unnamed] = optMap[unnamed];
  }
  if (helpString in optMap) {
    normalizedOptMap[helpString] = optMap[helpString];
  }
  return normalizedOptMap;
}

function assertStringOption(info: StringOption) {
  assert(
    info.default === undefined || typeof info.default === 'string',
    'string型ではdefault値に文字列以外を指定できない',
  );
  if (info.constraints === undefined) {
    return;
  }
  if (info.constraints instanceof RegExp) {
    // 正規表現の場合は無条件にOKとする(チェックしようがない)
    return;
  }
  if (Array.isArray(info.constraints)) {
    assert(
      info.constraints.length > 0,
      'string型ではconstraintsに空の配列を指定できない',
    );
    assert(
      info.constraints.every(s => typeof s === 'string'),
      'string型ではconstraintsに文字列以外の配列を指定できない',
    );
    return;
  }
  assertNever(
    info.constraints,
    'string型ではconstraintsに正規表現もしくは文字列の配列以外を指定できない',
  );
}

function assertNumberOption(info: NumberOption) {
  assert(
    info.default === undefined || typeof info.default === 'number',
    'number型ではdefault値に数値以外を指定できない',
  );
  if (info.constraints === undefined) {
    return;
  }
  if (Array.isArray(info.constraints)) {
    assert(
      info.constraints.length > 0,
      'number型ではconstraintsに空の配列を指定できない',
    );
    assert(
      info.constraints.every(n => typeof n === 'number'),
      'number型ではconstraintsに数値以外の配列を指定できない',
    );
    return;
  }
  if (typeof info.constraints === 'object') {
    assert(
      typeof info.constraints.max === 'number' ||
        typeof info.constraints.maxExclusive === 'number' ||
        typeof info.constraints.min === 'number' ||
        typeof info.constraints.minExclusive === 'number',
      'number型ではconstraintsにmax/maxExclusive/min/minExclusiveのいずれも存在しないオブジェクトを指定できない',
    );
    assert(
      info.constraints.max === undefined ||
        info.constraints.maxExclusive === undefined,
      'number型ではconstraintsにmax/maxExclusiveの両方が存在するオブジェクトを指定できない',
    );
    assert(
      info.constraints.min === undefined ||
        info.constraints.minExclusive === undefined,
      'number型ではconstraintsにmin/minExclusiveの両方が存在するオブジェクトを指定できない',
    );
    return;
  }
  assertNever(
    info,
    'number型ではconstraintsに数値の配列、もしくは数値の範囲以外を指定できない',
  );
}

function assertFlagOption(info: FlagOption) {
  assert(
    info.required === undefined && info.default === undefined,
    'boolean型ではrequired/default値を指定できない',
  );
  assert(
    info.multiple || !info.constraints,
    'boolean型でconstraintsを指定できるのはmultipleを指定したときだけ',
  );
  assert(
    !info.multiple ||
      !info.constraints ||
      typeof info.constraints.max === 'number',
    'boolean型でmultipleとconstraintsを指定したときmaxには数値が指定されていなければならない',
  );
}

/**
 * optMapに問題がないかチェックする。
 *
 * TypeScriptから利用しているのであればコンパイル時にチェックされているはずだが、念の為チェックする。
 *
 * 一部、コンパイル時にはチェックできないものもある。
 * @param optMap 解析するための情報。
 * @throws optMapに問題がある場合はTypeErrorを投げる。
 */
function assertValidOptMap(optMap: NormalizedOptionInformationMap): void {
  for (const info of Object.values(optMap)) {
    // 型指定のチェック
    // istanbul ignore next defaultへの分岐がcoverできないのでここはチェックしない
    switch (info.type) {
      case 'string':
        assertStringOption(info);
        break;
      case 'number':
        assertNumberOption(info);
        break;
      case 'boolean':
        assertFlagOption(info);
        break;
      default:
        assertNever(
          info,
          '正規化されているのでstring/number/boolean以外はないはず',
        );
    }
    assert(
      (info.default !== undefined ? 1 : 0) +
        (info.alone ? 1 : 0) +
        (info.required ? 1 : 0) +
        (info.multiple ? 1 : 0) <=
        1,
      'default/alone/required/multipleは同時に指定できない',
    );
    assert(!('nature' in info), 'natureは廃止されたので指定できない');
  }
}

/** 名前付きオプション */
type NamedOptionMap = Partial<
  Record<string, string | number | true | string[] | number[]>
>;
/** 無名オプション */
type UnnamedOptionList = string[];

/** エイリアスを含めたオプションの詳細マップ */
type ExpandedOptionInformationMap = Record<
  string,
  {
    name: string;
    entryName: string;
    info: NormalizedOptionInformationMap[string];
  }
>;

/**
 * aliasを含めたオプションの詳細マップを構築する。
 *
 * @param {NormalizedOptionInformationMap} optMap
 * @returns
 */
function expandAlias(
  optMap: NormalizedOptionInformationMap,
): ExpandedOptionInformationMap {
  const map: ExpandedOptionInformationMap = {};
  for (const [name, info] of Object.entries(optMap)) {
    const camelCaseName = camelCase(name);
    const { entryName: existName } =
      Object.values(map).find(({ name }) => name === camelCaseName) ?? {};
    // キャメルケースにすることで別のオプションと同名になる場合はエラー
    assert(
      existName === undefined,
      () => `Duplicate option name: ${name}, ${existName}`,
    );
    const hyphenateName = hyphenate(name);
    // 他のオプションでAliasが設定されている名前であればエラー
    assert(
      !(hyphenateName in map),
      () => `Duplicate alias name: ${name}, ${map[hyphenateName].entryName}`,
    );
    const value = { name: camelCaseName, entryName: name, info };
    map[hyphenateName] = value;
    if (!info.alias) {
      continue;
    }
    for (const alias of Array.isArray(info.alias) ? info.alias : [info.alias]) {
      const hyphenateAlias = hyphenate(alias);
      // 他のオプションやAliasが設定されている名前であればエラー
      assert(
        !(hyphenateAlias in map),
        () => `Duplicate alias name: ${name}, ${map[hyphenateAlias].entryName}`,
      );
      map[hyphenateAlias] = value;
    }
  }
  return map;
}

function parseStringOption(
  arg: string,
  name: string,
  info: StringOption,
  itr: Iterator<string, unknown, undefined>,
  options: NamedOptionMap,
): void {
  const r = itr.next();
  if (r.done) {
    return usage`${arg} needs a parameter as the ${example(info)}`;
  }
  if (!info.multiple && name in options) {
    // 既に設定済みならエラー
    return usage`Duplicate ${arg}: ${options[name]}, ${r.value}`;
  }
  const value = (value => {
    if (!info.constraints) {
      return value;
    }
    // 制約の指定があれば条件を確認
    if (info.constraints instanceof RegExp) {
      // 正規表現にマッチするかどうか
      return info.constraints.test(value)
        ? value
        : usage`${arg} does not match ${info.constraints}.: ${value}`;
    }
    if (info.ignoreCase) {
      const findText = value.toUpperCase();
      // 指定された候補と一致したらその候補を返す
      return (
        info.constraints.find(s => s.toUpperCase() === findText) ??
        usage`${arg} must be one of ${info.constraints.join(', ')}.: ${value}`
      );
    }
    // 指定された候補と一致したら値を返す
    return info.constraints.includes(value)
      ? value
      : usage`${arg} must be one of ${info.constraints.join(', ')}.: ${value}`;
  })(r.value);
  if (info.multiple) {
    // 複数指定可能な場合は配列に格納
    ((options[name] ??= []) as string[]).push(value);
  } else {
    options[name] = value;
  }
}

function parseNumberOption(
  arg: string,
  name: string,
  info: NumberOption,
  itr: Iterator<string, unknown, undefined>,
  options: NamedOptionMap,
): void {
  const r = itr.next();
  if (r.done) {
    return usage`${arg} needs a number parameter as the ${example(info)}`;
  }
  if (!info.multiple && name in options) {
    // 既に設定済みならエラー
    return usage`Duplicate ${arg}: ${options[name]}, ${r.value}`;
  }
  const value = (value => {
    if (!isFinite(value)) {
      return usage`${arg} needs a number parameter as the ${example(info)}: ${
        r.value
      }`;
    }
    if (!info.constraints) {
      return value;
    }
    // 制約の指定があれば条件を確認
    if (Array.isArray(info.constraints)) {
      if (info.constraints.includes(value)) {
        // 候補の中に一致する値があればそのまま返す。
        return value;
      }
      if (info.autoAdjust) {
        // 候補の中から値との差が最小のものを検索。差が同じ場合は最初に見つかったもの。
        const min = { value: NaN, diff: Infinity };
        for (const candidate of info.constraints) {
          const diff = Math.abs(candidate - value);
          if (min.diff > diff) {
            min.diff = diff;
            min.value = candidate;
          }
        }
        // 候補は長さ1以上の配列なので必ず見つかる
        return min.value;
      }
      return usage`${arg} must be one of ${info.constraints.join(', ')}.: ${
        r.value
      }`;
    }
    // 最大値、最小値での制約
    if (info.constraints.min !== undefined && value < info.constraints.min) {
      if (info.autoAdjust) {
        return info.constraints.min;
      }
      return usage`${arg} must be greater than or equal to ${info.constraints.min}.: ${r.value}`;
    }
    if (
      info.constraints.minExclusive !== undefined &&
      value <= info.constraints.minExclusive
    ) {
      if (info.autoAdjust) {
        return info.constraints.minExclusive + Number.EPSILON;
      }
      return usage`${arg} must be greater than ${info.constraints.minExclusive}.: ${r.value}`;
    }
    if (info.constraints.max !== undefined && value > info.constraints.max) {
      if (info.autoAdjust) {
        return info.constraints.max;
      }
      return usage`${arg} must be less than or equal to ${info.constraints.max}.: ${r.value}`;
    }
    if (
      info.constraints.maxExclusive !== undefined &&
      value >= info.constraints.maxExclusive
    ) {
      if (info.autoAdjust) {
        return info.constraints.maxExclusive - Number.EPSILON;
      }
      return usage`${arg} must be less than ${info.constraints.maxExclusive}.: ${r.value}`;
    }
    return value;
  })(+r.value);
  if (info.multiple) {
    // 複数指定可能な場合は配列に格納
    ((options[name] ??= []) as number[]).push(value);
  } else {
    options[name] = value;
  }
}

function parseFlagOption(
  arg: string,
  name: string,
  info: FlagOption,
  _: Iterator<string, unknown, undefined>,
  options: NamedOptionMap,
): void {
  if (info.multiple) {
    // 複数指定可能な場合は回数をカウント
    let value = options[name];
    if (typeof value !== 'number') {
      value = 0;
    }
    ++value;
    if (info.constraints && info.constraints.max < value) {
      // 最大回数を超えてしまったらエラー
      return usage`Exceeded max count(${info.constraints.max}): ${arg}`;
    }
    options[name] = value;
    return;
  }

  if (name in options) {
    // 既に設定済みならエラー
    return usage`Duplicate ${arg}`;
  }
  options[name] = true;
}

function processOptions(
  itr: Iterator<string>,
  optMapAlias: ExpandedOptionInformationMap,
): {
  options: NamedOptionMap;
  unnamedList: UnnamedOptionList;
  alone: boolean;
} {
  const unnamedList: UnnamedOptionList = [];
  const options: NamedOptionMap = {};
  let aloneOpt;
  for (let r, firstOpt = true; !(r = itr.next()).done; firstOpt = false) {
    const arg = r.value;
    if (aloneOpt) {
      // 単独で指定されるはずなのに他のオプションが指定された
      return usage`${aloneOpt} must be specified alone.`;
    }
    if (arg === '--') {
      // --以降はすべて無名オプション
      for (let r; !(r = itr.next()).done; ) {
        unnamedList.push(r.value);
      }
      // 解析はこれで終了
      break;
    }
    if (!optMapAlias[arg]) {
      if (arg[0] === '-') {
        // optMapにないオプションが指定された
        return usage`unknown options: ${arg}`;
      }
      unnamedList.push(arg);
      continue;
    }
    const { name, info } = optMapAlias[arg];
    if (info.alone) {
      if (!firstOpt) {
        // 単独で指定されるはずなのに既に他のオプションが指定されている
        return usage`${arg} must be specified alone.`;
      }
      aloneOpt = arg;
    }
    // istanbul ignore next defaultへの分岐がcoverできないのでここはチェックしない
    switch (info.type) {
      case 'string':
        parseStringOption(arg, name, info, itr, options);
        break;
      case 'number':
        parseNumberOption(arg, name, info, itr, options);
        break;
      case 'boolean':
        parseFlagOption(arg, name, info, itr, options);
        break;
      default:
        assertNever(
          info,
          '正規化されているのでstring/number/boolean以外はないはず',
        );
    }
  }
  return {
    options,
    unnamedList,
    alone: aloneOpt !== undefined,
  };
}

function validateNamedOptions(
  options: NamedOptionMap,
  optMapAlias: ExpandedOptionInformationMap,
): void {
  for (const [optArg, { name, info }] of Object.entries(optMapAlias)) {
    // 指定されていればスキップ
    if (name in options) {
      continue;
    }
    assert(typeof info === 'object', 'infoはobjectのはず');
    // requiredなのに指定されていなかったらエラー
    if (info.required) {
      return usage`${optArg} required`;
    }
    // デフォルト値が指定されていたら設定
    if (info.default !== undefined) {
      options[name] = info.default;
      continue;
    }
    // 複数指定の場合は指定されていなくても0もしくは空配列を設定
    if (info.multiple) {
      options[name] = info.type === 'boolean' ? 0 : [];
      continue;
    }
  }
}

function validateUnnamedOptions(
  unnamedList: UnnamedOptionList,
  optMapUnnamed: UnnamedOptionInfo,
): void {
  // 無名オプションの制約
  const { min, max } = optMapUnnamed;
  if (min !== undefined && unnamedList.length < min) {
    return usage`At least ${min} ${example(optMapUnnamed, true)} required.`;
  }
  if (max !== undefined && unnamedList.length > max) {
    return usage`Too many ${example(
      optMapUnnamed,
      true,
    )} specified(up to ${max}).`;
  }
}

/**
 * オプションを解析する。
 *
 * @param {Iterator<string, unknown, undefined>} itr
 * @param {ParseContext} context
 */
function parseOptions(
  itr: Iterator<string>,
  optMap: NormalizedOptionInformationMap,
): NamedOptionMap {
  // エイリアスを含めたオプションの詳細マップ
  const optMapAlias = expandAlias(optMap);
  try {
    const {
      /** 単独で指定されるオプション */
      alone,
      /** 名前付きオプション */
      options,
      /** 無名オプション */
      unnamedList,
    } = processOptions(itr, optMapAlias);
    // 単独オプションが指定されていたらデフォルト値の設定、および無名オプションの追加を行わない
    if (!alone) {
      // デフォルト値の設定など指定されなかったオプションの処理
      validateNamedOptions(options, optMapAlias);
      if (optMap[unnamed]) {
        validateUnnamedOptions(unnamedList, optMap[unnamed]);
      }
      // 無名オプションを追加
      Object.defineProperty(options, unnamed, {
        value: Object.freeze(unnamedList),
      });
    }
    // helpStringを追加
    Object.defineProperty(options, helpString, {
      get() {
        return makeHelpString(optMap);
      },
    });
    // 変更不可にする
    Object.freeze(options);
    return options;
  } catch (ex) {
    if (
      optMap[helpString]?.showUsageOnError &&
      ex instanceof CommandLineParsingError
    ) {
      // showUsageOnErrorが指定されていた場合は、解析エラー発生時にヘルプを表示して終了する
      process.stderr.write(`${ex.message}\n\n${makeHelpString(optMap)}`);
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
      if (
        !ex ||
        (typeof ex !== 'object' && typeof ex !== 'function') ||
        !('code' in ex) ||
        ex.code !== 'ENOENT'
      ) {
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
  throw new TypeError(`package.json not found`);
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
 * @param {NormalizedOptionInformationMap} optMap コマンドラインオプションの詳細情報。
 * @returns {string} コマンドラインオプションのヘルプ用文字列。
 */
function makeHelpString(optMap: NormalizedOptionInformationMap): string {
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
    assert(typeof info === 'object', 'infoはobjectのはず');
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
        `  node ${
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
    assert(typeof info === 'object', 'infoはobjectのはず');
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
 * コマンドラインをoptMapにしたがって解析する。
 *
 * @template {OptionInformationMap} OptMap
 * @param optMap 解析するための情報。
 * @param args 解析するコマンドライン。
 * 省略時はprocess.argvの3つめから開始する。
 * @throws argsに問題がある場合には{@link CommandLineParsingError}を投げる。
 */
export function parse<OptMap extends OptionInformationMap>(
  _optMap: OptMap,
  args?: Iterable<string>,
): Options<OptMap> {
  // 省略記法などを正規化する
  const optMap = normalizeOptMap(_optMap);
  // optMapの内容チェック
  assertValidOptMap(optMap);
  // 解析対象のパラメーター取得
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
  return parseOptions(itr, optMap) as Options<OptMap>;
}

function assert(o: unknown, message?: string | (() => string)): asserts o {
  if (!o) {
    throw new TypeError(typeof message === 'function' ? message() : message);
  }
}
