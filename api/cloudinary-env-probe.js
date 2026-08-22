module.exports=function handler(req,res){
  if(req.method!=='GET'){res.status(405).json({ok:false});return;}
  res.status(200).json({
    ok:true,
    cloudName:!!(process.env.CLOUDINARY_CLOUD_NAME||process.env.CLOUDINARY_URL),
    apiKey:!!(process.env.CLOUDINARY_API_KEY||process.env.CLOUDINARY_URL),
    apiSecret:!!(process.env.CLOUDINARY_API_SECRET||process.env.CLOUDINARY_URL)
  });
};
