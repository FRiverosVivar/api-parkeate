import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { FileMiddleware } from './file/middleware/file-middleware.interface';
import { ValidationPipe } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
declare const module: any;
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('v1/api');
  const configService = app.get(ConfigService);
  app.use(
    graphqlUploadExpress(
      configService.get<FileMiddleware>('uploader.middleware'),
    ),
  );
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
