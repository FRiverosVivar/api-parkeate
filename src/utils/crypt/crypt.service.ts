import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { from, Observable } from "rxjs";
import * as crypto from "crypto-js";

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
          : bcrypt.genSaltSync(CryptService.rounds)
      )
    );
  }
  HmacSHA256(path: string) {
    return crypto
      .HmacSHA256(path, "tkpi34405ded041541007e3172b46e71")
      .toString();
  }
}
