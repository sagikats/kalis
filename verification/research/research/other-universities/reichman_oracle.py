"""Pure public-form adapter. No network, cookies, scheduler or admission decisions.

The caller must GET the official form using the same cookie session used for POST,
respect robots/access controls/budget, record source hashes, and provide explicit
academic-year context because the calculator itself is undated.
"""
from html.parser import HTMLParser
from decimal import Decimal,InvalidOperation
import re,urllib.parse,hashlib
URL='https://www.runi.ac.il/bagrutexamscalculator/default.aspx'
ALIASES={'היסטוריה':'הסטוריה','פיזיקה':'פיסיקה','תנ״ך':'תנ"ך'}
REQUIRED={'מתמטיקה','אנגלית','הבעה עברית','הסטוריה','אזרחות'}
class OracleSchemaError(ValueError):pass
class Form(HTMLParser):
 def __init__(self):super().__init__();self.inputs=[];self.action=None;self.method=None
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='form' and d.get('id')=='firstDegreeLeadform':self.action=d.get('action');self.method=d.get('method')
  if t=='input':self.inputs.append(d)
def _number(value,low,high,label):
 if isinstance(value,bool):raise OracleSchemaError(f'{label}: boolean is not a score')
 try:n=Decimal(str(value))
 except InvalidOperation:raise OracleSchemaError(f'{label}: invalid number')
 if not n.is_finite() or n!=n.to_integral_value() or not low<=n<=high:raise OracleSchemaError(f'{label}: expected integer {low}..{high}')
 return str(int(n))
def _guard(html):
 if any(x in html.lower() for x in ['validate.perfdrive','rbzns','request rejected','captcha challenge','botmanager_support']):raise OracleSchemaError('Access challenge; stop rather than parse')
def _year(academic_year,calculator_year_status):
 if academic_year not in ('תשפ"ז','תשפ״ז'):raise OracleSchemaError('Only captured2026/27 context supported; academic year missing or changed')
 if calculator_year_status not in ('undated_with_2026_10_03_capture','undated_current_capture'):raise OracleSchemaError('Calculator has no year marker; explicit undated capture context required')
def _profile(profile):
 if not isinstance(profile,dict) or not isinstance(profile.get('bagrutSubjects'),list):raise OracleSchemaError('Missing canonical bagrutSubjects list')
 allowed={'bagrutSubjects','psychometricGeneral','psychometricQuant','psychometricVerbal','psychometricEnglish','certificateType','schoolSector','mathUnits','mathGrade','physicsUnits','physicsGrade'}
 if unknown:=set(profile)-allowed:raise OracleSchemaError('Unsupported profile flags/overrides:'+','.join(sorted(unknown)))
 if profile.get('certificateType','israeli_standard')!='israeli_standard':raise OracleSchemaError('Unsupported certificateType: only ordinary regular diploma mapped')
 if profile.get('schoolSector','jewish_hebrew')!='jewish_hebrew':raise OracleSchemaError('Unsupported schoolSector: only jewish_hebrew mapped')
 subjects={}
 for row in profile['bagrutSubjects']:
  if not isinstance(row,dict) or set(row)-{'name','units','grade','assessmentType'} or not all(k in row for k in ('name','units','grade')):raise OracleSchemaError('Incomplete or unsupported subject schema')
  if row.get('assessmentType','exam')!='exam':raise OracleSchemaError('Unsupported assessmentType')
  if not isinstance(row['name'],str):raise OracleSchemaError('Invalid subject name')
  name=ALIASES.get(row['name'],row['name'])
  if name in subjects:raise OracleSchemaError('Duplicate subject or alias:'+name)
  subjects[name]={'units':_number(row['units'],1,21,name+' units'),'grade':_number(row['grade'],1,100,name+' grade')}
 if missing:=REQUIRED-set(subjects):raise OracleSchemaError('Missing compulsory supplied subjects:'+','.join(sorted(missing)))
 if sum(int(x['units']) for x in subjects.values())<20:raise OracleSchemaError('Fewer than20 supplied units')
 for key,name,part in [('mathUnits','מתמטיקה','units'),('mathGrade','מתמטיקה','grade'),('physicsUnits','פיסיקה','units'),('physicsGrade','פיסיקה','grade')]:
  if key in profile and str(profile[key])!=(subjects.get(name)or{}).get(part,'0'):raise OracleSchemaError('Conflicting profile override:'+key)
 return subjects,_number(profile.get('psychometricGeneral'),200,800,'psychometricGeneral')
