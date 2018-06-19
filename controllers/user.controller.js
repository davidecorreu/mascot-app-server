const mongoose = require('mongoose');
const UserModel = require('../models/user');
const PetModel = require('../models/pet');
const OrganizationModel = require('../models/org');

const bcrypt = require('bcrypt');
const atob = require('atob');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const jwt_secret = process.env.JWT_SECRET;

const getUsers = async (ctx, next) => {
  console.log('getUsers, ctx.body:',ctx.body);
  try {
    ctx.body = await UserModel.find()
    ctx.status = 200;
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

const getUser = async (ctx, next) => {
  console.log('getUser, ctx.body:',ctx.params);

  try {
    const id = ctx.params.usr_id
    ctx.body = await UserModel.findById(id).populate('pets.pet')
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

const acceptAdoption = async (ctx, next) => {
  try {
    await UserModel.findByIdAndUpdate(ctx.params.usr_id,
      { $push: {
        pets: {
          org: ctx.request.body.org,
          pet: ctx.request.body.pet
        },
        messages: {
          org: ctx.request.body.org,
          pet: ctx.request.body.pet,
          message: "Su solicitud ha sido aprobada",
          alert: "success"
        }}
      });
    await OrganizationModel.findByIdAndUpdate(
      ctx.request.body.org,
      { $pull:
        { queries: { _id: ctx.request.body.query },
        pets: ctx.request.body.pet }
      });
    await PetModel.findByIdAndUpdate( ctx.request.body.pet,
      { adopted: true , owner: ctx.params.usr_id });
    ctx.status = 200
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

const rejectAdoption = async (ctx, next) => {
  try {
    await UserModel.findByIdAndUpdate(ctx.params.usr_id,
      { $push: {
        messages: {
          org: ctx.request.body.org,
          pet: ctx.request.body.pet,
          message: "Lo sentimos, su solicitud ha sido rechazada",
          alert: "danger"
        }}
      });
    await OrganizationModel.findByIdAndUpdate(
      ctx.request.body.org,
      { $pull:
        { queries: { _id: ctx.request.body.query } }
      });
    await PetModel.findByIdAndUpdate(
      ctx.request.body.pet,
      { $set: { available: true } }
    );
    ctx.status = 200
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

const markAsRead = async (ctx, next) => {
  console.log(ctx.request.body);
  try {
    await UserModel.findByIdAndUpdate(ctx.params.usr_id,
      { $pull:
        { messages: { _id: ctx.request.body._id } }
      });
    ctx.status = 200
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

const addUser = async (ctx, next) => {
  if ('POST' != ctx.method ) return await next();
  const userData = ctx.request.body;

  if (!userData.hasOwnProperty('name') ||
      !userData.hasOwnProperty('surname') ||
      !userData.hasOwnProperty('location') ||
      !userData.hasOwnProperty('telephone') ||
      !userData.hasOwnProperty('email') ||
      !userData.hasOwnProperty('password')) {
        ctx.status = 400;
        ctx.body = {
          errors: ['Missing information to save a new User']
        }
        return await next();
      }

  let user = await UserModel.findOne({'email': userData.email});

  if (user) {
    ctx.status = 400;
    ctx.body = {
      errors: ['There is already a User with this email']
    }
    return await next();
  }

  const encryptedPassword = await bcrypt.hash(userData.password, 10);

  user = {
    name: userData.name,
    surname: userData.surname,
    location: userData.location,
    telephone: userData.telephone,
    email: userData.email,
    password: encryptedPassword
  }

  try {
    const newUser = new UserModel(user);
    newUser.save();
    const token = jwt.sign({name: user.email}, jwt_secret);
    ctx.body = {
      email: userData.email,
      jwt_token: token
    }
    ctx.status = 200
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

const signIn = async (ctx, next) => {
  if ('GET' != ctx.method ) return await next();

  const authHeader = ctx.headers.authorization;
  if (!authHeader) throw new Error('No authorization header');

  const emailColonPassword = atob(authHeader.split('Basic ')[1]);
  const [email, password] = emailColonPassword.split(':');

  if (!email || !password) throw new Error('Bad Credentials');

  const user = await UserModel.findOne({'email': email});
  if (!user) throw new Error('Bad email or password');
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    ctx.status = 401;
    return;
  } else {
    ctx.status = 200;
    const token = jwt.sign({email: user.email}, jwt_secret);
    ctx.body = {
      email: user.email,
      jwt_token: token
    };
  }
}

module.exports = { getUsers, acceptAdoption, getUser, rejectAdoption, markAsRead, addUser, signIn }
