import { connect } from 'mongoose';
import { URI, ROOT_PASW, ROOT_USER } from 'public.env';

export const connectDB = async () => {
	try{
		await connect(URI, {
			auth: {
				username: ROOT_USER,
				password: ROOT_PASW,
			},
		});
		console.log('DB: CONNECTED'.bgMagenta);
	} catch {
		console.log('DB ERROR: NO CREDENTIAL WAS PROVIDED'.bgRed);
		console.log('DB: Trying to connect without credentials'.red);
		try {
			await connect(URI);
			console.log('DB: CONNECTED'.bgMagenta);
		} catch {
			console.log('DB: ERROR CONNECTING TO DATABASE'.bgRed);
		}
	}
};
