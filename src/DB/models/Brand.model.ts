import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import slugify from 'slugify';
import { IBrand } from 'src/common/interfaces/brand.interface';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({
  timestamps: true,
  strictQuery: true,
})
export class Brand implements IBrand {
  @Prop({
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
    minlength: 2,
  })
  name: string;

  @Prop({ type: String, maxlength: 60, minlength: 2 })
  slug: string;

  @Prop({ type: String, required: true, maxlength: 70, minlength: 2 })
  slogan: string;
  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
  @Prop()
  deletedAt?: Date;

  @Prop()
  freezeAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  freezeBy?: Types.ObjectId;

  @Prop()
  restoreAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  restoreBy?: Types.ObjectId;
}
export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

BrandSchema.pre(['findOne', 'find'], function (next) {
  const query = this.getQuery();
  // console.log(this)
  if (query.paranoid == false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } });
  }
  next();
});

BrandSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const query = this.getQuery();
  if (query.paranoid == false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } });
  }
  next();
});
BrandSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate() as UpdateQuery<BrandDocument>;
  if (update.name) {
    this.setUpdate({ ...update, slug: slugify(update.name) });
    next();
  }
});

export const BrandModel = MongooseModule.forFeature([
  { name: Brand.name, schema: BrandSchema },
]);
