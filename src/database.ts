import { connect } from 'mongoose';
import { URI, ROOT_PASW, ROOT_USER } from 'public.env';

export const connectDB = async () => {
	await connect(URI, {
		auth: {
			username: ROOT_USER,
			password: ROOT_PASW,
		},
	});
	console.log('DB redy'.bgMagenta);
};
