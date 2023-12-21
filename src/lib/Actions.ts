import { UserLockModel } from '@/models/authlogin';
import { UserDataModel } from '@/models/userdata';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export const getDateNow = () => new Date(Date.now()).toISOString();

export const genToken = (_id: string, name: String): string => {
	const tk = sign(
		{
			user: {
				id: _id,
				name: name,
			},
			auth: {
				date: getDateNow(),
			},
		},
		'tk'
	);
	return tk;
};

export const createNewUser = async (name: string, pasw: string, email:string) => {
	const hashPasw = await hash(pasw, 12);
	const userLock = await UserLockModel.create({
		name: name,
		password: hashPasw,
		email: email,
		isSuper: false,
	});
	const userData = await UserDataModel.create({
		_id: userLock._id,
		name: userLock.name,
		alias: null,
		imgUrl: null,
		servers: [],
		created: 0,
	});
	try {
		await userLock.save();
		await userData.save();
	} catch {
		return false;
	}
	const token = genToken(userLock._id.toString(), userLock.name);
	return token;
};
