const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { v2: cloudinary } = require('cloudinary');
const c = require('../controllers/productController');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'store-products',
    allowed_formats: ['jpg','jpeg','png','webp'],
    public_id: (req, file) => 'prod-' + Date.now(),
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/',                    authenticateToken, c.getAll);
router.get('/barcode/:barcode',    authenticateToken, c.getByBarcode);
router.get('/:id',                 authenticateToken, c.getOne);
router.post('/',                   authenticateToken, authorizeRole(['superadmin','admin']), upload.single('image'), c.create);
router.put('/:id',                 authenticateToken, authorizeRole(['superadmin','admin']), upload.single('image'), c.update);
router.delete('/:id',              authenticateToken, authorizeRole(['superadmin','admin']), c.remove);

module.exports = router;
