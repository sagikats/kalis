// Bookmarklet Generator for Instant University Calculator AutoFill (Zero-Install)

export interface BookmarkletPayload {
	institutionId: string;
	institutionName: string;
	calculatorUrl: string;
	psychometricScore: number;
	targetSekem?: number;
	targetBagrutAverage?: number;
	subjects: Array<{
		name: string;
		units: number;
		grade: number;
	}>;
}

/**
 * Generates an executable, self-contained javascript: URI bookmarklet string
 * that runs directly in the user's browser on any university calculator page.
 */
export function generateUniversityBookmarklet(payload: BookmarkletPayload): string {
	const minifiedData = JSON.stringify({
		instId: payload.institutionId,
		instName: payload.institutionName,
		calcUrl: payload.calculatorUrl,
		psych: payload.psychometricScore || 0,
		sekem: payload.targetSekem ? Number(payload.targetSekem.toFixed(2)) : 0,
		avg: payload.targetBagrutAverage ? Number(payload.targetBagrutAverage.toFixed(2)) : 0,
		subs: (payload.subjects || []).map((s) => ({
			n: s.name,
			u: s.units,
			g: s.grade
		}))
	});

	// Minified self-executing bookmarklet script
	const script = `(function(){
var D=${minifiedData};
var loc=window.location.href;

function showBanner(msg,isSuccess){
  var old=document.getElementById('kalis-bm-banner');if(old)old.remove();
  var b=document.createElement('div');b.id='kalis-bm-banner';
  b.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999999;background:#FAF8F5;border:2px solid #3C3C3C;border-radius:16px;padding:12px 20px;box-shadow:0 10px 30px rgba(0,0,0,0.25);font-family:sans-serif;direction:rtl;text-align:right;display:flex;align-items:center;gap:12px;color:#222;font-size:13px;max-width:90vw;';
  b.innerHTML='<div style="width:32px;height:32px;background:#3C3C3C;border-radius:8px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;">🎓</div><div><div style="font-weight:bold;">מתקבלים // AutoFill</div><div style="font-size:11px;color:'+(isSuccess?'#15803d':'#666')+';margin-top:2px;">'+msg+'</div></div>';
  document.body.appendChild(b);
  setTimeout(function(){if(b&&b.parentNode)b.remove();},10000);
}

function setReactVal(el,val){
  if(!el)return;
  try{
    el.focus();
    var s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set;
    if(s)s.call(el,val);else el.value=val;
    el.dispatchEvent(new Event('input',{bubbles:true,composed:true}));
    el.dispatchEvent(new Event('change',{bubbles:true,composed:true}));
    el.dispatchEvent(new Event('blur',{bubbles:true,composed:true}));
    el.style.backgroundColor='#EBF4EE';el.style.borderColor='#22C55E';
  }catch(e){}
}

function setNative(el,val){
  if(!el)return;
  el.value=val;
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.dispatchEvent(new Event('blur',{bubbles:true}));
  el.style.backgroundColor='#EBF4EE';el.style.borderColor='#22C55E';
}

function setSelect(el,val){
  if(!el)return;
  var s=String(val);
  for(var i=0;i<el.options.length;i++){
    if(el.options[i].value===s||el.options[i].text.includes(s)){el.value=el.options[i].value;break;}
  }
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.style.backgroundColor='#EBF4EE';
}

// 1. TECHNION
if(loc.includes('technion.ac.il')){
  showBanner('מזין ציונים למחשבון הטכניון...',false);
  var r=document.getElementById('bagrotYes');if(r){r.checked=true;r.dispatchEvent(new Event('click',{bubbles:true}));r.dispatchEvent(new Event('change',{bubbles:true}));}
  var bf=document.getElementById('bagrotForm');if(bf)bf.style.display='block';
  setTimeout(function(){
    var subs=D.subs||[];
    var f=function(kw){return subs.find(function(s){return kw.some(function(k){return s.n.includes(k);});});};
    var eng=f(['אנגלית']);if(eng){setSelect(document.getElementById('yEnglish'),eng.u>=5?5:4);setNative(document.getElementById('english'),eng.g);}
    var mth=f(['מתמטיקה']);if(mth){setSelect(document.getElementById('yMathematic'),mth.u>=5?5:4);setNative(document.getElementById('mathematic'),mth.g);}
    var lit=f(['ספרות']);if(lit){setSelect(document.getElementById('yHebrew_lit'),lit.u);setNative(document.getElementById('hebrew_lit'),lit.g);}
    var bib=f(['תנך','תנ"ך']);if(bib){setSelect(document.getElementById('yBible'),bib.u);setNative(document.getElementById('bible'),bib.g);}
    var ezr=f(['אזרחות']);if(ezr){setSelect(document.getElementById('yEzrahut'),ezr.u);setNative(document.getElementById('ezrahut'),ezr.g);}
    var hab=f(['הבעה','לשון']);if(hab){setSelect(document.getElementById('yHabaa'),hab.u);setNative(document.getElementById('habaa'),hab.g);}
    var his=f(['היסטוריה']);if(his){setSelect(document.getElementById('yHistory'),his.u);setNative(document.getElementById('history'),his.g);}
    var mk=['אנגלית','מתמטיקה','ספרות','תנך','תנ"ך','אזרחות','הבעה','לשון','היסטוריה'];
    var elecs=subs.filter(function(s){return !mk.some(function(k){return s.n.includes(k);});});
    elecs.forEach(function(el,idx){
      var rIdx=idx+1;if(rIdx>6)return;
      var row=document.getElementById('bhira'+rIdx);if(row)row.style.display='table-row';
      var sel=document.getElementById('mikztootBhira_'+rIdx);
      if(sel){for(var i=0;i<sel.options.length;i++){if(sel.options[i].text.includes(el.n)||el.n.includes(sel.options[i].text)){sel.value=sel.options[i].value;sel.dispatchEvent(new Event('change',{bubbles:true}));break;}}}
      setSelect(document.getElementById('y'+rIdx),el.u);
      setNative(document.getElementById('G_'+rIdx),el.g);
    });
    if(D.psych>0){
      document.querySelectorAll('input[name="input_3"],#input_76_3,#input_72_3,#input_73_3').forEach(function(i){setNative(i,D.psych);});
    }
    if(D.avg>0){
      document.querySelectorAll('input[name="input_1"],#input_76_1,#input_72_1,#input_73_1').forEach(function(i){setNative(i,D.avg.toFixed(2));});
    }
    var cb=document.querySelector('#calc_bagrut,#btnCalc,button[type="submit"]');if(cb&&cb.click)cb.click();
    showBanner('✓ הוזנו בהצלחה כל ציוני הבגרות והפסיכומטרי בטכניון!',true);
  },400);
  return;
}

// 2. TEL AVIV UNIVERSITY (TAU)
if(loc.includes('tau.ac.il')){
  showBanner('מזין ממוצע בגרות ופסיכומטרי במחשבון תל אביב...',false);
  var inps=Array.from(document.querySelectorAll('input:not([type="hidden"])'));
  var bInp=null,pInp=null,chk=null;
  inps.forEach(function(i){
    var txt=(i.getAttribute('aria-label')||i.placeholder||i.name||i.parentElement?.textContent||'').toLowerCase();
    if(txt.includes('search')||txt.includes('חיפוש')||txt.includes('מה מעניין'))return;
    if(i.type==='checkbox'&&(txt.includes('פיזיקה')||txt.includes('מתמטיקה')||txt.includes('5 יחידות'))){chk=i;return;}
    if(txt.includes('פסיכומטרי')||txt.includes('רב תחומי')||txt.includes('psycho')){pInp=i;return;}
    if(txt.includes('ממוצע')||txt.includes('בגרות')||txt.includes('maturity')){bInp=i;return;}
  });
  if(!pInp||!bInp){
    var nums=inps.filter(function(i){return i.type!=='checkbox'&&i.type!=='submit';});
    nums.forEach(function(i){
      var mx=Number(i.getAttribute('max')||0),mn=Number(i.getAttribute('min')||0);
      if(!pInp&&(mx>=200||mn>=200))pInp=i;
      else if(!bInp&&((mx>0&&mx<=150)||(mn>0&&mn<=100)))bInp=i;
    });
    if(!bInp&&nums[0])bInp=nums[0];if(!pInp&&nums[1])pInp=nums[1];
  }
  if(bInp&&D.avg>0)setReactVal(bInp,D.avg.toFixed(1));
  if(pInp&&D.psych>0)setReactVal(pInp,D.psych);
  var has5m=D.subs.some(function(s){return s.n.includes('מתמטיקה')&&s.u>=5&&s.g>=55;});
  var has5p=D.subs.some(function(s){return s.n.includes('פיזיקה')&&s.u>=5&&s.g>=55;});
  if(chk&&has5m&&has5p){
    var cs=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'checked')?.set;
    if(cs)cs.call(chk,true);else chk.checked=true;
    chk.dispatchEvent(new Event('click',{bubbles:true,composed:true}));
    chk.dispatchEvent(new Event('change',{bubbles:true,composed:true}));
  }
  if(bInp)bInp.scrollIntoView({behavior:'smooth',block:'center'});
  var cBtns=Array.from(document.querySelectorAll('button,input[type="submit"],a.btn'));
  var cBtn=cBtns.find(function(b){var t=(b.textContent||b.value||'').trim();return t.includes('חישוב');});
  if(cBtn&&cBtn.click)setTimeout(function(){cBtn.click();},350);
  showBanner('✓ הוזנו בהצלחה: ממוצע בגרות '+(D.avg>0?D.avg.toFixed(1):'-')+' ופסיכומטרי '+D.psych+'!',true);
  return;
}

// 3. OTHER UNIVERSITIES (HUJI, BGU, BIU, Haifa, Ariel, Reichman)
var oldWidget=document.getElementById('kalis-bm-widget');if(oldWidget)oldWidget.remove();
var w=document.createElement('div');w.id='kalis-bm-widget';
w.style.cssText='position:fixed;bottom:20px;left:20px;z-index:9999999;background:#FAF8F5;border:2px solid #3C3C3C;border-radius:18px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);font-family:sans-serif;direction:rtl;text-align:right;width:310px;max-width:90vw;max-height:80vh;display:flex;flex-direction:column;color:#222;font-size:12px;';
var sRows=D.subs.map(function(s){
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 6px;background:#fff;border:1px solid #E5DFD4;border-radius:6px;margin-bottom:3px;font-size:11px;"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px;"><strong>'+s.n+'</strong> <span style="color:#666;">('+s.u+' יח״ל)</span></div><div style="display:flex;align-items:center;gap:6px;"><span style="font-weight:bold;">'+s.g+'</span><button onclick="navigator.clipboard.writeText(\\''+s.g+'\\');this.textContent=\\'✓\\';" style="background:#FAF8F5;border:1px solid #DDD7CC;border-radius:4px;padding:1px 5px;font-size:10px;cursor:pointer;">העתק</button></div></div>';
}).join('');
w.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E5DFD4;padding-bottom:6px;margin-bottom:8px;"><strong>🎓 סייען מתקבלים — '+D.instName+'</strong><button onclick="document.getElementById(\\'kalis-bm-widget\\').remove()" style="background:none;border:none;cursor:pointer;font-size:14px;color:#888;">✕</button></div><div style="display:flex;gap:6px;margin-bottom:8px;"><div style="flex:1;background:#fff;border:1px solid #E5DFD4;border-radius:8px;padding:4px;text-align:center;"><div style="font-size:9px;color:#666;font-weight:bold;">סכם צפוי</div><div style="font-size:14px;font-weight:bold;color:#15803d;">'+(D.sekem||'-')+'</div></div><div style="flex:1;background:#fff;border:1px solid #E5DFD4;border-radius:8px;padding:4px;text-align:center;"><div style="font-size:9px;color:#666;font-weight:bold;">פסיכומטרי יעד</div><div style="font-size:14px;font-weight:bold;">'+(D.psych||'ללא')+'</div></div><div style="flex:1;background:#fff;border:1px solid #E5DFD4;border-radius:8px;padding:4px;text-align:center;"><div style="font-size:9px;color:#666;font-weight:bold;">ממוצע בגרות</div><div style="font-size:14px;font-weight:bold;">'+(D.avg?D.avg.toFixed(1):'-')+'</div></div></div><button id="kalis-bm-auto" style="width:100%;padding:8px;background:#3C3C3C;color:#fff;border:none;border-radius:8px;font-weight:bold;font-size:11px;cursor:pointer;margin-bottom:6px;">⚡ הזן ציונים לשדות בעמוד</button><div style="flex:1;overflow-y:auto;max-height:160px;">'+sRows+'</div>';
document.body.appendChild(w);

document.getElementById('kalis-bm-auto').onclick=function(){
  var filled=0;
  var inps=Array.from(document.querySelectorAll('input:not([type="hidden"])'));
  inps.forEach(function(inp){
    var txt=((inp.name||'')+' '+(inp.id||'')+' '+(inp.placeholder||'')+' '+(inp.parentElement?.textContent||'')).toLowerCase();
    if(D.psych>0&&(txt.includes('פסיכומטרי')||txt.includes('psychometric')||txt.includes('סכם'))){setNative(inp,D.psych);filled++;}
    if(D.avg>0&&(txt.includes('ממוצע')||txt.includes('בגרות')||txt.includes('bagrut'))){setNative(inp,D.avg.toFixed(1));filled++;}
    D.subs.forEach(function(s){if(txt.includes(s.n.toLowerCase())){setNative(inp,s.g);filled++;}});
  });
  showBanner(filled>0?'✓ הוזנו בהצלחה '+filled+' שדות בטופס!':'לא זוהו שדות אוטומטית בעמוד זה. השתמש בהעתקה ברשימה.',filled>0);
};

// If clicked from Kalis itself, open the university calculator!
if(loc.includes('localhost')||loc.includes('mitkablim.co.il')){
  showBanner('פותח את מחשבון '+D.instName+' בלשונית חדשה... לחץ שוב על הסימנייה באתר שייפתח!',true);
  window.open(D.calcUrl,'_blank');
}
})();`;

	// Return formatted javascript: URL (encoded safely)
	return 'javascript:' + encodeURI(script.replace(/\n\s*/g, ''));
}
