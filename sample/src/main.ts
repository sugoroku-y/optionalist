import * as path from 'path';

function loadConfigfile(_:string):void{}
function initializeProject(): void {}
function executeFile(_:string):void {
  
}
function watch(_:string[], _callback: (filename: string) => void): never {
  process.exit(0);
}

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
    describe: 'Initialize your project.'
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
  [optionalist.unnamed]: {
    example: 'script_filename',
    describe: 'Specify the script filename(s) to execute.',
  },
});
// この時点でのoptionsは
type typeof_options$1 = {
  readonly output: string;
  readonly config: string;
  readonly watch?: true;
  readonly [optionalist.unnamed]: readonly string[];
  readonly [optionalist.helpString]: string;
} | {
  readonly help: true;
  readonly [optionalist.helpString]: string;
} | {
  readonly init: true;
  readonly [optionalist.helpString]: string;
};

// `alone: true`なオプションが指定されたかどうかの判定には`in`を使う
// --helpが指定されたとき
if ('help' in options) {
  // [optionalist.helpString]はコマンドの説明用文字列を返す。
  console.log(options[optionalist.helpString]);
  // この例では以下のような文字列になる。
  // Version: sample 0.0.1
  // Usage:
  //   npx sample --output output_filename [--config config_filename] [--watch] [--] [script_filename...]
  //   npx sample --help
  //   npx sample --init
  //
  // Description:
  //   The description for command.
  //
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
  //   [--] [script_filename...]
  //     Specify the script filename(s) to execute.
  //
  process.exit(0);
}

// この時点でのoptionsは
type typeof_options$2 = {
  readonly output: string;
  readonly config: string;
  readonly watch?: true;
  readonly [optionalist.unnamed]: readonly string[];
  readonly [optionalist.helpString]: string;
} | {
  readonly init: true;
  readonly [optionalist.helpString]: string;
};

// --initが指定されたとき
if ('init' in options) {
  initializeProject();
  process.exit(0);
}

// この時点でのoptionsは
type typeof_options$3 = {
  readonly output: string;
  readonly config: string;
  readonly watch?: true;
  readonly [optionalist.unnamed]: readonly string[];
  readonly [optionalist.helpString]: string;
};

// つまり`alone: true`が指定されたオプションの処理をすべて終わらせないと
// 通常のオプションの処理を始められない。
// プロパティはそれぞれ指定された型になっている。

loadConfigfile(options.config);

for (const file of options[optionalist.unnamed]) {
  executeFile(file);
}

if (options.watch) {
  const list = options[optionalist.unnamed].slice(0);
  watch(list, file => executeFile(file));
}
