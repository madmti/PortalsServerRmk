import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import routerAuth from '@/routes/auth.routes';
import routerData from '@/routes/servers.routes';
import { enable } from 'colors';
import { connectDB } from '@/database';
enable();

connectDB();

const app = express();

app.set('port', process.env.PORT || 3000);

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
app.use('/auth', routerAuth);
app.use('/data', routerData);

app.listen(app.get('port'), () => {
	console.log('');
	console.log('PORTALS: REST API'.bgBlue);
	console.log(`Running on port: ${app.get('port')}`.cyan);
});