"""Deterministic official form adapters. No network, AI, cookies or retries.
Caller owns robots, budgets, transport and response persistence. Known subjects
only; unsupported certificate/subject combinations fail explicitly.
"""
import json,re,urllib.parse,math
from html.parser import HTMLParser
from decimal import Decimal
TECHNION_URL='https://admissions.technion.ac.il/wp-content/plugins/technion-calculators/technion-calculators-sum.php'
TAU_BAGRUT_URL='https://ims.tau.ac.il/Md/calc/Bagrut_T.aspx'
TAU_SCORE_URL='https://go.tau.ac.il/graphql'
TECH_MAP={'מתמטיקה':('yMathematic','mathematic'),'אנגלית':('yEnglish','english'),'היסטוריה':('yHistory','history'),'אזרחות':('yEzrahut','ezrahut'),'תנ"ך':('yBible','bible'),'ספרות':('yHebrew_lit','hebrew_lit'),'הבעה עברית':('yHabaa','habaa')}
# Exact public option names independently inspected in calculator HTML.
TECH_ELECTIVES={'פיזיקה','מדעי המחשב','ביולוגיה','גיאוגרפיה','כימיה','מחשבת ישראל','עבודת גמר שברשימה','עבודת גמר שאינה ברשימה','מקצוע אחר שאינו ברשימה'}
TAU_MAP={'מתמטיקה':'014','אנגלית':'010','היסטוריה':'020','אזרחות':'063','תנ"ך':'001','ספרות':'004','הבעה עברית':'005','פיזיקה':'015','מדעי המחשב':'042','ביולוגיה':'017','גיאוגרפיה':'041','כימיה':'016','מחשבת ישראל':'021'}
class OracleParseError(ValueError):pass
class _Html(HTMLParser):
 def __init__(self):super().__init__();self.skip=0;self.text=[];self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,tag,attrs):
  if tag in ('script','style'):self.skip+=1
  if self.skip:return
  self.text.append(' ')
  if tag=='tr':self.row=[]
  if tag in ('td','th')and self.row is not None:self.cell=[]
 def handle_endtag(self,tag):
  if tag in ('script','style'):self.skip=max(0,self.skip-1);return
  if self.skip:return
  if tag in ('td','th')and self.cell is not None:
   self.row.append(' '.join(''.join(self.cell).split()));self.cell=None
  if tag=='tr'and self.row is not None:self.rows.append(self.row);self.row=None
  self.text.append(' ')
 def handle_data(self,data):
  if not self.skip:
   self.text.append(data)
   if self.cell is not None:self.cell.append(data)
 def plain(self):return ' '.join(''.join(self.text).split())
def _subjects(profile):
 if not isinstance(profile,dict):raise ValueError('Profile must be an object')
 # This adapter deliberately supports ordinary Israeli Hebrew-school exams.
 # External, foreign, project and alternative certificate rules need own maps.
 if profile.get('certificateType','israeli_standard')!='israeli_standard':raise ValueError('Unsupported certificate type')
 if profile.get('schoolSector','jewish_hebrew')!='jewish_hebrew':raise ValueError('Unsupported school sector')
 subjects=profile.get('bagrutSubjects')
 if not isinstance(subjects,list)or not subjects:raise ValueError('Missing bagrutSubjects array')
 psy=profile.get('psychometricGeneral')
 if type(psy)is not int or not 200<=psy<=800:raise ValueError('PsychometricGeneral must be integer200..800')
 seen=set();total=0
 for sub in subjects:
  if not isinstance(sub,dict)or not all(k in sub for k in ['name','units','grade']):raise ValueError('Incomplete subject')
  name=sub['name'];units=sub['units'];grade=sub['grade']
  if not isinstance(name,str)or not name.strip():raise ValueError('Invalid subject name')
  if name in seen:raise ValueError('Duplicate subject: '+name)
  seen.add(name)
  if type(units)is not int or not 1<=units<=5:raise ValueError('Unsupported subject units')
  if type(grade)not in (int,float)or not math.isfinite(grade)or not 0<=grade<=100:raise ValueError('Finite grade0..100 required')
  if sub.get('assessmentType','exam')!='exam':raise ValueError('Unsupported assessment type')
  total+=units
  yield sub
 if total<20:raise ValueError('Certificate must supply at least20actual units')

def _validate(profile,institution):
 subjects=list(_subjects(profile));minimum={'מתמטיקה':4 if institution=='technion'else 3,'אנגלית':4,'היסטוריה':2,'אזרחות':1,'הבעה עברית':2}
 if institution=='technion':minimum.update({'תנ"ך':2,'ספרות':2})
 by_name={s['name']:s for s in subjects}
 for name,units in minimum.items():
  sub=by_name.get(name)
  if sub is None or sub['units']<units or sub['grade']<=0:raise ValueError('Missing/unsupported mandatory subject:'+name)
 for key,name,part in [('mathUnits','מתמטיקה','units'),('mathGrade','מתמטיקה','grade'),('physicsUnits','פיזיקה','units'),('physicsGrade','פיזיקה','grade')]:
  if key in profile and profile[key]!=(by_name.get(name)or {}).get(part,0):raise ValueError('Conflicting profile override:'+key)
 return subjects

