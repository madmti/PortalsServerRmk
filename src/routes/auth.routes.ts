import { Router } from 'express';
import { compare } from 'bcryptjs';
import { UserLockModel } from '@/models/authlogin';
import { createNewUser, genToken } from '@/lib/Actions';

const router = Router();

router.post('/login', async (req, res) => {
	const user = await UserLockModel.findOne({ name: req.body.user });

	if (user === null || !user || !req.body.pasw || !req.body.user) {
		res.json({ status: false, msg: 'username not registered' });
		return;
	}

	const isCorrect = await compare(
		req.body.pasw?.toString(),
		user.password.toString()
	);

	if (!isCorrect) {
		res.json({ status: false, msg: 'credentials did not match' });
        return;
	}

	const token = genToken(user._id.toString(), user.name);
	res.json({
		status: true,
		msg: 'authenticated',
		cookie: `portals:stoken=${token};path=/`,
		redirect: '/home',
	});
});


router.post('/register', async (req, res) => {
    if (!req.body.pasw || !req.body.user || !req.body.email) { res.json({status:false, msg:'not valid fields'}); return; };

    const areUsersEmail = await UserLockModel.findOne({email:req.body.email});

    if (areUsersEmail){ res.json({status:false, msg:'email alredy registered'}); return; };

    const areUsersName = await UserLockModel.findOne({name:req.body.user});

	if (areUsersName){ res.json({status:false, msg:'username alredy registered'}); return; };

    const token = await createNewUser(req.body.user.toString(), req.body.pasw.toString(), req.body.email.toString());

    if (!token){ res.json({status:false, msg:'error creating user'}); return; };

    res.json({
        status:true,
        msg:'authenticated',
        cookie:`portals:stoken=${token}`,
        redirect:'/home'
    });
});

router.post('/forgot', async (req, res) => {
	if (!req.body.email){ res.json({status:false, msg:'not valid field'}); return; };

	const user = await UserLockModel.findOne({ email:req.body.email });

	if (!user){ res.json({status:false, msg:'Email not registered'}); return; };

	// Enviar email con codigo OTP

	res.json({
		status:true,
		msg:'Email sended',
		redirect:'/forgot/otp'
	});
});

export default router;
