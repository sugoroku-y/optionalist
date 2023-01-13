import * as path from 'path';

function loadConfigfile(_:string):void{}
function initializeProject(): void {}
function executeFile(_:string, _output: string):void {
  
}
function watch(_:string[], _callback: (filename: string) => void): never {
  process.exit(0);
}

import * as optionalist from '../';

// ```ts:#1
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
// ```

// ```ts:#2
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
  //   node sample --output output_filename [--config config_filename] [--watch] [--timeout parameter] [--] [script_filename...]
  //   node sample --help
  //   node sample --init

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
  executeFile(file, options.output);
}

if (options.watch) {
  const list = options[optionalist.unnamed].slice(0);
  watch(list, file => executeFile(file, options.output));
}
// ```
