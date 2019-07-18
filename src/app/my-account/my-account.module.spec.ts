import { MyAccountModule } from './my-account.module';

describe('MyAccountModule', () => {
  let myAccountModule: MyAccountModule;

  beforeEach(() => {
    myAccountModule = new MyAccountModule();
  });

  it('should create an instance', () => {
    expect(myAccountModule).toBeTruthy();
  });
});
