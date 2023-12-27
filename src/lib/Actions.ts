import { UserLockModel } from '@/models/authlogin';
import { UserDataModel } from '@/models/userdata';
import { hash } from 'bcryptjs';
import { JwtPayload, sign } from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';

declare module 'jsonwebtoken' {
	interface JwtPayload {
		user: {
			id: string;
			name: string;
		};
		auth: {
			date: Date;
		};
	}
}

export const EasyTryCatch = async (callback: Function) => {
	let res = null;
	try {
		res = await callback();
	} catch {}
	return res;
};

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

export const checkPayload = (payload: string): JwtPayload | false => {
	if (!payload) false;
	const tempJSON = JSON.parse(payload);
	if (!tempJSON.user || !tempJSON.auth) return false;
	if (!isValidObjectId(tempJSON.user.id)) return false;

	const data: JwtPayload = {
		user: {
			id: tempJSON.user.id,
			name: tempJSON.user.name,
		},
		auth: {
			date: tempJSON.date,
		},
	};

	return data;
};

export const createNewUser = async (
	name: string,
	pasw: string,
	email: string
) => {
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

export const GroupBy = (
	groups: Array<string>,
	array: Array<any>,
	property: string | false
) => {
	const tmp = new Map();
	tmp.set('error', []);
	groups.forEach((group) => {
		//@ts-ignore
		tmp.set(group, []);
	});
	array.forEach((el) => {
		let find = el;
		if (property) {
			find = el[property];
		}
		//@ts-ignore
		if (!tmp.has(find)) {
			//@ts-ignore
			tmp.set('error', [...tmp.get('error'), el]);
		} else {
			//@ts-ignore
			tmp.set(find, [...tmp.get(find), el]);
		}
	});
	return tmp;
};

export const reduceArrOfArr = (arr: Array<Array<any>> | Map<any,any>) => {
	let temp: Array<any> = [];
	arr.forEach((el) => {
		temp.push(...el);
	});
	return temp;
};

export const log = (msg: string | Array<string>, indent: number) => {
	const spacing = '   '.repeat(indent);
	if (typeof msg === 'string') {
		console.log(spacing + msg);
		return;
	}
	console.log(spacing + msg.join(' '));
};