def build_payload(form_html,profile,*,academic_year,calculator_year_status):
 """Return URL/method/fields/body; caller owns cookies and network.

 profile: canonical {bagrutSubjects:[{name,units,grade}],psychometricGeneral,...}.
 Unknown subjects, duplicate aliases, missing compulsory input, missing state or a
 changed form schema raise; no silent dropping. Only ordinary regular diploma is
 implemented. Synthetic response oracle is not an admission verifier.
 """
 _year(academic_year,calculator_year_status);_guard(form_html)
 p=Form();p.feed(form_html)
 if p.action!='./default.aspx' or (p.method or '').lower()!='post':raise OracleSchemaError('Official form action/method changed')
 subjects,psy=_profile(profile)
 known={};fields={}
 for a in p.inputs:
  name=a.get('name','');typ=a.get('type','')
  if typ in ('hidden','radio') and (typ!='radio' or 'checked'in a):fields[name]=a.get('value','')
  if 'txt_'in name:fields[name]=''
  for suffix,prefix in [('_units','יחידות ב'),('_grade','ציון ב')]:
   if suffix in name and a.get('aria-label','').startswith(prefix):
    subject=a['aria-label'][len(prefix):];kind='units' if suffix=='_units' else 'grade';known.setdefault(subject,{})[kind]=name
 for hidden in ('__VIEWSTATE','__VIEWSTATEGENERATOR','__EVENTVALIDATION'):
  if not fields.get(hidden):raise OracleSchemaError('Missing public ASP.NET form state:'+hidden)
 for name,values in subjects.items():
  if name not in known or set(known[name])!={'units','grade'}:raise OracleSchemaError('Unknown/unmapped official subject:'+name)
  fields[known[name]['units']]=values['units'];fields[known[name]['grade']]=values['grade']
 required_names={'Calculator$btnCompute','Calculator$bagrutType','Calculator$hdnIsExternal','Calculator$txt_psycho_grade'}
 if not required_names<={a.get('name') for a in p.inputs}:raise OracleSchemaError('Official form names changed')
 fields.update({'Calculator$txt_psycho_grade':psy,'Calculator$btnCompute':'חשב','Calculator$bagrutType':'רגילה','Calculator$hdnIsExternal':'false'})
 return {'url':URL,'method':'POST','fields':fields,'body':urllib.parse.urlencode(fields).encode('utf-8'),'content_type':'application/x-www-form-urlencoded','academic_year_context':academic_year,'calculator_year_status':calculator_year_status,'subjects_entered':subjects,'psychometricGeneral':psy}
def parse_response(response_html,profile=None,*,academic_year,calculator_year_status,request_context=None):
 """Return exact display strings. No response psychometric echo exists.

 With profile, caller must provide request_context containing psychometricGeneral
 actually submitted and response_sha256 of the response received for that request.
 Caller owns authentic request/response association and request-hash persistence;
 this pure parser cannot authenticate network provenance or academic source year.
 """
 _year(academic_year,calculator_year_status);_guard(response_html)
 out={}
 for field,selector in [('bagrut_average_shown','lblAvg'),('score_shown','lblMetoam')]:
  m=re.findall(r'<span\b[^>]*\bid=["\']'+selector+r'["\'][^>]*>\s*([0-9]+(?:\.[0-9]+)?)\s*</span>',response_html)
  if len(m)!=1:raise OracleSchemaError('Missing/duplicate result selector:'+selector)
  out[field]=m[0]
 out.update(score_label='ציון מתואם (בגרות + פסיכומטרי)',average_label='ממוצע משוקלל',academic_year_context=academic_year,calculator_year_status=calculator_year_status,admission_decision=None)
 if profile is not None:
  subjects,psy=_profile(profile)
  if not isinstance(request_context,dict) or request_context.get('response_sha256')!=hashlib.sha256(response_html.encode('utf-8')).hexdigest():raise OracleSchemaError('Missing/mismatched request-response context')
  if _number(request_context.get('psychometricGeneral'),200,800,'submitted psychometricGeneral')!=psy:raise OracleSchemaError('Submitted psychometric differs from requested profile; response does not echo it')
  text=re.sub(r'<[^>]+>',' ',response_html);text=__import__('html').unescape(text);text=' '.join(text.split())
  for name,values in subjects.items():
   pattern=r'ציון ב'+re.escape(name)+r' - מקצוע (?:חובה|בחירה):\s*'+re.escape(values['grade'])+r'\s+ציון \+ בונוס\s+[0-9.]+\s+יחידות\s+'+re.escape(values['units'])+r'\b'
   if len(re.findall(pattern,text))!=1:raise OracleSchemaError('Returned subject missing/duplicate or values differ:'+name)
  out['psychometric_binding']='caller_recorded_request_context; no response echo'
 return out
