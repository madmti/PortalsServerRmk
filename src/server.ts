import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import routerAuth from './routes/auth.routes';
import { enable } from 'colors';
import { connectDB } from './database';
enable();

connectDB().catch((re) => { console.log('DB ERROR'.bgRed); console.log(re.red) });

const app = express();

app.set('port', process.env.PORT || 3000);

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
app.use('/auth', routerAuth);


app.listen(app.get('port'), () => {
    console.log('');
    console.log('PORTALS: REST API'.bgBlue);
    console.log(`Running on port: ${app.get('port')}`.cyan);
});
