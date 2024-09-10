import { Global, Module } from '@nestjs/common';
import { UserEntity } from 'src/user/entity/user.entity';
import { TransbankService } from 'src/utils/transbank/transbank.service';
import { TransbankModel } from './model/transbank.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransbankEntity } from './entity/transbank.entity';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
    imports: [
    TypeOrmModule.forFeature([TransbankEntity])
    ],
    providers: [TransbankService],
    exports: [TransbankService],
})
export class TransbankModule {}
