const Router = require('koa-router');

const UserController = require('./controllers/user.controller');
const PetController = require('./controllers/pet.controller');
const OrgController = require('./controllers/org.controller');

const router = new Router();

router.get('/pets/:pet_id', PetController.getPet);
router.get('/pets', PetController.getPets);
router.post('/pets', PetController.addPet);

router.get('/orgs', OrgController.getOrgs);
router.get('/orgs/sign-in', OrgController.signIn);
router.get('/orgs/:org_id', OrgController.getOrg);
router.post('/orgs', OrgController.addOrg);
router.put('/orgs/:org_id', OrgController.adoptionRequest);

router.get('/users', UserController.getUsers);
router.get('/users/:usr_id', UserController.getUser);
router.put('/users/:usr_id/accepted', UserController.acceptAdoption);
router.put('/users/:usr_id/rejected', UserController.rejectAdoption);
router.put('/users/:usr_id/markAsRead', UserController.markAsRead);
router.post('/users', UserController.addUser);

// PENDING ROUTES
// router.put('/pets/:pet_id', PetController.editPet);
// router.delete('/pets/:pet_id', PetController.deletePet);

// router.put('/orgs/:org_id', OrgController.editOrg);
// router.put('/orgs/:org_id', OrgController.rejectResidence);
// router.delete('/orgs/:org_id', OrgController.deleteOrg);
// router.post('/orgs/:org_id/pets', OrgController.addPet);

// router.post('/users/:user_id/pets', PetController.addPet);
// router.put('/users/:user_id', UserController.editUser);
// router.put('/users/:user_id', UserController.applyForResidence);
// router.delete('/users/:user_id', UserController.deleteUser);

module.exports = router;
