(function(){
const AVATARS=[
'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop',
'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop',
'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&auto=format&fit=crop',
'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&auto=format&fit=crop',
'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=256&auto=format&fit=crop',
'https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=256&auto=format&fit=crop'
];
function apply(){
 const frame=document.getElementById('app-frame');
 if(!frame||!frame.contentDocument)return;
 const d=frame.contentDocument;
 const w=frame.contentWindow;
 if(d.getElementById('avatar-upgrade-style')) return;
 const style=d.createElement('style');
 style.id='avatar-upgrade-style';
 style.textContent=`
 .fh-avatar,.fh-mini,.profile-avatar,.header-avatar,.feed-avatar,.feed-post-avatar,.feed-cmt-avatar,.lb-avatar{
 background-size:cover!important;
 background-position:center!important;
 color:transparent!important;
 overflow:hidden;
 }
 .avatar-picker-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
 .avatar-choice{width:100%;aspect-ratio:1;border-radius:22px;border:2px solid rgba(255,255,255,.14);background-size:cover;background-position:center;box-shadow:0 10px 24px rgba(0,0,0,.18)}
 .avatar-choice.active{border-color:#b388ff;box-shadow:0 0 0 4px rgba(179,136,255,.18)}
 `;
 d.head.appendChild(style);
 
 function setAvatar(el,url){if(el)el.style.backgroundImage='url('+url+')';}
 const selected=localStorage.getItem('familyapp-avatar')||AVATARS[0];
 d.querySelectorAll('.fh-avatar,.profile-avatar,.header-avatar').forEach((el,i)=>setAvatar(el,AVATARS[i%AVATARS.length]));
 d.querySelectorAll('.fh-mini,.feed-avatar,.feed-post-avatar,.feed-cmt-avatar,.lb-avatar').forEach((el,i)=>setAvatar(el,AVATARS[(i+2)%AVATARS.length]));
 const main=d.querySelector('.fh-avatar');
 setAvatar(main,selected);
 
 const profile=d.getElementById('screen-profile')||d.querySelector('[data-screen="profile"]');
 if(profile&&!profile.querySelector('.avatar-picker-grid')){
   const wrap=d.createElement('div');
   wrap.style.padding='18px';
   wrap.innerHTML='<div style="color:white;font-weight:900;font-size:14px;letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px">Choose avatar</div><div class="avatar-picker-grid"></div>';
   const grid=wrap.querySelector('.avatar-picker-grid');
   AVATARS.forEach(function(url){
      const btn=d.createElement('button');
      btn.className='avatar-choice'+(url===selected?' active':'');
      btn.style.backgroundImage='url('+url+')';
      btn.onclick=function(){
        localStorage.setItem('familyapp-avatar',url);
        d.querySelectorAll('.avatar-choice').forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');
        setAvatar(main,url);
      };
      grid.appendChild(btn);
   });
   profile.appendChild(wrap);
 }
}
window.addEventListener('load',function(){setTimeout(apply,1200)});
})();