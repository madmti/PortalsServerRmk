import { checkPayload, EasyTryCatch } from '@/lib/Actions';
import { ChannelModel, ServerModel } from '@/models/servers';
import { UserDataModel } from '@/models/userdata';
import { Router } from 'express';
const router = Router();

router.get('/servers', async (req, res) => {
	if (!req.headers.authorization) {
		res.json({ status: false, msg: 'no authorization header' });
		return;
	}

	const payload = checkPayload(req.headers.authorization);

	if (!payload) {
		res.json({ status: false, msg: 'invalid stoken' });
		return;
	}

	const userData = await UserDataModel.findById(payload.user.id).populate(
		'servers'
	);

	if (!userData) {
		res.json({ status: false, msg: 'user not registered' });
		return;
	}

	res.json({ status: true, servers: userData.servers });
});

router.post('/servers/query', async (req, res) => {
	if (!req.headers.authorization) {
		res.json({ status: false, msg: 'no authorization header' });
		return;
	}
	const payload = checkPayload(req.headers.authorization);

	if (!payload) {
		res.json({ status: false, msg: 'invalid stoken' });
		return;
	}

	const servers = await ServerModel.find(req.body).populate('super');

	res.json({ status: true, servers: servers.length !== 0 ? servers : null });
});

router.get('/channels/:svId', async (req, res) => {
	if (!req.headers.authorization) {
		res.json({ status: false, msg: 'no authorization header' });
		return;
	}
	if (!req.params.svId) {
		res.json({ status: false, msg: 'params error' });
		return;
	}

	const payload = checkPayload(req.headers.authorization);

	if (!payload) {
		res.json({ status: false, msg: 'invalid stoken' });
		return;
	}

	const userData = await UserDataModel.findById(payload.user.id).populate(
		'servers'
	);
	const server = await ServerModel.findById(req.params.svId).populate(
		'channels'
	);

	if (
		!userData ||
		!server ||
		!userData?.servers?.some(
			(sv) => sv._id.toString() === server._id.toString()
		)
	) {
		res.json({ status: false, msg: 'not registered error' });
		return;
	}

	res.json({ status: true, channels: server.channels, server: server });
});

router.get('/channels/:svId/:chanId', async (req, res) => {
	if (!req.headers.authorization) {
		res.json({ status: false, msg: 'no authorization header' });
		return;
	}
	if (!req.params.svId) {
		res.json({ status: false, msg: 'params error' });
		return;
	}

	const payload = checkPayload(req.headers.authorization);

	if (!payload) {
		res.json({ status: false, msg: 'invalid stoken' });
		return;
	}

	const userData = await UserDataModel.findById(payload.user.id).populate(
		'servers'
	);
	const server = await ServerModel.findById(req.params.svId).populate(
		'channels'
	);
	const channel = await ChannelModel.findById(req.params.chanId)
		.populate({
			path: 'history',
			populate: {
				path: 'author',
				model: 'UserData',
			},
		})
		.exec();
	if (
		!userData ||
		!server ||
		!channel ||
		!userData?.servers?.some(
			(sv) => sv._id.toString() === server._id.toString()
		) ||
		!server?.channels?.some(
			(ch) => ch._id.toString() === channel._id.toString()
		)
	) {
		res.json({ status: false, msg: 'not registered error' });
		return;
	}

	res.json({ status: true, channel: channel, server: server });
});

export default router;
