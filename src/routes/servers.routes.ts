import { checkPayload, EasyTryCatch } from '@/lib/Actions';
import { UserLockModel } from '@/models/authlogin';
import { ChannelModel, ServerModel } from '@/models/servers';
import { UserDataModel } from '@/models/userdata';
import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
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

router.get('/servers/create', async (req, res) => {
	const origin = req.headers.referer;

	if (
		!origin ||
		!req.query.desc ||
		!req.query.user ||
		!req.query.name ||
		!req.query.public
	) {
		res.json({ status: false });
		return;
	}

	const user = await UserDataModel.findById(req.query.user);
	const userLock = await UserLockModel.findById(req.query.user);

	if (!user || !userLock || (user.created !== 0 && !userLock.isSuper)) {
		res.json({ status: false });
		return;
	}

	const server = await ServerModel.create({
		name: req.query.name.toString(),
		isPublic: Boolean(req.query.public),
		key: null,
		channels: [],
		description: req.query.desc.toString(),
	});

	await server.save();
	if (!user.created || user.created === null) {
		user.created = 0;
	}
	user.created = user.created.valueOf() + 1;
	user.servers?.push(server);
	await user.save();

	const defaultChan = await ChannelModel.create({
		from: server,
		name: 'Default',
		is: 'text',
		history: null,
	});

	server.super = user;
	await defaultChan.save();
	server.channels?.push(defaultChan);
	await server.save();

	res.redirect(`${origin}servers`);
});

router.post('/servers/join', async (req, res) => {
	if (!req.body.server || !req.body.user) {
		res.json({ status: false, msg: 'params error' });
		return;
	}

	const user = await UserDataModel.findById(req.body.user);
	const toFindById = isValidObjectId(req.body.server);
	const server = toFindById
		? await ServerModel.findById(req.body.server)
		: await ServerModel.findOne({ name: req.body.server });

	if (!server) {
		res.json({ status: false, msg: 'server does not exist' });
		return;
	}
	if (!user) {
		res.json({ status: false, msg: 'user not registered' });
		return;
	}
	if (user.servers?.some((id) => id.toString() === server._id.toString())) {
		res.json({ status: false, msg: 'user already in.' });
		return;
	}

	user.servers?.push(server);
	user.save();

	res.json({
		status: true,
		msg: 'user succesfully joined the server',
		redirect: '/servers',
	});
});

/*
router.get('/chan/add', async (req, res) => {
	const origin = req.headers.referer;
	if (!req.query.id || !req.query.name || !req.query.type) {
		res.redirect(`${origin}servers`);
		return;
	}
	res.redirect(`${origin}servers`);

	const server = await ServerModel.findById(req.query.id);
	if (!server || server === null) {
		res.redirect(`${origin}servers`);
		return;
	}

	const channel = await ChannelModel.create({
		name: req.query.name,
		is: req.query.type,
		history: null,
		from: server,
	});
	await channel.save();

	if (server.channels === null) {
		server.channels = [];
	}
	server.channels?.push(channel);
	await server.save();

	res.redirect(`${origin}servers/${req.query.id}`);
});
*/
export default router;
