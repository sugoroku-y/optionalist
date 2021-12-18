# optionalist

The commandline parser for TypeScript.

optionalistはTypeScript向けに作られたコマンドラインパーザーです。

[![NPM version](https://img.shields.io/npm/v/optionalist.svg?style=flat)](https://www.npmjs.com/package/optionalist)
[![NPM monthly download](https://img.shields.io/npm/dm/optionalist.svg?style=flat)](https://www.npmjs.com/package/optionalist)
[![NPM total download](https://img.shields.io/npm/dt/optionalist.svg?style=flat)](https://www.npmjs.com/package/optionalist)
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

## 使い方

`optionalist.parse`にコマンドラインの詳細を渡して、解析した結果を受け取ります。

```ts:./sample/src/main.ts#1
import * as optionalist from 'optionalist';

const options = optionalist.parse({
  [optionalist.helpString]: {
    describe: 'The description for command.',
    showUsageOnError: true,
  },
  help: {
    type: 'boolean',
    alias: ['?', 'h'],
    alone: true,
    describe: 'Show this help.',
  },
  init: {
    type: 'boolean',
    alone: true,
    describe: 'Initialize your project.',
  },
  output: {
    type: 'string',
    required: true,
    describe: 'Specify the filename to output.',
    example: 'output_filename',
  },
  config: {
    default: path.resolve('config.json'),
    describe: 'Specify the configuration file for your project.',
    example: 'config_filename',
  },
  watch: {
    type: 'boolean',
    describe: 'Specify when you want to set the watch mode.',
  },
  timeout: {
    type: 'number',
  },
  [optionalist.unnamed]: {
    example: 'script_filename',
    describe: 'Specify the script filename(s) to execute.',
  },
});
options.help ? options : options.init ? options : options;
// この時点でのoptionsは
// const options:
//   | {
//       readonly help: true;
//       readonly init?: never;
//       readonly output?: never;
//       readonly config?: never;
//       readonly watch?: never;
//       readonly timeout?: never;
//       readonly [unnamed]?: never;
//       readonly [helpString]: string;
//     }
//   | {
//       readonly init: true;
//       readonly help?: never;
//       readonly output?: never;
//       readonly config?: never;
//       readonly watch?: never;
//       readonly timeout?: never;
//       readonly [unnamed]?: never;
//       readonly [helpString]: string;
//     }
//   | {
//       readonly [unnamed]: readonly string[];
//       readonly [helpString]: string;
//       readonly help?: never;
//       readonly init?: never;
//       readonly output: string;
//       readonly config: string;
//       readonly watch?: true;
//       readonly timeout?: number;
//     };
```

受け取った結果は自動的に型付けされ、デフォルト値が設定された状態になっています。

```ts:./sample/src/main.ts#2
// --helpが指定されたとき
if (options.help) {
  options;
  // このスコープでのoptionsは
  // const options: {
  //   readonly help: true;
  //   readonly init?: never;
  //   readonly output?: never;
  //   readonly config?: never;
  //   readonly watch?: never;
  //   readonly timeout?: never;
  //   readonly [unnamed]?: never;
  //   readonly [helpString]: string;
  // };

  // [optionalist.helpString]はコマンドの説明用文字列を返す。
  console.log(options[optionalist.helpString]);
  // この例では以下のような文字列になる。
  // Version: sample 0.0.1
  // Usage:
  //   npx sample --output output_filename [--config config_filename] [--watch] [--timeout parameter] [--] [script_filename...]
  //   npx sample --help
  //   npx sample --init

  // Description:
  //   The description for command.

  // Options:
  //   --help, -?, -h
  //     Show this help.
  //   --init
  //     Initialize your project.
  //   --output output_filename
  //     Specify the filename to output.
  //   --config config_filename
  //     Specify the configuration file for your project.
  //   --watch
  //     Specify when you want to set the watch mode.
  //   --timeout parameter
  //   [--] [script_filename...]
  //     Specify the script filename(s) to execute.
  //
  process.exit(0);
}

options.init ? options : options;
// この時点でのoptionsは
// const options:
//   | {
//       readonly init: true;
//       readonly help?: never;
//       readonly output?: never;
//       readonly config?: never;
//       readonly watch?: never;
//       readonly timeout?: never;
//       readonly [unnamed]?: never;
//       readonly [helpString]: string;
//     }
//   | {
//       readonly [unnamed]: readonly string[];
//       readonly [helpString]: string;
//       readonly help?: never;
//       readonly init?: never;
//       readonly output: string;
//       readonly config: string;
//       readonly watch?: true;
//       readonly timeout?: number;
//     };

// --initが指定されたとき
if (options.init) {
  options;
  // このスコープでのoptionsは
  // const options: {
  //   readonly init: true;
  //   readonly help?: never;
  //   readonly output?: never;
  //   readonly config?: never;
  //   readonly watch?: never;
  //   readonly timeout?: never;
  //   readonly [unnamed]?: never;
  //   readonly [helpString]: string;
  // };

  initializeProject();
  process.exit(0);
}

options;
// この時点でのoptionsは
// const options: {
//   readonly [unnamed]: readonly string[];
//   readonly [helpString]: string;
//   readonly help?: never;
//   readonly init?: never;
//   readonly output: string;
//   readonly config: string;
//   readonly watch?: true;
//   readonly timeout?: number;
// };

// プロパティはそれぞれ指定された型になっている。

loadConfigfile(options.config);

for (const file of options[optionalist.unnamed]) {
  executeFile(file);
}

if (options.watch) {
  const list = options[optionalist.unnamed].slice(0);
  watch(list, file => executeFile(file));
}
```

## コマンドラインの詳細

コマンドラインの詳細は`optionalist.parse`の第1引数に、以下のように指定します。

- `[optionalist.helpString]`: コマンド全体に関する指定を行います。
  - `describe`: ヘルプ用文字列で表示される、コマンドの説明を指定します。  
    省略時にはコマンドの説明が表示されません。
  - `showUsageOnError`: コマンドラインでの指定に不備があった場合に、  
    ヘルプ用文字列を表示して終了する場合に`true`を指定します。
- `[name: string]`: 各オプションの詳細を指定します。  
  実際にコマンドラインで使用する場合には、  
  `name`が一文字だけの場合は`-x`、  
  2文字以上の場合は`--xxx`のように指定します。
  - `type`: オプションの型を指定します。  
    `'string'`、`'number'`、`'boolean'`のいずれかを指定します。  
    `'string'`の場合には文字列型、`'number'`の場合には数値型、  
    `‘boolean'`の場合には真偽値型になります。  
    省略時には`'string'`が指定されたものと見なします。
  - `constraints`: 文字列型、数値型の場合、指定できる値への制約を指定します。  
    `type: 'number'`、もしくは`type: 'string'`で、配列が指定された場合は、  
    その中の1つが指定されていないとエラーになります。  
    `type: 'number'`で、`min`プロパティを持つオブジェクトが指定された場合は、  
    `min`未満の値が指定されるとエラーになります。  
    `type: 'number'`で、`max`プロパティを持つオブジェクトが指定された場合は、  
    `max`より大きい値が指定されるとエラーになります。  
    `type: 'boolean'`の場合には指定できません。
  - `example`: ヘルプ用文字列でパラメーターとして使用される文字列を指定します。  
    たとえば`{alpha: {example: 'filename'}}`と指定した場合  
    ヘルプ用文字列では`--alpha filename`のように使用されます。  
    `type: 'boolean'`の場合には指定できません。
  - `alone`: 単独で指定するオプションのときに指定します。  
    値に指定できるのは`true`だけです。
    ほかのオプションは名前付き、無名にかかわらず指定できなくなります。
  - `required`: 指定が必須なオプションのときに指定します。  
    値に指定できるのは`true`だけです。
    このオプションが指定されていないとエラーになります。  
    `type: 'boolean'`の場合には指定できません。
  - `default`: このオプションが省略されたときに  
    デフォルト値が指定されるようになります。  
    デフォルト値には`type: 'string'`の場合には文字列を  
    `type: 'number'`の場合には数値を指定しなければなりません。  
    `type: 'boolean'`の場合には指定できません。
  - `alias`: オプションの別名を指定します。  
    実際にコマンドラインで使用する場合には、  
   `name`と同様に一文字だけの場合は`-x`、  
    2文字以上の場合は`--xxx`のように指定します。
    複数指定するには配列で指定します。
  - `describe`: オプションの説明を指定します。
    ヘルプ用文字列で使用されます。
- `[optionalist.unnamed]`: 無名オプションの詳細を指定します。
  - `example`: ヘルプ用文字列の中で無名オプションを指す名前を指定します。
  - `describe`: ヘルプ用文字列の中で使用される  
    無名オプションの説明を指定します。
  - `min`: 無名オプションの最小個数を指定します。  
    省略時には最小個数のチェックを行いません。
  - `max`: 無名オプションの最大個数を指定します。  
    省略時には最大個数のチェックを行いません。

第2引数には解析するコマンドラインを指定します。  
省略時には`process.argv`の3番目から解析を開始します。

返値は指定されたオプションの名前と型を持つオブジェクトです。

単独オプションが指定されたときの型と、それ以外のオプションが指定されたときの型のUnion型になっています。

単独オプションが指定された場合、その他のオプションは指定されていないため`undefined`になっていることに注意してください。

逆にその他のオプションを使うはすべての単独オプションが指定されていないことを確認してからでないと、通常のプロパティのようにアクセスできません。これにより単独オプションの処理漏れが防げます。

通常のオプションはoptionalになっていますが、必須のオプション、およびデフォルト値の指定されたオプションは非optionalとなっています。

無名オプションは`[optionalist.unnamed]`で`string`の配列として取得できるようにしています。

また指定された情報から自動的にヘルプ用文字列を生成します。`[optionalist.helpString]`で取得できます。

単独で指定するオプションは、そのオプションと`[optionalist.helpString]`だけをプロパティとして持つ型となっており、その他のプロパティを持つ型とのUnionになっています。

単独で指定するオプションはそのオプションがundefinedでないことを確認してから使用します。ただし、boolean型だけはundefinedでなければtrueなので、いきなり真偽値として使用してしまっても構いません。

