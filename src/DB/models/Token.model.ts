import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { IToken } from 'src/common/interfaces/token.interface';

export type TokenDocument = HydratedDocument<Token>;

@Schema({
  timestamps: true,
})
export class Token implements IToken {
  @Prop({ required: true, unique: true })
  jti: string;

  @Prop({ required: true })
  expiresIn?: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId?: Types.ObjectId;
}
const TokenSchema = SchemaFactory.createForClass(Token);

export const TokenModel = MongooseModule.forFeature([
  { name: Token.name, schema: TokenSchema },
]);
