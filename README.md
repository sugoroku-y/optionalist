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
} as const);
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

受け取った結果は自動的に型付けされ、もし指定されていればデフォルト値が設定された状態になっています。

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
  - `showUsageOnError`: コマンドラインでの指定に不備があった場合、ヘルプ用文字列を表示して終了するのであれば`true`を指定します。
- `[name: string]`: 各オプションの詳細を指定します。
  
  実際にコマンドラインパラメーターとして指定するには、`name`が一文字だけの場合は`-x`、2文字以上の場合は`--xxx`のように指定します。
  - `type`: オプションの型を指定します。
    
    `'string'`、`'number'`、`'boolean'`のいずれかを指定します。
    
    `'string'`の場合には文字列型、`'number'`の場合には数値型、`‘boolean'`の場合には真偽値型になります。
    
    省略時には`'string'`が指定されたものと見なします。
  - `constraints`: 文字列型、数値型の場合、指定できる値への制約を指定します。
    
    配列が指定された場合は、その中の1つが指定されていないとエラーになります。(`type: 'number'`、もしくは`type: 'string'`)
    
    `min`プロパティを持つオブジェクトが指定された場合は、`min`未満の値が指定されるとエラーになります。(`type: 'number'`)
    
    `max`プロパティを持つオブジェクトが指定された場合は、`max`より大きい値が指定されるとエラーになります。(`type: 'number'`)
    
    正規表現が指定された場合は、その正規表現にマッチしない値が指定されるとエラーになります。(`type: 'string'`)

    `type: 'boolean'`の場合には指定できません。
  - `example`: ヘルプ用文字列でパラメーターとして使用される文字列を指定します。
    
    たとえば`{alpha: {example: 'filename'}}`と指定した場合、ヘルプ用文字列では`--alpha filename`のように使用されます。
    
    `type: 'boolean'`の場合には指定できません。
  - `alone`: 単独で指定するオプションのときに`true`を指定します。
    
    ほかのオプションは名前付き、無名にかかわらず指定できなくなります。
  - `required`: 指定が必須なオプションのときに`true`を指定します。
    
    このオプションが指定されていないとエラーになります。

    `type: 'boolean'`の場合には指定できません。
  - `default`: このオプションが省略されたときに使用するデフォルト値を指定します。
    
    デフォルト値には`type: 'string'`の場合には文字列を、`type: 'number'`の場合には数値を指定しなければなりません。
    
    `type: 'boolean'`の場合には指定できません。
  - `alias`: オプションの別名を指定します。
    
    実際にコマンドラインで使用する場合には、`name`と同様に一文字だけの場合は`-x`、2文字以上の場合は`--xxx`のように指定します。
    
    複数指定するには配列で指定します。
  - `describe`: オプションの説明を指定します。
    
    ヘルプ用文字列で使用されます。
- `[optionalist.unnamed]`: 無名オプションの詳細を指定します。
  - `example`: ヘルプ用文字列の中で無名オプションを指す名前を指定します。
  - `describe`: ヘルプ用文字列の中で使用される無名オプションの説明を指定します。
  - `min`: 無名オプションの最小個数を指定します。
    
    省略時には最小個数のチェックを行いません。
  - `max`: 無名オプションの最大個数を指定します。
    
    省略時には最大個数のチェックを行いません。

## 解析するコマンドライン

`parse`の第2引数には解析するコマンドラインを指定します。

省略時には`process.argv`の3番目から解析を開始します。

## 解析結果

返値には解析結果を指定されたオプションの名前と型を持つオブジェクトにして返します。

`alone`を指定したオプションがある場合は、`alone`を指定したオプションだけの型と、それ以外のオプションだけの型のUnion型になっています。

```ts
const options = optionalist.parse({aaa: {alone: true, type: 'boolean'}, bbb: '', ccc: 0});
// options:
// | {
//   aaa: true; // aaaだけが存在する。
//   bbb?: never;
//   ccc?: never;
//   [unnamed]?: never; // unnamedもなし
//   [helpString]: string; // helpStringだけはヘルプのため常に追加
// }
// | {
//   aaa?:never; // aaaはなし
//   bbb: string;
//   ccc: number;
//   [unnamed]: string[];
//   [helpString]: string; // helpStringだけはヘルプのため常に追加
// }
```

`alone`なオプションが指定された場合、その他のオプションは指定されていないため`undefined`になっていることに注意してください。

逆にその他のオプションを使うときはすべての`alone`なオプションが指定されていないことを確認してからでないと、通常のプロパティのようにアクセスできません。これにより`alone`なオプションの処理漏れが防げます。

```ts
if (options.aaa) {
  assert(options.bbb === undefined);
  assert(options.ccc === undefined);
  process.exit(0);
}

const { bbb,ccc } = options;
assert(typeof bbb === 'string');
assert(typeof ccc === 'number');
```

通常のオプションはoptionalになっていますが、必須のオプション、およびデフォルト値の指定されたオプションは非optionalとなっています。

```ts
  const options = optionalist.parse({
    aaa: {
      type: 'string',
    },
    bbb: {
      required: true,
    },
    ccc: {
      default: 'ccc',
    },
  });
  const { aaa, bbb, ccc } = options;
  // aaaにはrequiredもdefaultも指定されていないのでoptional
  assert(aaa === undefined || typeof aaa === 'string');
  // bbbにはrequiredが指定されているので非optional
  assert(typeof bbb === 'string');
  // cccにはdefaultが指定されているので非非optional
  assert(typeof ccc === 'string');
```

無名オプションは`[optionalist.unnamed]`で`string`の配列として取得できます。

```ts
for (const arg og options[optionalist.unnamed]) {
  // ...
}
```

## ヘルプ

使い方を表示したい場合には、指定された情報から自動的に生成したヘルプ用文字列が`[optionalist.helpString]`で取得できます。

またparseの第1引数の`[optionalist.helpString]`に`showUsageOnError`を指定していると、コマンドライン引数にエラーがあったとき、使い方を表示して終了します。

```ts
const options = optionalist.parse({
  // ...
  help: {alone: true, type: 'boolean'},
  [optionalist.helpString]: {
    // コマンドライン引数での指定にエラーがあれば使い方を表示して終了
    showUsageOnError: true,
  },
});

if (options.help) {
  // --helpが指定されたらヘルプを表示して終了
  console.log(options[optionalist.helpString]);
  process.exit(0);
}
```

VS Codeなどの型情報が表示されるエディターを使用しているなら、各パラメーターの説明が表示されるようにしています。

```ts
const options = optionalist.parse({
  // ...
  config: {
    default: path.resolve('config.json'),
    describe: 'Specify the configuration file for your project.',
    example: 'config_filename',
  },
  // ...
});
```

のように記述していれば

```ts
loadConfigfile(options.config);
```

と記述したときに、`.config`にマウスカーソルを合わせれば、

```ts
(property) config: string & {
    [describe]?: "Specify the configuration file for your project." | undefined;
}
```

のように表示されます。
