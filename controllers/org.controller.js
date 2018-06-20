const mongoose = require('mongoose');
const OrgModel = require('../models/org');
const PetModel = require('../models/pet');
const UserModel = require('../models/user');

const bcrypt = require('bcrypt');
const atob = require('atob');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const jwt_secret = process.env.JWT_SECRET;

exports.getOrgs = async (ctx, next) => {
  try {
    ctx.body = await OrgModel.find()
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

exports.getOrg = async (ctx, next) => {
  // the method searches by Id or Name
  console.log('======>>>> inside getOrg');
  const id = ctx.params.org_id;
  const ObjectId = mongoose.Types.ObjectId;
  const objId = new ObjectId( (id.length < 12) ? '123456789012' : id )
  try {
    ctx.body = await OrgModel.findOne( { $or: [{'_id':objId}, {name: id}]}).populate('pets queries.user queries.pet')
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

exports.signIn = async (ctx, next) => {
  if ('GET' != ctx.method) return await next();

  const authHeader = ctx.headers.authorization;
  if (!authHeader) throw new Error('No authorization header');

  const nameColonPassword = atob(authHeader.split('Basic ')[1]);
  const [name, password] = nameColonPassword.split(':');

  console.log('Inside signIn, name:', name, 'password', password);

  if (!name || !password) throw new Error('Bad Credentials');

  const org = await OrgModel.findOne({ $or: [{'name': name},
                                    {'email': name}]});
  if (!org) throw new Error('Bad user or password');
  const match = await bcrypt.compare(password, org.password);

  if (!match) {
    ctx.status = 401;
    return;
  } else {
    ctx.status = 200;
    const token = jwt.sign({name: org.name}, jwt_secret);
    ctx.body = {
      name: org.name,
      id: org._id,
      jwt_token: token
    };
  }
}

exports.addOrg = async (ctx, next) => {
  if ('POST' != ctx.method ) return await next();
  const orgData = ctx.request.body;

  if (!orgData.hasOwnProperty('name') ||
      !orgData.hasOwnProperty('location') ||
      !orgData.hasOwnProperty('email') ||
      !orgData.hasOwnProperty('web') ||
      !orgData.hasOwnProperty('password')) {
        ctx.status = 400;
        ctx.body = {
          errors: ['Missing informatiopn to save a new Organitzation']
        }
        return await next();
      }

  let org = await OrgModel.findOne({ $or: [{'name': orgData.name},
                                    {'email': orgData.email}]});

  if (org) {
    ctx.status = 400;
    ctx.body = {
      errors: ['There is already a Organitzation with this name or email']
    }
    return await next();
  }

  const encryptedPassword = await bcrypt.hash(orgData.password, 10);

  org = {
    name: orgData.name,
    location: orgData.location,
    email: orgData.email,
    web: orgData.web,
    password: encryptedPassword
  }

  try {
    const newOrg = new OrgModel(org);
    const dbResponse = await newOrg.save();
    // console.log('addOrg dbResponse:',dbResponse);
    const token = jwt.sign({name: org.name}, jwt_secret);
    ctx.status = 200
    ctx.body = {
      name: orgData.name,
      id: dbResponse._id,
      jwt_token: token
    }
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

exports.adoptionRequest = async (ctx, next) => {
  try {
    const orgModelRes = await OrgModel.findByIdAndUpdate(
      ctx.request.body.org,
      { $push: { queries:
        {
          user: ctx.request.body.user,
          pet: ctx.request.body.pet
        }},
      }
    );
    console.log('     orgModelRes', orgModelRes);
    const petModelRes = await PetModel.findByIdAndUpdate(
      ctx.request.body.pet,
      { $set: { available: false } }
    );
    console.log('     petModelRes:', petModelRes);
    ctx.status = 200
  } catch(e) {
    console.log('catched error:', e);
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}
