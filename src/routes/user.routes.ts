import { checkPayload } from '@/lib/Actions';
import { UserLockModel } from '@/models/authlogin';
import { UserDataModel } from '@/models/userdata';
import { Router } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

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
		const payload: JwtPayload = JSON.parse(req.headers.authorization);
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

export default router;
