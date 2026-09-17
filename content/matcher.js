/**
 * Intelligent Form Field Matcher & Autofill Engine
 * Enhanced with Deep Synonym Dictionaries, Roman Numeral Expansion, and Google Forms Support.
 */

(function () {
  'use strict';

  function normalizeCueText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[\*\:\(\)\[\]\/\-\,\.\?\_\'\"]/g, ' ')
      .replace(/\bclass\s+xii\b|\bclass\s+12th\b|\bclass\s+12\b|\bxii\b|\b12th\b|\bhsc\b|\bintermediate\b|\binter\b/gi, ' 12th ')
      .replace(/\bclass\s+x\b|\bclass\s+10th\b|\bclass\s+10\b|\bx\b|\b10th\b|\bssc\b|\bmatric\b|\bmatriculation\b/gi, ' 10th ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const FormMatcher = {
    fieldDefinitions: {
      firstName: {
        keys: ['first name', 'firstname', 'first_name', 'fname', 'given name', 'givenname', 'forename', 'first-name', 'candidate first name'],
        types: ['text'],
        regex: /(first.*name|fname|given.*name|^first$)/i,
        antiRegex: /(last.*name|middle.*name|company|employer|user.*name|father|mother)/i
      },
      lastName: {
        keys: ['last name', 'lastname', 'last_name', 'lname', 'surname', 'family name', 'familyname', 'last-name', 'candidate last name'],
        types: ['text'],
        regex: /(last.*name|lname|sur.*name|family.*name|^last$)/i,
        antiRegex: /(first.*name|middle.*name|company|employer|father|mother)/i
      },
      fullName: {
        keys: [
          'full name', 'fullname', 'your name', 'applicant name', 'candidate name', 'candidate_name',
          'legal name', 'complete name', 'name', 'full name as per aadhaar', 'name as per aadhaar',
          'name as per 10th', 'name as per matriculation', 'name as per marksheet', 'name as per aadhaar',
          'full name as per pan', 'name as per id', 'candidate full name', 'student name', 'name of candidate'
        ],
        types: ['text'],
        regex: /(full.*name|applicant.*name|candidate.*name|^name$|your.*name|legal.*name|as.*per.*aadhaar|name.*aadhaar|name.*candidate|student.*name)/i,
        antiRegex: /(first.*name|last.*name|middle.*name|company|user.*name|file.*name|domain.*name|father|mother|org|college.*name|institute.*name)/i
      },
      collegeEmail: {
        keys: [
          'college email id', 'college email', 'campus email id', 'campus email',
          'campus mail id', 'campus mail', 'institutional email id', 'institutional email',
          'institute email id', 'institute email', 'university email id', 'university email',
          'official email id', 'official email', 'college mail id', 'college mail',
          'manit email', 'manit email id', 'student email id', 'academic email', 'edu email'
        ],
        types: ['email', 'text'],
        regex: /(college.*email|campus.*email|institute.*email|university.*email|institutional.*email|official.*email|academic.*email|campus.*mail|college.*mail|manit.*email)/i
      },
      email: {
        keys: [
          'personal email id', 'personal email', 'personal mail id', 'personal mail',
          'email', 'e-mail', 'email id', 'email address', 'e-mail address', 'contact email',
          'candidate email', 'primary email', 'alternate email', 'alternate email id', 'gmail id',
          'google email', 'mail id', 'candidate email id'
        ],
        types: ['email', 'text'],
        regex: /(personal.*email|personal.*mail|e-?mail|email.*addr|primary.*email|^email$|^email.*id$)/i,
        antiRegex: /(college.*email|campus.*email|institute.*email|university.*email|confirm.*email|re-?enter.*email)/i
      },
      confirmEmail: {
        keys: ['confirm email', 'confirm e-mail', 're-enter email', 'verify email'],
        types: ['email', 'text'],
        regex: /(confirm.*e-?mail|re-?enter.*e-?mail|verify.*e-?mail)/i
      },
      phone: {
        keys: [
          'phone', 'mobile', 'cell', 'telephone', 'phone number', 'mobile number', 'mobile no',
          'contact number', 'contact no', 'cell phone', 'primary phone', 'tel', 'whatsapp number',
          'whatsapp no', 'calling number', 'primary contact', 'student contact number', 'mobile whatsapp number'
        ],
        types: ['tel', 'text', 'number'],
        regex: /(phone|mobile|cell.*phone|contact.*num|telephone|^tel$|mobile.*no|contact.*no|whatsapp)/i,
        antiRegex: /(emergency.*contact.*name|country.*code|alternate.*phone|father.*mobile|parent.*contact)/i
      },
      phoneCountryCode: {
        keys: ['country code', 'phone code', 'dial code', 'country dial code', 'isd code', 'isd'],
        types: ['text', 'select-one', 'number'],
        regex: /(country.*code|dial.*code|isd.*code)/i
      },
      linkedin: {
        keys: ['linkedin', 'linked-in', 'linkedin profile', 'linkedin url', 'linkedin link', 'linkedin.com', 'linkedin profile link'],
        types: ['url', 'text'],
        regex: /(linkedin|linked-in|linkedin\.com)/i
      },
      github: {
        keys: ['github', 'git hub', 'github profile', 'github url', 'github link', 'github.com', 'repo', 'repository url', 'github profile link'],
        types: ['url', 'text'],
        regex: /(github|git.*hub|github\.com)/i
      },
      portfolio: {
        keys: ['portfolio', 'portfolio url', 'portfolio website', 'personal website', 'website', 'homepage', 'web site', 'blog', 'personal site', 'portfolio link'],
        types: ['url', 'text'],
        regex: /(portfolio|personal.*web|homepage|^website$|personal.*link|blog.*url)/i,
        antiRegex: /(company.*web|linkedin|github|twitter)/i
      },
      twitter: {
        keys: ['twitter', 'twitter url', 'x url', 'x handle', 'twitter handle', 'x.com', 'twitter.com'],
        types: ['url', 'text'],
        regex: /(twitter|x\.com|twitter\.com|tweet)/i
      },
      addressLine1: {
        keys: ['address', 'address line 1', 'street address', 'street', 'line 1', 'address 1', 'billing address', 'residential address', 'permanent address', 'current address', 'home address', 'hostel address'],
        types: ['text'],
        regex: /(street.*addr|addr.*line.*1|address.*1|^address$|street|perm.*address|current.*address|residential.*addr)/i,
        antiRegex: /(line.*2|apartment|suite|email.*address|mac.*address)/i
      },
      addressLine2: {
        keys: ['address line 2', 'apartment', 'suite', 'unit', 'building', 'floor', 'apt', 'line 2', 'address 2'],
        types: ['text'],
        regex: /(addr.*line.*2|address.*2|apt|suite|unit|bldg|floor)/i
      },
      city: {
        keys: ['city', 'town', 'municipality', 'current city', 'suburb', 'location city', 'home city', 'native place', 'hometown', 'native city', 'district'],
        types: ['text', 'select-one'],
        regex: /(^city$|current.*city|town|municipality|native.*place|hometown|district)/i,
        antiRegex: /(ethnicity|electricity)/i
      },
      state: {
        keys: ['state', 'province', 'region', 'state/province', 'state / province', 'county', 'current state', 'home state'],
        types: ['text', 'select-one'],
        regex: /(^state$|province|region|state.*province|county|home.*state)/i,
        antiRegex: /(statement|status)/i
      },
      postalCode: {
        keys: ['zip', 'zipcode', 'zip code', 'postal code', 'postalcode', 'postcode', 'pin code', 'pincode', 'pin'],
        types: ['text', 'number'],
        regex: /(zip|postal.*code|postcode|pincode|pin.*code)/i
      },
      country: {
        keys: ['country', 'nation', 'country of residence', 'current country', 'citizenship country', 'nationality'],
        types: ['text', 'select-one'],
        regex: /(^country$|current.*country|country.*residence|nationality)/i,
        antiRegex: /(country.*code)/i
      },
      schoolName: {
        keys: [
          'university', 'college', 'school', 'institution', 'institute', 'alma mater',
          'college / university', 'university / college', 'college name', 'name of college',
          'institute name', 'name of institution', 'university name', 'current college',
          'name of your college', 'college / institute', 'institute / college name', 'manit',
          'college institute', 'institution name', 'name of the college'
        ],
        types: ['text', 'select-one'],
        regex: /(university|college|school|institution|institute|alma.*mater|manit|name.*college|college.*name)/i,
        antiRegex: /(high.*school|elementary|school.*board|school.*name)/i
      },
      degreeLevel: {
        keys: ['degree level', 'highest education', 'level of education', 'highest degree', 'education level', 'degree type', 'course', 'degree program', 'eligible courses', 'qualifying degree'],
        types: ['text', 'select-one'],
        regex: /(degree.*level|highest.*edu|level.*edu|highest.*degree|degree.*type|^course$|eligible.*courses|qualifying.*degree)/i
      },
      degreeMajor: {
        keys: [
          'specialization', 'specialisation', 'branch', 'eligible branches', 'department', 'stream',
          'degree', 'major', 'field of study', 'discipline', 'course specialization',
          'degree / major', 'area of study', 'engineering branch', 'b.tech branch', 'btech branch'
        ],
        types: ['text', 'select-one', 'radio'],
        regex: /(specialization|specialisation|branch|discipline|stream|department|^major$|field.*study|^degree$|degree.*major|eligible.*branch)/i,
        antiRegex: /(degree.*level|college.*branch|bank.*branch)/i
      },
      rollNo: {
        keys: [
          'scholar number', 'scholar no', 'scholar id', 'roll number', 'roll no',
          'college roll no', 'university roll number', 'registration number', 'reg no',
          'reg number', 'registration no', 'enrollment number', 'enrollment no', 'enrollment',
          'usn', 'prn', 'student id', 'college id', 'university roll no', 'urn',
          'hall ticket no', 'admission no', 'institute roll no'
        ],
        types: ['text', 'number'],
        regex: /(scholar.*no|scholar.*num|scholar.*id|roll.*no|roll.*num|reg.*no|registration.*no|usn|prn|student.*id|enrollment.*no|urn)/i
      },
      tenthPercentage: {
        keys: [
          '10th', '10th percentage', '10th marks', '10th %', '10th score', '10th cgpa',
          'class 10', 'class 10th', 'class 10 %', 'class 10th percentage', 'class x',
          'x percentage', 'x marks', 'x %', 'tenth', 'tenth percentage', 'tenth marks',
          'ssc', 'ssc percentage', 'ssc marks', 'ssc %', 'matric', 'matriculation',
          'matriculation percentage', 'secondary percentage', '10th standard'
        ],
        types: ['text', 'number'],
        regex: /(10th.*(percent|mark|score|cgpa|grade)|class.*10.*(percent|mark|score)|ssc.*percent|matric.*percent|\bx.*(percent|mark)\b)/i,
        antiRegex: /(year|pass|completion)/i
      },
      tenthYear: {
        keys: [
          '10th pass year', '10th passing year', '10th year of passing', '10th completion year',
          'class 10 passing year', 'class 10th passing year', 'class 10 pass year',
          'ssc passing year', 'ssc pass year', 'matric passing year', 'class x passing year',
          '10th year', 'year of passing 10th', 'passing year 10th'
        ],
        types: ['text', 'number', 'select-one'],
        regex: /(10th.*(pass|grad|year|completion)|class.*10.*(pass|year)|ssc.*(pass|year)|matric.*(pass|year)|\bx.*(pass|year)\b)/i
      },
      twelfthPercentage: {
        keys: [
          '12th', '12th percentage', '12th marks', '12th %', '12th score', '12th cgpa',
          'class 12', 'class 12th', 'class 12 %', 'class 12th percentage', 'class xii',
          'xii percentage', 'xii marks', 'xii %', 'twelfth', 'twelfth percentage', 'twelfth marks',
          'hsc', 'hsc percentage', 'hsc marks', 'hsc %', 'intermediate', 'intermediate percentage',
          'inter', 'inter %', 'diploma', 'diploma percentage', 'diploma marks', 'diploma %',
          'higher secondary', 'senior secondary', '12th standard'
        ],
        types: ['text', 'number'],
        regex: /(12th.*(percent|mark|score|cgpa|grade)|class.*12.*(percent|mark|score)|hsc.*percent|diploma.*percent|inter.*percent|\bxii.*(percent|mark)\b)/i,
        antiRegex: /(year|pass|completion)/i
      },
      twelfthYear: {
        keys: [
          '12th pass year', '12th passing year', '12th year of passing', '12th completion year',
          'class 12 passing year', 'class 12th passing year', 'class 12 pass year',
          'hsc passing year', 'hsc pass year', 'intermediate passing year', 'inter passing year',
          'diploma passing year', 'class xii passing year', '12th year', 'year of passing 12th',
          'passing year 12th'
        ],
        types: ['text', 'number', 'select-one'],
        regex: /(12th.*(pass|grad|year|completion)|class.*12.*(pass|year)|hsc.*(pass|year)|diploma.*(pass|year)|inter.*(pass|year)|\bxii.*(pass|year)\b)/i
      },
      gpa: {
        keys: [
          'gpa', 'cgpa', 'grade', 'percentage', 'marks', 'score', 'grades / marks',
          'gpa / percentage', 'b.tech cgpa', 'b.tech %', 'b.tech percentage',
          'graduation cgpa', 'graduation percentage', 'graduation %', 'ug cgpa', 'ug percentage',
          'aggregate cgpa', 'aggregate percentage', 'current cgpa', 'current percentage',
          'overall cgpa', 'cgpa / percentage', 'engineering cgpa', 'cumulative gpa',
          'cgpa out of 10', 'marks scored in b.tech'
        ],
        types: ['text', 'number'],
        regex: /(^gpa$|^cgpa$|grade.*point|academic.*score|percentage|b\.?tech.*cgpa|grad.*cgpa|ug.*cgpa|aggregate|current.*cgpa)/i,
        antiRegex: /(10th|12th|ssc|hsc|tenth|twelfth|matric|diploma|\bx\b|\bxii\b)/i
      },
      graduationYear: {
        keys: ['graduation year', 'grad year', 'year of completion', 'year of passing', 'end year', 'expected graduation', 'completion year', 'passing year', 'batch', 'year of graduation', 'batch of', 'graduating year'],
        types: ['text', 'number', 'select-one'],
        regex: /(grad.*year|year.*pass|completion.*year|end.*year|expected.*grad|^batch$|passing.*year)/i
      },
      startYear: {
        keys: ['start year', 'admission year', 'commencement year', 'joined year', 'year of joining', 'joining year'],
        types: ['text', 'number', 'select-one'],
        regex: /(start.*year|admission.*year|commence.*year|joined.*year|joining.*year)/i
      },
      backlogs: {
        keys: ['active backlogs', 'history of backlogs', 'any active backlogs', 'backlogs', 'number of active backlogs', 'number of backlogs', 'standing arrears', 'backlogs if any', 'arrears', 'current backlogs', 'live backlogs'],
        types: ['text', 'number', 'select-one', 'radio'],
        regex: /(backlog|arrear)/i
      },
      dob: {
        keys: ['date of birth', 'dob', 'birth date', 'birthdate', 'd.o.b', 'd o b'],
        types: ['text', 'date'],
        regex: /(date.*birth|^dob$|birth.*date)/i
      },
      gender: {
        keys: ['gender', 'sex', 'gender identity'],
        types: ['select-one', 'radio', 'text'],
        regex: /(^gender$|^sex$|gender.*identity)/i
      },
      currentTitle: {
        keys: ['current title', 'job title', 'current job title', 'current role', 'title', 'headline', 'designation', 'current position'],
        types: ['text'],
        regex: /(current.*title|job.*title|current.*role|current.*designation|current.*pos)/i,
        antiRegex: /(salutation|prefix)/i
      },
      currentCompany: {
        keys: ['current company', 'company', 'current employer', 'employer', 'organization', 'company name', 'present employer'],
        types: ['text'],
        regex: /(current.*company|current.*employer|present.*company|employer|organization.*name)/i
      },
      totalYearsExp: {
        keys: ['years of experience', 'total experience', 'experience (years)', 'total work experience', 'yoe', 'years experience', 'experience in years'],
        types: ['number', 'text', 'select-one'],
        regex: /(years.*exp|total.*exp|yoe|work.*exp.*years)/i
      },
      noticePeriodDays: {
        keys: ['notice period', 'notice period (days)', 'notice period in days', 'notice period (months)', 'how soon can you join', 'availability', 'joining time', 'notice period if any'],
        types: ['text', 'number', 'select-one'],
        regex: /(notice.*period|how.*soon.*join|availability.*days|joining.*time)/i
      },
      currentCTC: {
        keys: ['current ctc', 'current salary', 'present ctc', 'present salary', 'current compensation', 'current annual salary'],
        types: ['text', 'number'],
        regex: /(current.*ctc|current.*salary|present.*ctc|current.*comp)/i
      },
      expectedCTC: {
        keys: ['expected ctc', 'expected salary', 'desired salary', 'desired compensation', 'salary expectations', 'expected compensation', 'target compensation', 'ctc expectation'],
        types: ['text', 'number'],
        regex: /(expected.*ctc|expected.*salary|desired.*salary|salary.*expect|desired.*comp)/i
      },
      authorizedInCountry: {
        keys: ['legally authorized to work', 'work authorization', 'authorized to work in', 'are you legally authorized', 'eligible to work', 'work permit'],
        types: ['select-one', 'radio', 'text'],
        regex: /(authorized.*work|work.*auth|eligible.*work|legal.*right.*work)/i
      },
      requireVisaSponsorship: {
        keys: ['require visa sponsorship', 'require sponsorship', 'will you now or in the future require sponsorship', 'visa sponsorship needed', 'need sponsorship'],
        types: ['select-one', 'radio', 'text'],
        regex: /(sponsorship.*future|require.*sponsor|visa.*sponsor|need.*visa)/i
      },
      relocate: {
        keys: ['willing to relocate', 'open to relocation', 'relocation', 'can you relocate', 'job location', 'preferred location', 'pan india'],
        types: ['select-one', 'radio', 'text'],
        regex: /(relocat|job.*location|preferred.*location)/i
      }
    },

    /**
     * Extracts all identifiable cues from an element with normalized and raw text
     */
    extractElementMetadata(el) {
      const cues = [];
      const tag = el.tagName.toLowerCase();
      const type = (el.type || el.getAttribute('role') || '').toLowerCase();
      const name = (el.name || el.getAttribute('jsname') || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const placeholder = (el.placeholder || '').toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
      const title = (el.getAttribute('title') || '').toLowerCase();
      const testId = (el.getAttribute('data-testid') || el.getAttribute('data-qa') || el.getAttribute('data-automation-id') || '').toLowerCase();

      function addCue(source, rawText, weight = 1.0) {
        if (!rawText) return;
        const clean = rawText.trim().toLowerCase();
        if (!clean || clean === 'your answer' || clean === 'other:' || clean === 'off') return;
        const norm = normalizeCueText(clean);
        cues.push({ source, text: clean, normText: norm, weight });
      }

      // Explicit attributes
      if (name) addCue('name', name, 1.0);
      if (id) addCue('id', id, 1.0);
      if (placeholder) addCue('placeholder', placeholder, 0.95);
      if (ariaLabel) addCue('aria-label', ariaLabel, 1.0);
      if (autocomplete) addCue('autocomplete', autocomplete, 1.2);
      if (title) addCue('title', title, 0.8);
      if (testId) addCue('testid', testId, 0.9);

      // Check linked label <label for="id">
      if (el.id) {
        try {
          const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          if (label && label.innerText) {
            addCue('label-for', label.innerText, 1.3);
          }
        } catch (e) {}
      }

      // Check aria-labelledby (handles multi-ID in Google Forms like aria-labelledby="i1 i4")
      if (ariaLabelledBy) {
        const ids = ariaLabelledBy.split(/\s+/).filter(Boolean);
        for (const singleId of ids) {
          try {
            const labelledEl = document.getElementById(singleId);
            if (labelledEl && labelledEl.innerText) {
              addCue('aria-labelledby', labelledEl.innerText, 1.4);
            }
          } catch (e) {}
        }
      }

      // Check enclosing <label>
      const parentLabel = el.closest('label');
      if (parentLabel && parentLabel.innerText) {
        addCue('parent-label', parentLabel.innerText, 1.1);
      }

      // Check Google Forms / ATS Item Container Heading
      const questionCard = el.closest('[role="listitem"], [role="radiogroup"], .Qr7Oae, .geS5n, [jsmodel], [data-item-id], .freebirdFormviewerViewNumberedItemContainer, .form-group, .form-row, .field, [class*="question"], fieldset');
      if (questionCard) {
        const header = questionCard.querySelector('[role="heading"], .M7eMe, .HoPnL, legend, .exportItemTitle, [class*="title"], [class*="header"], [class*="label"], h2, h3, h4, h5');
        if (header && header.innerText) {
          addCue('question-header', header.innerText, 1.6);
        }
      }

      // Preceding sibling text or label
      let prev = el.previousElementSibling;
      while (prev) {
        if (prev.matches('label, span, p, div, strong, b, h3, h4') && prev.innerText) {
          addCue('prev-sibling', prev.innerText, 0.8);
          break;
        }
        prev = prev.previousElementSibling;
      }

      return {
        element: el,
        tag,
        type,
        cues
      };
    },

    /**
     * Score a field key against the extracted element cues with fuzzy & normalized token matching
     */
    matchFieldType(meta) {
      let bestField = null;
      let highestScore = 0;

      const combinedText = meta.cues.map(c => `${c.text} ${c.normText}`).join(' ');

      for (const [fieldName, def] of Object.entries(this.fieldDefinitions)) {
        let score = 0;

        // Check negative regex filter first
        if (def.antiRegex && def.antiRegex.test(combinedText)) {
          continue;
        }

        // Regex check on both raw and normalized cue texts
        if (def.regex) {
          for (const cue of meta.cues) {
            if (def.regex.test(cue.text) || def.regex.test(cue.normText)) {
              score += 1.2 * (cue.weight || 1.0);
            }
          }
        }

        // Direct key / normalized substring match
        for (const cue of meta.cues) {
          for (const key of def.keys) {
            const normKey = normalizeCueText(key);
            if (cue.text === key || cue.normText === normKey) {
              score += 2.0 * (cue.weight || 1.0);
            } else if (cue.normText.includes(normKey) || (normKey.length > 3 && cue.text.includes(key))) {
              score += 1.0 * (cue.weight || 1.0);
            }
          }
        }

        // Autocomplete standard mapping
        const autoCue = meta.cues.find(c => c.source === 'autocomplete');
        if (autoCue) {
          if (fieldName === 'firstName' && autoCue.text.includes('given-name')) score += 3.0;
          if (fieldName === 'lastName' && autoCue.text.includes('family-name')) score += 3.0;
          if (fieldName === 'fullName' && autoCue.text === 'name') score += 3.0;
          if (fieldName === 'email' && autoCue.text.includes('email')) score += 3.0;
          if (fieldName === 'phone' && autoCue.text.includes('tel')) score += 3.0;
          if (fieldName === 'addressLine1' && autoCue.text.includes('address-line1')) score += 3.0;
          if (fieldName === 'city' && autoCue.text.includes('address-level2')) score += 3.0;
          if (fieldName === 'state' && autoCue.text.includes('address-level1')) score += 3.0;
          if (fieldName === 'postalCode' && autoCue.text.includes('postal-code')) score += 3.0;
          if (fieldName === 'country' && autoCue.text.includes('country')) score += 3.0;
        }

        // Type matching boost
        if (def.types.includes(meta.type) || def.types.includes(meta.tag)) {
          score += 0.2;
        }

        if (score > highestScore && score >= 0.75) {
          highestScore = score;
          bestField = fieldName;
        }
      }

      return {
        field: bestField,
        score: highestScore
      };
    },

    /**
     * Dispatches native events and triggers React/Vue/Angular/Google Forms property setters
     */
    setNativeValue(element, value) {
      if (!element || value === undefined || value === null) return false;

      const strValue = String(value);

      if (element.tagName.toLowerCase() === 'select') {
        return this.setSelectValue(element, strValue);
      }

      if (element.type === 'checkbox') {
        const shouldCheck = ['true', 'yes', '1', 'y'].includes(strValue.toLowerCase());
        element.checked = shouldCheck;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      if (element.type === 'radio') {
        return true;
      }

      // 1. Focus element and simulate real user click/focus
      element.focus();
      try {
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      } catch (e) {}

      // 2. Select existing text and use execCommand for native browser input pipeline
      try {
        if (element.select) element.select();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, strValue);
      } catch (e) {}

      // 3. Fallback / Direct Prototype Descriptor Setter
      let prototype = HTMLInputElement.prototype;
      if (element.tagName.toLowerCase() === 'textarea') {
        prototype = HTMLTextAreaElement.prototype;
      }

      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, strValue);
      } else {
        element.value = strValue;
      }

      // 4. Set direct HTML attributes
      element.setAttribute('value', strValue);
      element.setAttribute('data-initial-value', strValue);
      element.setAttribute('badinput', 'false');
      element.setAttribute('aria-invalid', 'false');

      // 5. Deep Google Forms DOM repair & label overlap removal
      const rFrNMe = element.closest('.rFrNMe, [jscontroller], .z3vRcc, [jsname="oJeWuf"]');
      if (rFrNMe) {
        rFrNMe.classList.add('CDELRd', 'k310eb', 'F2Pmsd');
        rFrNMe.classList.remove('k3FDgb', 'N0Fdjd', 'IS7Fhb');
        rFrNMe.setAttribute('aria-invalid', 'false');

        // Hide validation error message container for this specific field
        const errorBoxes = rFrNMe.querySelectorAll('.mIZA4c, .RHiN0e, .gubaFf, [role="alert"]');
        errorBoxes.forEach(box => {
          box.style.setProperty('display', 'none', 'important');
        });
      }

      // Hide ONLY the specific "Your answer" placeholder of THIS input container (never touch radio/checkbox labels)
      const inputWrapper = element.closest('.Xb9hP, .aCsPvd');
      if (inputWrapper) {
        const placeholders = inputWrapper.querySelectorAll('.AxOyFc, .snByac, .nd91id, [jsname="V67aGc"]');
        placeholders.forEach(pl => {
          // Strict safeguard: Never touch radio or checkbox option labels
          if (pl.closest('[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledContainer, [role="radiogroup"]')) {
            return;
          }
          const text = (pl.innerText || pl.textContent || '').trim().toLowerCase();
          if (text === 'your answer' || text === 'your text' || text === '') {
            pl.style.setProperty('display', 'none', 'important');
            pl.style.setProperty('opacity', '0', 'important');
            pl.style.setProperty('visibility', 'hidden', 'important');
          }
        });
      }

      // 6. Dispatch realistic synthetic event chain
      try {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', bubbles: true, composed: true }));
        element.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true,
          composed: true,
          cancelable: true,
          data: strValue,
          inputType: 'insertText'
        }));
        element.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          composed: true,
          cancelable: true,
          data: strValue,
          inputType: 'insertText'
        }));
      } catch (e) {}

      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA', bubbles: true, composed: true }));
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));

      return true;
    },

    /**
     * Intelligently selects dropdown option by text or value similarity
     */
    setSelectValue(selectEl, targetValue) {
      if (!selectEl || !selectEl.options || selectEl.options.length === 0) return false;

      const target = targetValue.toLowerCase().trim();
      let bestIndex = -1;
      let maxScore = 0;

      for (let i = 0; i < selectEl.options.length; i++) {
        const opt = selectEl.options[i];
        const text = (opt.text || '').toLowerCase().trim();
        const val = (opt.value || '').toLowerCase().trim();

        if (!text && !val) continue;

        if (text === target || val === target) {
          bestIndex = i;
          break;
        }

        let score = 0;
        if (text.includes(target) || target.includes(text)) score += 0.8;
        if (val.includes(target) || target.includes(val)) score += 0.7;

        if (['yes', 'true', 'authorized', 'y'].includes(target) && ['yes', 'y', 'true', '1', 'authorized'].includes(val)) score += 0.95;
        if (['no', 'false', 'none', 'n'].includes(target) && ['no', 'n', 'false', '0', 'none'].includes(val)) score += 0.95;

        if (score > maxScore) {
          maxScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex !== -1) {
        selectEl.selectedIndex = bestIndex;
        selectEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        selectEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        return true;
      }

      return false;
    },

    /**
     * Resolves Radio button choice given standard inputs or Google Forms div[role="radio"]
     */
    fillRadioGroup(radios, targetValue) {
      if (!radios || radios.length === 0 || !targetValue) return false;

      const target = String(targetValue).toLowerCase().trim();

      for (const radio of radios) {
        const val = (radio.value || radio.getAttribute('data-value') || '').toLowerCase().trim();
        let labelText = '';

        if (radio.id) {
          const label = document.querySelector(`label[for="${CSS.escape(radio.id)}"]`);
          if (label) labelText = label.innerText.toLowerCase().trim();
        }
        if (!labelText) {
          const parentLabel = radio.closest('label, [role="radio"], .docssharedWizToggleLabeledContainer');
          if (parentLabel) labelText = parentLabel.innerText.toLowerCase().trim();
        }

        const isMatch = val === target || labelText === target || labelText.includes(target) || target.includes(labelText) ||
          (['yes', 'true', '1'].includes(target) && ['yes', 'y', '1', 'true'].includes(val || labelText)) ||
          (['no', 'false', '0'].includes(target) && ['no', 'n', '0', 'false'].includes(val || labelText)) ||
          // Specialization mappings (Electrical, CSE, ECE, etc.)
          (target.includes('electric') && (labelText.includes('electric') || labelText === 'ee' || labelText === 'eee')) ||
          (target.includes('computer') && (labelText.includes('cse') || labelText.includes('computer'))) ||
          (target.includes('cse') && (labelText.includes('cse') || labelText.includes('computer'))) ||
          (target.includes('ece') && (labelText.includes('ece') || labelText.includes('electronics'))) ||
          (target.includes('mechanical') && (labelText.includes('mechanical') || labelText === 'me'));

        if (isMatch) {
          if (radio.click) {
            radio.click();
          } else {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            radio.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          }
          return true;
        }
      }

      return false;
    },

    /**
     * Scans and returns all fillable inputs on the document (including Google Forms & custom divs)
     */
    scanForms() {
      // 1. Scan standard text inputs & textareas
      const standardInputs = Array.from(document.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select'
      ));

      const matchedFields = [];
      const radioGroups = new Map();

      for (const el of standardInputs) {
        if (el.disabled || el.readOnly || (el.offsetParent === null && el.type !== 'radio')) {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
        }

        if (el.type === 'radio') {
          const groupName = el.name || 'unnamed_radio';
          if (!radioGroups.has(groupName)) {
            radioGroups.set(groupName, []);
          }
          radioGroups.get(groupName).push(el);
          continue;
        }

        const meta = this.extractElementMetadata(el);
        const match = this.matchFieldType(meta);

        if (match.field) {
          matchedFields.push({
            element: el,
            field: match.field,
            score: match.score,
            type: meta.type || meta.tag
          });
        }
      }

      // 2. Scan Google Forms Custom Radios (div[role="radiogroup"] / div[role="radio"])
      const customRadioGroups = document.querySelectorAll('[role="radiogroup"], .Qr7Oae:has([role="radio"]), div.geS5n:has([role="radio"])');
      for (const groupEl of customRadioGroups) {
        const radios = Array.from(groupEl.querySelectorAll('[role="radio"]'));
        if (radios.length === 0) continue;

        const firstRadio = radios[0];
        const meta = this.extractElementMetadata(groupEl);
        if (!meta.cues || meta.cues.length === 0) {
          meta.cues = this.extractElementMetadata(firstRadio).cues;
        }

        const match = this.matchFieldType(meta);
        if (match.field) {
          matchedFields.push({
            element: firstRadio,
            radios: radios,
            field: match.field,
            score: match.score,
            type: 'radio-group'
          });
        }
      }

      // 3. Process Standard Radio Groups
      for (const [groupName, radios] of radioGroups.entries()) {
        const firstRadio = radios[0];
        const meta = this.extractElementMetadata(firstRadio);
        const match = this.matchFieldType(meta);

        if (match.field) {
          matchedFields.push({
            element: firstRadio,
            radios: radios,
            field: match.field,
            score: match.score,
            type: 'radio-group'
          });
        }
      }

      return matchedFields;
    }
  };

  // Expose globally
  window.FormMatcher = FormMatcher;
})();
