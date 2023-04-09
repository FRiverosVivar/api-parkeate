import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { from, Observable } from 'rxjs';
@Injectable()
export class CryptService {
  private static rounds = 10;
  compare(bodyPassword: string, bdPassword: string): Observable<boolean> {
    return from(bcrypt.compare(bodyPassword, bdPassword));
  }
  hash(passwordToHash: string): Observable<string> {
    return from(
      bcrypt.hash(
        passwordToHash,
        process.env.HASH_ROUNDS
          ? bcrypt.genSaltSync(parseInt(process.env.HASH_ROUNDS))
          : bcrypt.genSaltSync(CryptService.rounds),
      ),
    );
  }
}