def technion_payload(profile):
 subjects=_validate(profile,'technion')
 data={'TC_URL':'https://admissions.technion.ac.il/wp-content/plugins/technion-calculators/','TC_CURRENT_URL':'admissions.technion.ac.il/calculator/','bagrot':'true','handesae':'false','academic':'false','mehinaAve':'false','arc':'arcNo','memuca':'sehem','psychometry':str(profile['psychometricGeneral'])}
 for u,g in TECH_MAP.values():data[u]='0';data[g]=''
 for u,g in [('yHebrew','hebrew'),('yArbicLang','arbicLang'),('yYediat','yediat'),('yDruze','druze'),('yArabHistory','arabHistory'),('yIsraelPhil','israelPhil')]:data[u]='0';data[g]=''
 for i in range(1,7):data['mikztootBhira_'+str(i)]='0';data['y'+str(i)]='0';data['G_'+str(i)]=''
 j=1
 for sub in subjects:
  if sub['name']in TECH_MAP:u,g=TECH_MAP[sub['name']];data[u]=str(sub['units']);data[g]=str(sub['grade'])
  elif sub['name']in TECH_ELECTIVES:
   if j>6:raise ValueError('Public form supports6elective rows')
   data['mikztootBhira_'+str(j)]=sub['name'];data['y'+str(j)]=str(sub['units']);data['G_'+str(j)]=str(sub['grade']);j+=1
  else:raise ValueError('Unsupported Technion subject: '+sub['name'])
 return data

def tau_bagrut_payload(profile):
 subjects=_validate(profile,'tau')
 data={}
 for code in TAU_MAP.values():data['yl'+code]='';data['tziun'+code]=''
 for sub in subjects:
  if sub['name']not in TAU_MAP:raise ValueError('Unsupported TAU subject: '+sub['name'])
  code=TAU_MAP[sub['name']];data['yl'+code]=str(sub['units']);data['tziun'+code]=str(sub['grade'])
 data['btncalc']='חישוב';return data

def tau_score_payload(profile,official_bagrut_average):
 subjects=_validate(profile,'tau');
 try:avg=Decimal(str(official_bagrut_average))
 except Exception as e:raise ValueError('Invalid official TAU average')from e
 if not avg.is_finite()or not Decimal(55)<=avg<=Decimal(117):raise ValueError('Official TAU score average must be55..117')
 reali=all(any(s['name']==name and s['units']==5 and s['grade']>=55 for s in subjects)for name in ['מתמטיקה','פיזיקה'])
 return {'query':'query getLastScore ($scoresData: JSON!) { getLastScore (scoresData: $scoresData) { body } }','variables':{'scoresData':{'prog':'calctziun','out':'json','reali10':int(reali),'psicho':profile['psychometricGeneral'],'bagrut':official_bagrut_average}}}

def _html(body):
 h=_Html();h.feed(body.decode('utf-8')if isinstance(body,bytes)else body);t=h.plain()
 if re.search('Request Rejected|Something went wrong|Access Denied|captcha',t,re.I):raise OracleParseError('Security/error response')
 return h,t

def _number(pattern,text):
 matches=re.findall(pattern,text)
 if len(matches)!=1:raise OracleParseError('Expected exactly1numeric output for '+pattern)
 return matches[0]

TECH_ECHO={'ספרות':'ספרות עברית','היסטוריה':'הסטוריה'}
TAU_ECHO={'היסטוריה':'הסטוריה/תע"י','מדעי המחשב':'מחשבים','ביולוגיה':'ביולוגיה, מדעי החיים'}
def _verify_subject_echo(h,profile,institution):
 subjects=_validate(profile,institution);aliases=TECH_ECHO if institution=='technion'else TAU_ECHO
 expected={aliases.get(sub['name'],sub['name']):(Decimal(sub['units']*(2 if institution=='technion'and sub['name']=='מתמטיקה'else 1)),Decimal(str(sub['grade'])))for sub in subjects}
 actual={}
 for row in h.rows:
  if len(row)!=5 or not re.fullmatch(r'\d+(?:\.\d+)?',row[1])or not re.fullmatch(r'\d+(?:\.\d+)?',row[2]):continue
  name=row[0]
  if name in actual:raise OracleParseError('Ambiguous duplicate subject echo:'+name)
  actual[name]=(Decimal(row[1]),Decimal(row[2]))
 if actual!=expected:raise OracleParseError('Subject echoes do not match requested profile')
 return subjects

