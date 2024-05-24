import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class AwsAuthService {
  private jwksClient: jwksRsa.JwksClient;
  private userPoolId: string;

  constructor(private configService: ConfigService) {
    this.userPoolId = this.configService.get<string>('aws.userPoolId')!
    const region = this.configService.get<string>('aws.region');

    this.jwksClient = jwksRsa({
      jwksUri: `https://cognito-idp.${region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000,
    });
  }

  async validateToken(token: string): Promise<any> {
    const decodedToken = jwt.decode(token, { complete: true });

    if (!decodedToken || typeof decodedToken === 'string') {
      throw new Error('Invalid token');
    }

    const kid = decodedToken.header.kid;

    const key = await this.jwksClient.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    try {
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });

      return payload;
    } catch (err) {
      throw new Error('Token validation failed');
    }
  }
}
