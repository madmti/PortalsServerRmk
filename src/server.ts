import express from 'express';
import cors from 'cors';
import routerAuth from '@/routes/auth.routes';
import routerData from '@/routes/servers.routes';
import { enable } from 'colors';
import { connectDB } from '@/database';
import { log } from './lib/Actions';
import Madlogger from './lib/Logger';
enable();

connectDB();

const app = express();

app.set('port', process.env.PORT || 3000);

app.use(express.json());
app.use(Madlogger('dev'));
app.use(cors());
app.use('/auth', routerAuth);
app.use('/data', routerData);

app.listen(app.get('port'), () => {
	console.log('');
	log(['PORTALS:'.bgBlue, 'REST API'.cyan ], 0);
	console.log(`Running on port: ${app.get('port')}\n`.cyan);
});