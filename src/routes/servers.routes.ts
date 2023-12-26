import {
	checkPayload,
	EasyTryCatch,
	GroupBy,
	reduceArrOfArr,
} from '@/lib/Actions';
import { Channel } from '@/lib/Types';
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

	res.json({
		status: true,
		channels:
			server.channels === null
				? null
				: reduceArrOfArr(
						GroupBy(['text', 'voice', 'video'], server.channels, 'is')
				  ),
		server: server,
	});
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

router.post('/servers/create', async (req, res) => {
	console.log(req.body);

	if (!req.body.desc || !req.body.user || !req.body.name) {
		res.json({ status: false, msg: 'invalid fields' });
		return;
	}

	const user = await UserDataModel.findById(req.body.user);
	const userLock = await UserLockModel.findById(req.body.user);

	if (!user || !userLock) {
		res.json({ status: false, msg: 'registry error' });
		return;
	}

	const server = await ServerModel.create({
		name: req.body.name.toString(),
		isPublic: Boolean(req.body.isPublic),
		key: null,
		channels: [],
		description: req.body.desc.toString(),
		super: user,
	});

	await server.save();
	user.servers?.push(server);
	await user.save();

	const defaultChan = await ChannelModel.create({
		from: server,
		name: 'Default',
		is: 'text',
		history: null,
	});

	await defaultChan.save();
	server.channels?.push(defaultChan);
	await server.save();

	res.json({ status: true, msg: 'server created', redirect: '/servers' });
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

router.post('/channels/add', async (req, res) => {
	console.log(req.body);

	if (!req.body.user || !req.body.name || !req.body.is || !req.body.server) {
		res.json({ status: false, msg: 'invalid fields' });
		return;
	}

	const server = await ServerModel.findById(req.body.server);
	if (!server || server === null || server.super === null) {
		res.json({ status: false, msg: 'registry error' });
		return;
	}
	//@ts-ignore
	const isSuper = server.super.toString() === req.body.user;
	if (!isSuper) {
		res.json({ status: false, msg: 'permision denied' });
	}

	const channel = await ChannelModel.create({
		name: req.body.name,
		is: req.body.is,
		history: null,
		from: server,
	});
	await channel.save();

	if (server.channels === null) {
		server.channels = [];
	}
	server.channels?.push(channel);
	await server.save();

	res.json({
		status: true,
		msg: 'channel created',
		redirect: `/servers/${req.body.server}`,
	});
});

export default router;