def parse_technion(body,profile=None):
 h,t=_html(body)
 if profile is not None:
  _verify_subject_echo(h,profile,'technion')
  echoed=_number(r'ציון פסיכומטרי רב תחומי:\s*([0-9]+(?:\.[0-9]+)?)',t)
  if Decimal(echoed)!=Decimal(profile['psychometricGeneral']):raise OracleParseError('PET echo does not match requested profile')
 if 'חישוב ציון סכם לכל המסלולים'not in t or 'פרט לארכיטקטורה ולאדריכלות נוף'not in t:raise OracleParseError('Unexpected calculator route')
 avg=_number(r'ממוצע בגרות מיטבי:\s*([0-9]+(?:\.[0-9]+)?)',t);score=_number(r'הסכם לדיוני הקבלה הוא:\s*([0-9]+(?:\.[0-9]+)?)',t)
 included=False;num=Decimal(0);den=Decimal(0);rows=[]
 for row in h.rows:
  if len(row)==1 and 'מקצועות אשר נכנסו לממוצע'in row[0]:included=True;continue
  if len(row)==1 and 'מקצועות אשר לא נכנסו לממוצע'in row[0]:included=False
  if included and len(row)==5:
   try:u=Decimal(row[1]);g=Decimal(row[4]);num+=u*g;den+=u;rows.append({'name':row[0],'weightedUnits':row[1],'grade':row[2],'bonus':row[3],'adjustedGrade':row[4]})
   except Exception as e:raise OracleParseError('Invalid included subject row')from e
 if not rows or not den:raise OracleParseError('Missing included subject proof')
 return {'bagrutAverage':avg,'generalSekem':score,'intermediates':{'includedSubjects':rows,'weightedSum':str(num),'weightSum':str(den),'uncappedUnroundedAverage':str(num/den),'cappedUnroundedAverage':str(min(num/den,Decimal(119)))}}

def parse_tau_bagrut(body,profile=None):
 h,t=_html(body)
 if profile is not None:_verify_subject_echo(h,profile,'tau')
 if 'ממוצע בגרות מותאם-תוצאה'not in t:raise OracleParseError('Missing TAU result label')
 avg=_number(r'סך?ה"כ י\. לימוד\s*>>\s*\d+\s*([0-9]+(?:\.[0-9]+)?)',t)
 return {'bagrutAverage':avg}

def parse_tau_scores(body,profile=None,official_bagrut_average=None):
 try:data=json.loads(body);b=data['data']['getLastScore']['body']
 except Exception as e:raise OracleParseError('Malformed TAU score response')from e
 if data.get('errors'):raise OracleParseError('TAU GraphQL errors')
 mapping={'generalSekem':'hatama','managementSekem':'hatama_nihul','engineeringSekem':'hatama_handasa','exactSciencesSekem':'hatama_meduyakim','medicinePreliminary':'hatama_refua','bagrutAverage':'bagrut','psychometricGeneral':'psicho'};result={}
 for dest,source in mapping.items():
  v=b.get(source)
  if not isinstance(v,str)or not re.fullmatch(r'\d+(?:\.\d+)?',v):raise OracleParseError('Missing/invalid TAU field:'+source)
  result[dest]=v
 if profile is not None:
  if official_bagrut_average is None:raise OracleParseError('Official average required to bind TAU score response')
  payload=tau_score_payload(profile,official_bagrut_average)['variables']['scoresData']
  if Decimal(result['psychometricGeneral'])!=Decimal(profile['psychometricGeneral']):raise OracleParseError('TAU PET echo mismatch')
  if Decimal(result['bagrutAverage'])!=Decimal(str(official_bagrut_average)):raise OracleParseError('TAU average echo mismatch')
  increment=Decimal(10 if payload['reali10']else 0)
  for key in ['engineeringSekem','exactSciencesSekem']:
   if Decimal(result[key])!=Decimal(result['generalSekem'])+increment:raise OracleParseError('TAU reali10 variant mismatch')
 return result

def invoke(transport,route,profile,official_bagrut_average=None):
 """Optional caller-injected transport(url, body_bytes, content_type)->bytes.
 No transport is created here. Caller must enforce access and budgets.
 """
 if route=='technion':return parse_technion(transport(TECHNION_URL,urllib.parse.urlencode(technion_payload(profile)).encode(),'application/x-www-form-urlencoded'),profile=profile)
 if route=='tau_bagrut':return parse_tau_bagrut(transport(TAU_BAGRUT_URL,urllib.parse.urlencode(tau_bagrut_payload(profile)).encode(),'application/x-www-form-urlencoded'),profile=profile)
 if route=='tau_scores':return parse_tau_scores(transport(TAU_SCORE_URL,json.dumps(tau_score_payload(profile,official_bagrut_average)).encode(),'application/json'),profile=profile,official_bagrut_average=official_bagrut_average)
 raise ValueError('Unknown oracle route')
