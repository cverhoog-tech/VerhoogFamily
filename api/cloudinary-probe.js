module.exports = async function handler(req,res){
  if(req.method!=='GET'){res.status(405).json({ok:false});return;}
  try{
    const form=new FormData();
    form.append('file','data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
    form.append('upload_preset','ml_default');
    form.append('public_id','familyapp/probe/unsigned-capability-'+Date.now());
    form.append('tags','familyapp-probe');
    const r=await fetch('https://api.cloudinary.com/v1_1/rg86slp4/image/upload',{method:'POST',body:form});
    const text=await r.text();
    let data={};try{data=JSON.parse(text);}catch(e){}
    res.status(r.ok?200:502).json({ok:r.ok,status:r.status,error:data&&data.error&&data.error.message||null,assetId:data.asset_id||null,publicId:data.public_id||null,secureUrl:data.secure_url||null});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
};
