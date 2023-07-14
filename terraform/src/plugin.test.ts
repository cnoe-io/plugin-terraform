import { terraformPlugin } from './plugin';

describe('testplugin', () => {
  it('should export plugin', () => {
    expect(terraformPlugin).toBeDefined();
  });
});
