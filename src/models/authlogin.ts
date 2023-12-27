import { Schema, model } from 'mongoose';
import { type UserLock } from '@/lib/Types';

const AuthLoginSchema = new Schema<UserLock>({
	name: { type: String, required: true },
	password: { type: String, required: true },
	email: { type: String, required: true },
	isSuper: { type: Boolean, required: true },
	ref: { type: Schema.Types.ObjectId, ref: 'UserData' },
});

export const UserLockModel = model<UserLock>('AuthLogin', AuthLoginSchema);
