import { connect } from 'mongoose';
import { URI } from 'public.env';

export const connectDB = async () => {
    await connect(URI);
    console.log('DB redy'.bgMagenta);
};
