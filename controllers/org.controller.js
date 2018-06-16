const mongoose = require('mongoose');
const OrgModel = require('../models/org');
const PetModel = require('../models/pet');

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

exports.addOrg = async (ctx, next) => {
  try {
    const newOrg = new OrgModel(ctx.request.body);
    const dbResponse = await newOrg.save();
    ctx.status = 200
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

exports.adoptionRequest = async (ctx, next) => {
  try {
    await OrgModel.findByIdAndUpdate(
      ctx.request.body.org,
      { $push: { queries:
        {
          user: ctx.request.body.user,
          pet: ctx.request.body.pet
        }},
      }
    );
    await PetModel.findByIdAndUpdate(
      ctx.request.body.pet,
      { $set: { available: false } }
    );
    ctx.status = 200
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}
