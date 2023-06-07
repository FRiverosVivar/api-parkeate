import * as lodash from 'lodash';
export function getCodeForRegister(): number {
  return lodash.random(1000, 9999);
}
