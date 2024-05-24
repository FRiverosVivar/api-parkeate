import { Global, Module } from "@nestjs/common";
import { AuthService } from "./service/auth.service";
import { PassportModule } from "@nestjs/passport";
import { JwtModule, JwtSecretRequestType, JwtService } from "@nestjs/jwt";
import { jwtConstants } from "../user/constants/constants";
import { LocalStrategy } from "./strategy/local.strategy";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { CryptService } from "../utils/crypt/crypt.service";
import { AuthResolver } from "./resolver/auth.resolver";
import { UserModule } from "../user/user.module";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UserTypeGuard } from "./guards/user-type.guard";
import { ClientModule } from "../client/client.module";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientEntity } from "../client/entity/client.entity";
import { AuthUserEntity } from "./entity/auth-user.entity";
import { UserService } from "../user/service/user.service";
import { ClientService } from "../client/service/client.service";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuthUserEntity]),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      publicKey: jwtConstants.publicKey,
      privateKey: jwtConstants.privateKey,
      signOptions: { expiresIn: "60s" },
      secretOrKeyProvider: (requestType: JwtSecretRequestType) => {
        switch (requestType) {
          case JwtSecretRequestType.SIGN:
            return jwtConstants.privateKey;
          case JwtSecretRequestType.VERIFY:
            return jwtConstants.publicKey;
          default:
            return jwtConstants.secret;
        }
      },
    }),
    UserModule,
    ClientModule,
    HttpModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    LocalStrategy,
    CryptService,
    JwtStrategy,
    JwtService,
    JwtAuthGuard,
    UserTypeGuard,
  ],
  exports: [AuthService, CryptService, AuthResolver, JwtAuthGuard, JwtService],
})
export class AuthModule {}
