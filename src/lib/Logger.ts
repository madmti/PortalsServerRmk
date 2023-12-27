import onFinished from 'on-finished';
import { RequestHandler } from 'express';
import { log } from './Actions';

const devlogger: RequestHandler = (req, res, next) => {
	const method = req.method;
	const url = req.originalUrl;

	const startTime = Date.now();
	onFinished(res, (err, response) => {
		const time = Date.now() - startTime;
		const status = response.statusCode;
        //@ts-ignore
		log([method.italic.bold, url.blue, status.toString().magenta, `${time}ms`.dim], 0);
	});

	next();
};

type modes = 'dev' | 'min';

export default function Madlogger(mode: modes) {
	return devlogger;
}
