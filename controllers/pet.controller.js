const mongoose = require('mongoose');
const PetModel = require('../models/pet');
const OrganizationModel = require('../models/org');
global.fetch = require('node-fetch');

exports.getPets = async (ctx, next) => {
  try {
    ctx.body = await PetModel.find()
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

exports.getPet = async (ctx, next) => {
  try {
    const id = ctx.params.pet_id
    ctx.body = await PetModel.findById(id).populate('organization')
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}

exports.addPet = async (ctx, next) => {
  try {
    console.log('=======>>>>> addPet ctx.request.body',ctx.request.body);
    const org_id = ctx.request.body.organization;
    const res = await fetch('https://dog.ceo/api/breeds/image/random')
    const data = await res.json();
    console.log('log before');
    console.log('data',data);
    console.log('log something');
    ctx.request.body.image = data.message;
    const newPet = new PetModel(ctx.request.body);
    newPet.save()
    const org = await OrganizationModel.findById(org_id);
    org.pets.push(newPet);
    org.save();
    ctx.status = 200
  } catch(e) {
    ctx.status = 400;
    ctx.body = {
      errors: [e.message]
    }
  }
}
