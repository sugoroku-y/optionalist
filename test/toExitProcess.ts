class ProcessExitException {}

class ProcessExitContext {
  private readonly process_exit = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => {
      throw new ProcessExitException();
    });

  private checked = false;

  constructor(private readonly code?: number) {}

  check(state?: { ex: unknown }): jest.CustomMatcherResult {
    this.checked = true;
    let pass = false;
    let message = '';
    BLOCK: {
      if (this.process_exit.mock.calls.length > 0) {
        // process.exitが1度でも呼ばれた
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const actual = this.process_exit.mock.calls[0]![0] ?? 0;
        if (this.code === undefined) {
          // 期待する終了コードが指定されていなければ、終了コードが何であっても成功
          pass = true;
          message = `Received function exit process, but not expected.`;
          break BLOCK;
        }
        // 期待する終了コードが指定されていれば、実際の終了コードと比較
        if (actual !== this.code) {
          // 期待する終了コードと一致しない -> 失敗
          message = `Excepted process exit code: ${this.code}\nReceived process exit code: ${actual}`;
          break BLOCK;
        }
        // 期待する終了コードと一致 -> 成功
        pass = true;
        message = `Received function exit process with ${actual}`;
        break BLOCK;
      }
      if (state) {
        // process.exitが1度も呼ばれず、例外が投げられた -> 例外をそのまま投げなおす
        throw state.ex;
      }
      // process.exitが1度も呼ばれない場合
      message = `Received function did not exit process.`;
      break BLOCK;
    }
    return { pass, message: () => message };
  }

  dispose() {
    if (this.checked) {
      this.process_exit.mockRestore();
    }
  }
}

function toExitProcess(
  this: jest.MatcherContext,
  received: () => unknown,
  code?: number,
): jest.CustomMatcherResult | Promise<jest.CustomMatcherResult> {
  const context = new ProcessExitContext(code);
  try {
    const result = received();
    if (result instanceof Promise) {
      return (async () => {
        try {
          await result;
          return context.check();
        } catch (ex: unknown) {
          return context.check({ ex });
        } finally {
          context.dispose();
        }
      })();
    }
    return context.check(undefined);
  } catch (ex) {
    return context.check({ ex });
  } finally {
    context.dispose();
  }
}
expect.extend({ toExitProcess });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/ban-types
    interface Matchers<R, T = {}> {
      toExitProcess(
        code?: number,
      ): T extends (...args: unknown[]) => infer TR
        ? TR extends Promise<unknown>
          ? Promise<R>
          : R
        : never;
    }
  }
}

export {};
