// @nestjs/throttler is CommonJS and require()s ESM @nestjs/common, which Jest's
// VM modules can't do on Node 22. Throttling isn't under test, so stub it out.
// Call before dynamically importing anything that imports @nestjs/throttler.
export function mockThrottler() {
  const noopDecorator = () => () => undefined;

  jest.unstable_mockModule('@nestjs/throttler', () => ({
    ThrottlerGuard: class {
      canActivate() {
        return true;
      }
    },
    ThrottlerModule: { forRoot: () => ({ module: class {} }) },
    Throttle: noopDecorator,
    SkipThrottle: noopDecorator,
  }));
}
