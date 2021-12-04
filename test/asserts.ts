export function assertToHaveProperty<TARGET, NAME extends string>(
  target: TARGET,
  name: NAME,
): asserts target is TARGET & { [N in NAME]: unknown };
export function assertToHaveProperty<TARGET, NAME extends string, VALUE>(
  target: TARGET,
  name: NAME,
  value: VALUE,
): asserts target is TARGET & { [N in NAME]: VALUE };
export function assertToHaveProperty(
  target: unknown,
  ...expected: [name: string, value?: unknown]
): void {
  expect(target).toHaveProperty(...expected);
}

export function assertNotToHaveProperty<TARGET, NAME extends string>(
  target: TARGET,
  name: NAME,
): asserts target is Exclude<TARGET, { [N in NAME]: unknown }>;
export function assertNotToHaveProperty<TARGET, NAME extends string, VALUE>(
  target: TARGET,
  name: NAME,
  value: VALUE,
): asserts target is Exclude<TARGET, { [N in NAME]: VALUE }>;
export function assertNotToHaveProperty(
  target: unknown,
  ...expected: [name: string, value?: unknown]
): void {
  expect(target).not.toHaveProperty(...expected);
}

export function assertToBeInstanceOf<
  CLASS extends new (...args: unknown[]) => unknown,
>(target: unknown, expected: CLASS): asserts target is InstanceType<CLASS> {
  expect(target).toBeInstanceOf(expected);
}

export function assertNotToBeInstanceOf<
  TARGET,
  CLASS extends new (...args: unknown[]) => unknown,
>(
  target: TARGET,
  expected: CLASS,
): asserts target is Exclude<TARGET, InstanceType<CLASS>> {
  expect(target).not.toBeInstanceOf(expected);
}
