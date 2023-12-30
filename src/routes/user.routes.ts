import { checkPayload } from '@/lib/Actions';
import { UserLockModel } from '@/models/authlogin';
import { RequestModel, UserDataModel } from '@/models/userdata';
import { Router } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { UserData } from '@/lib/Types';

const router = Router();

router.post('/edit', async (req, res) => {
	if (!req.body || !req.headers.authorization) {
		res.json({ status: false, msg: 'invalid fields' });
		return;
	}

	const payload = checkPayload(req.headers.authorization);
	const data: { username: string } = req.body;

	if (!payload) {
		res.json({ status: false, msg: 'invalid payload' });
		return;
	}

	const user = await UserLockModel.findById(payload.user._id).populate('ref');
	const userData = await UserDataModel.findById(payload.user._id);
	if (!user || user === null || !userData || userData === null) {
		res.json({ status: false, msg: 'user not registered' });
		return;
	}

	const nameExists = await UserLockModel.findOne({ name: data.username });

	if (nameExists) {
		res.json({ status: false, msg: 'username already exists' });
		return;
	}
	user.name = data.username;
	userData.name = data.username;
	await user.save();
	await userData.save();
	res.json({ status: true, msg: 'changed succesfully', redirect: '/renew' });
});

router.post(
	'/img',
	bodyParser.raw({
		inflate: false,
		type: 'application/octet-stream',
		limit: '11mb',
	}),
	async (req, res) => {
		if (!req.body || !req.headers.authorization || !req.headers.filetype) {
			res.json({ status: false, msg: 'invalid fields' });
			console.log(req.headers.authorization, req.headers.filetype);
			return;
		}
		const payload = checkPayload(req.headers.authorization);
		if (!payload) {
			res.json({ status: false, msg: 'invalid payload' });
			return;
		}
		const user = await UserLockModel.findById(payload.user._id).populate('ref');
		if (!user || user === null) {
			res.json({ status: false, msg: 'user not registered' });
			return;
		}
		const filename = `${user.id}.${req.headers.filetype}`;
		fs.writeFileSync(
			path.join(path.dirname(import.meta.dir), 'static', 'users', filename),
			req.body
		);
		//@ts-ignore
		user.ref.imgUrl = 'static/users/' + filename;
		await user.save();
		res.json({ status: true, msg: 'succes', redirect: '/renew' });
	}
);

router.post('/request', async (req, res) => {
	if (!req.headers.authorization || !req.body.username) {
		res.json({ status: false, msg: 'invalid fields' });
		return;
	}

	const payload = checkPayload(req.headers.authorization);
	if (!payload) {
		res.json({ status: false, msg: 'invalid payload' });
		return;
	}
	const user = await UserLockModel.findById(payload.user._id);
	if (!user || user === null) {
		res.json({ status: false, msg: 'registry error' });
		return;
	}
	const friend = await UserDataModel.findOne({ name: req.body.username });
	if (!friend || friend === null) {
		res.json({ status: false, msg: 'username not registered' });
		return;
	}
	const newRequest = await RequestModel.create({
		type: 'friend',
		from: user,
		to: friend,
		data: null,
	});
	if (friend.requests === null) {
		friend.requests = [];
	}
	//@ts-ignore
	friend.requests.push(newRequest);
	await friend.save();
	res.json({ status: true, msg: `friend request sended to ${friend.name}` });
});

router.get('/friends', async (req, res) => {
	if (!req.headers.authorization) {
		res.json({ status: false, msg: 'invalid fields' });
		return;
	}

	const payload = checkPayload(req.headers.authorization);
	if (!payload) {
		res.json({ status: false, msg: 'invalid payload' });
		return;
	}
	const user = await UserDataModel.findById(payload.user._id).populate(
		'friends'
	);
	if (!user || user === null) {
		res.json({ status: false, msg: 'registry error' });
		return;
	}
	res.json({ status: true, friends: user.friends });
});

router.get('/request', async (req, res) => {
	if (!req.headers.authorization) {
		res.json({ status: false, msg: 'invalid fields' });
		return;
	}

	const payload = checkPayload(req.headers.authorization);
	if (!payload) {
		res.json({ status: false, msg: 'invalid payload' });
		return;
	}
	const user = await UserDataModel.findById(payload.user._id).populate({
		path: 'requests',
		populate: {
			path: 'from',
			model: 'UserData',
		},
	});
	if (!user || user === null) {
		res.json({ status: false, msg: 'registry error' });
		return;
	}
	res.json({ status: true, reqs: user.requests });
});

router.post('/request/call', async (req, res) => {
	if (
		!req.headers.authorization ||
		!req.body.reqID ||
		req.body.call === undefined
	) {
		res.json({ status: false, msg: 'invalid fields' });
		return;
	}

	const payload = checkPayload(req.headers.authorization);
	if (!payload) {
		res.json({ status: false, msg: 'invalid payload', del: false });
		return;
	}
	const request = await RequestModel.findById(req.body.reqID).populate({
		path: 'from',
		model: 'UserData',
	});
	if (!request || request === null) {
		res.json({ status: false, msg: 'does not exist', del: true });
		return;
	}
	const user = await UserDataModel.findById(payload.user._id);
	if (!user || user === null) {
		res.json({ status: false, msg: 'registry error', del: false });
		return;
	}
	if (req.body.call) {
		//@ts-ignore
		const from: UserData = request.from;
		const friend = await UserDataModel.findById(from._id);
		if (!friend || friend === null) {
			res.json({ status: false, msg: 'target user not found', del: true });
			return;
		}

		if (user.friends === null) user.friends = [];
		if (friend.friends === null) friend.friends = [];
		//@ts-ignore
		user.friends.push(friend);
		//@ts-ignore
		friend.friends.push(user);
		await friend.save();
	}
	user.requests?.splice(user.requests.indexOf(req.body.reqID), 1);
	await user.save();

	res.json({ status: true, msg: 'friend added correctly', del: true });
});

export default router;
