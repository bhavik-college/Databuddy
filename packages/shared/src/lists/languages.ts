const languages: Record<string, string> = {
    'aa': 'Afar',
    'ab': 'Abkhazian',
    'ae': 'Avestan',
    'af': 'Afrikaans',
    'ak': 'Akan',
    'am': 'Amharic',
    'an': 'Aragonese',
    'ar': 'Arabic',
    'as': 'Assamese',
    'av': 'Avaric',
    'ay': 'Aymara',
    'az': 'Azerbaijani',
    'ba': 'Bashkir',
    'be': 'Belarusian',
    'bg': 'Bulgarian',
    'bi': 'Bislama',
    'bm': 'Bambara',
    'bn': 'Bengali',
    'bo': 'Tibetan',
    'br': 'Breton',
    'bs': 'Bosnian',
    'ca': 'Catalan',
    'ce': 'Chechen',
    'ch': 'Chamorro',
    'co': 'Corsican',
    'cr': 'Cree',
    'cs': 'Czech',
    'cu': 'Church Slavic',
    'cv': 'Chuvash',
    'cy': 'Welsh',
    'da': 'Danish',
    'de': 'German',
    'dv': 'Dhivehi',
    'dz': 'Dzongkha',
    'ee': 'Ewe',
    'el': 'Modern Greek (1453-)',
    'en': 'English',
    'eo': 'Esperanto',
    'es': 'Spanish',
    'et': 'Estonian',
    'eu': 'Basque',
    'fa': 'Persian',
    'ff': 'Fulah',
    'fi': 'Finnish',
    'fj': 'Fijian',
    'fo': 'Faroese',
    'fr': 'French',
    'fy': 'Western Frisian',
    'ga': 'Irish',
    'gd': 'Scottish Gaelic',
    'gl': 'Galician',
    'gn': 'Guarani',
    'gu': 'Gujarati',
    'gv': 'Manx',
    'ha': 'Hausa',
    'he': 'Hebrew',
    'hi': 'Hindi',
    'ho': 'Hiri Motu',
    'hr': 'Croatian',
    'ht': 'Haitian',
    'hu': 'Hungarian',
    'hy': 'Armenian',
    'hz': 'Herero',
    'ia': 'Interlingua (International Auxiliary Language Association)',
    'id': 'Indonesian',
    'ie': 'Interlingue',
    'ig': 'Igbo',
    'ii': 'Sichuan Yi',
    'ik': 'Inupiaq',
    'io': 'Ido',
    'is': 'Icelandic',
    'it': 'Italian',
    'iu': 'Inuktitut',
    'ja': 'Japanese',
    'jv': 'Javanese',
    'ka': 'Georgian',
    'kg': 'Kongo',
    'ki': 'Kikuyu',
    'kj': 'Kuanyama',
    'kk': 'Kazakh',
    'kl': 'Kalaallisut',
    'km': 'Khmer',
    'kn': 'Kannada',
    'ko': 'Korean',
    'kr': 'Kanuri',
    'ks': 'Kashmiri',
    'ku': 'Kurdish',
    'kv': 'Komi',
    'kw': 'Cornish',
    'ky': 'Kirghiz',
    'la': 'Latin',
    'lb': 'Luxembourgish',
    'lg': 'Ganda',
    'li': 'Limburgan',
    'ln': 'Lingala',
    'lo': 'Lao',
    'lt': 'Lithuanian',
    'lu': 'Luba-Katanga',
    'lv': 'Latvian',
    'mg': 'Malagasy',
    'mh': 'Marshallese',
    'mi': 'Maori',
    'mk': 'Macedonian',
    'ml': 'Malayalam',
    'mn': 'Mongolian',
    'mr': 'Marathi',
    'ms': 'Malay (macrolanguage)',
    'mt': 'Maltese',
    'my': 'Burmese',
    'na': 'Nauru',
    'nb': 'Norwegian Bokmål',
    'nd': 'North Ndebele',
    'ne': 'Nepali (macrolanguage)',
    'ng': 'Ndonga',
    'nl': 'Dutch',
    'nn': 'Norwegian Nynorsk',
    'no': 'Norwegian',
    'nr': 'South Ndebele',
    'nv': 'Navajo',
    'ny': 'Nyanja',
    'oc': 'Occitan (post 1500)',
    'oj': 'Ojibwa',
    'om': 'Oromo',
    'or': 'Oriya (macrolanguage)',
    'os': 'Ossetian',
    'pa': 'Panjabi',
    'pi': 'Pali',
    'pl': 'Polish',
    'ps': 'Pushto',
    'pt': 'Portuguese',
    'qu': 'Quechua',
    'rm': 'Romansh',
    'rn': 'Rundi',
    'ro': 'Romanian',
    'ru': 'Russian',
    'rw': 'Kinyarwanda',
    'sa': 'Sanskrit',
    'sc': 'Sardinian',
    'sd': 'Sindhi',
    'se': 'Northern Sami',
    'sg': 'Sango',
    'sh': 'Serbo-Croatian',
    'si': 'Sinhala',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'sm': 'Samoan',
    'sn': 'Shona',
    'so': 'Somali',
    'sq': 'Albanian',
    'sr': 'Serbian',
    'ss': 'Swati',
    'st': 'Southern Sotho',
    'su': 'Sundanese',
    'sv': 'Swedish',
    'sw': 'Swahili (macrolanguage)',
    'ta': 'Tamil',
    'te': 'Telugu',
    'tg': 'Tajik',
    'th': 'Thai',
    'ti': 'Tigrinya',
    'tk': 'Turkmen',
    'tl': 'Tagalog',
    'tn': 'Tswana',
    'to': 'Tonga (Tonga Islands)',
    'tr': 'Turkish',
    'ts': 'Tsonga',
    'tt': 'Tatar',
    'tw': 'Twi',
    'ty': 'Tahitian',
    'ug': 'Uighur',
    'uk': 'Ukrainian',
    'ur': 'Urdu',
    'uz': 'Uzbek',
    've': 'Venda',
    'vi': 'Vietnamese',
    'vo': 'Volapük',
    'wa': 'Walloon',
    'wo': 'Wolof',
    'xh': 'Xhosa',
    'yi': 'Yiddish',
    'yo': 'Yoruba',
    'za': 'Zhuang',
    'zh': 'Chinese',
    'zu': 'Zulu',
    
    // Regional variants for English
    'en-US': 'English (United States)',
    'en-GB': 'English (United Kingdom)',
    'en-CA': 'English (Canada)',
    'en-AU': 'English (Australia)',
    'en-NZ': 'English (New Zealand)',
    'en-ZA': 'English (South Africa)',
    'en-IE': 'English (Ireland)',
    'en-IN': 'English (India)',
    
    // Regional variants for Spanish
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    'es-AR': 'Spanish (Argentina)',
    'es-CO': 'Spanish (Colombia)',
    'es-VE': 'Spanish (Venezuela)',
    'es-PE': 'Spanish (Peru)',
    'es-CL': 'Spanish (Chile)',
    'es-UY': 'Spanish (Uruguay)',
    'es-BO': 'Spanish (Bolivia)',
    'es-EC': 'Spanish (Ecuador)',
    'es-PY': 'Spanish (Paraguay)',
    'es-CR': 'Spanish (Costa Rica)',
    'es-PA': 'Spanish (Panama)',
    'es-GT': 'Spanish (Guatemala)',
    'es-HN': 'Spanish (Honduras)',
    'es-NI': 'Spanish (Nicaragua)',
    'es-SV': 'Spanish (El Salvador)',
    'es-DO': 'Spanish (Dominican Republic)',
    'es-CU': 'Spanish (Cuba)',
    'es-PR': 'Spanish (Puerto Rico)',
    
    // Regional variants for French
    'fr-FR': 'French (France)',
    'fr-CA': 'French (Canada)',
    'fr-BE': 'French (Belgium)',
    'fr-CH': 'French (Switzerland)',
    'fr-LU': 'French (Luxembourg)',
    'fr-MC': 'French (Monaco)',
    
    // Regional variants for German
    'de-DE': 'German (Germany)',
    'de-AT': 'German (Austria)',
    'de-CH': 'German (Switzerland)',
    'de-LU': 'German (Luxembourg)',
    'de-BE': 'German (Belgium)',
    
    // Regional variants for Portuguese
    'pt-PT': 'Portuguese (Portugal)',
    'pt-BR': 'Portuguese (Brazil)',
    'pt-AO': 'Portuguese (Angola)',
    'pt-MZ': 'Portuguese (Mozambique)',
    
    // Regional variants for Chinese
    'zh-CN': 'Chinese (Simplified, China)',
    'zh-TW': 'Chinese (Traditional, Taiwan)',
    'zh-HK': 'Chinese (Traditional, Hong Kong)',
    'zh-SG': 'Chinese (Simplified, Singapore)',
    'zh-MO': 'Chinese (Traditional, Macao)',
    
    // Regional variants for Arabic
    'ar-SA': 'Arabic (Saudi Arabia)',
    'ar-EG': 'Arabic (Egypt)',
    'ar-DZ': 'Arabic (Algeria)',
    'ar-MA': 'Arabic (Morocco)',
    'ar-TN': 'Arabic (Tunisia)',
    'ar-JO': 'Arabic (Jordan)',
    'ar-LB': 'Arabic (Lebanon)',
    'ar-SY': 'Arabic (Syria)',
    'ar-IQ': 'Arabic (Iraq)',
    'ar-KW': 'Arabic (Kuwait)',
    'ar-AE': 'Arabic (United Arab Emirates)',
    'ar-QA': 'Arabic (Qatar)',
    'ar-BH': 'Arabic (Bahrain)',
    'ar-OM': 'Arabic (Oman)',
    'ar-YE': 'Arabic (Yemen)',
    
    // Regional variants for Italian
    'it-IT': 'Italian (Italy)',
    'it-CH': 'Italian (Switzerland)',
    'it-SM': 'Italian (San Marino)',
    'it-VA': 'Italian (Vatican City)',
    
    // Regional variants for Dutch
    'nl-NL': 'Dutch (Netherlands)',
    'nl-BE': 'Dutch (Belgium)',
    'nl-SR': 'Dutch (Suriname)',
    
    // Regional variants for Russian
    'ru-RU': 'Russian (Russia)',
    'ru-BY': 'Russian (Belarus)',
    'ru-KZ': 'Russian (Kazakhstan)',
    'ru-KG': 'Russian (Kyrgyzstan)',
    
    // Regional variants for Korean
    'ko-KR': 'Korean (South Korea)',
    'ko-KP': 'Korean (North Korea)',
    
    // Regional variants for Japanese
    'ja-JP': 'Japanese (Japan)',
    
    // Regional variants for Hindi
    'hi-IN': 'Hindi (India)',
    
    // Regional variants for Swedish
    'sv-SE': 'Swedish (Sweden)',
    'sv-FI': 'Swedish (Finland)',
    
    // Regional variants for Norwegian
    'nb-NO': 'Norwegian Bokmål (Norway)',
    'nn-NO': 'Norwegian Nynorsk (Norway)',
    'no-NO': 'Norwegian (Norway)',
    
    // Regional variants for Danish
    'da-DK': 'Danish (Denmark)',
    'da-GL': 'Danish (Greenland)',
    
    // Regional variants for Finnish
    'fi-FI': 'Finnish (Finland)',
    
    // Regional variants for Turkish
    'tr-TR': 'Turkish (Turkey)',
    'tr-CY': 'Turkish (Cyprus)',
    
    // Regional variants for Greek
    'el-GR': 'Greek (Greece)',
    'el-CY': 'Greek (Cyprus)',
    
    // Regional variants for Hebrew
    'he-IL': 'Hebrew (Israel)',
    
    // Regional variants for Thai
    'th-TH': 'Thai (Thailand)',
    
    // Regional variants for Vietnamese
    'vi-VN': 'Vietnamese (Vietnam)',
    
    // Regional variants for Indonesian
    'id-ID': 'Indonesian (Indonesia)',
    
    // Regional variants for Malay
    'ms-MY': 'Malay (Malaysia)',
    'ms-BN': 'Malay (Brunei)',
    'ms-SG': 'Malay (Singapore)',
    
    // Regional variants for Tagalog/Filipino
    'tl-PH': 'Tagalog (Philippines)',
    'fil-PH': 'Filipino (Philippines)',
    
    // Regional variants for Ukrainian
    'uk-UA': 'Ukrainian (Ukraine)',
    
    // Regional variants for Polish
    'pl-PL': 'Polish (Poland)',
    
    // Regional variants for Czech
    'cs-CZ': 'Czech (Czech Republic)',
    
    // Regional variants for Slovak
    'sk-SK': 'Slovak (Slovakia)',
    
    // Regional variants for Hungarian
    'hu-HU': 'Hungarian (Hungary)',
    
    // Regional variants for Romanian
    'ro-RO': 'Romanian (Romania)',
    'ro-MD': 'Romanian (Moldova)',
    
    // Regional variants for Bulgarian
    'bg-BG': 'Bulgarian (Bulgaria)',
    
    // Regional variants for Croatian
    'hr-HR': 'Croatian (Croatia)',
    'hr-BA': 'Croatian (Bosnia and Herzegovina)',
    
    // Regional variants for Serbian
    'sr-RS': 'Serbian (Serbia)',
    'sr-BA': 'Serbian (Bosnia and Herzegovina)',
    'sr-ME': 'Serbian (Montenegro)',
    'sr-Latn': 'Serbian (Latin script)',
    'sr-Cyrl': 'Serbian (Cyrillic script)',
    
    // Regional variants for Bosnian
    'bs-BA': 'Bosnian (Bosnia and Herzegovina)',
    
    // Regional variants for Slovenian
    'sl-SI': 'Slovenian (Slovenia)',
    
    // Regional variants for Macedonian
    'mk-MK': 'Macedonian (North Macedonia)',
    
    // Regional variants for Albanian
    'sq-AL': 'Albanian (Albania)',
    'sq-XK': 'Albanian (Kosovo)',
    'sq-MK': 'Albanian (North Macedonia)',
    
    // Regional variants for Lithuanian
    'lt-LT': 'Lithuanian (Lithuania)',
    
    // Regional variants for Latvian
    'lv-LV': 'Latvian (Latvia)',
    
    // Regional variants for Estonian
    'et-EE': 'Estonian (Estonia)',
    
    // Regional variants for Icelandic
    'is-IS': 'Icelandic (Iceland)',
    
    // Regional variants for Irish
    'ga-IE': 'Irish (Ireland)',
    
    // Regional variants for Welsh
    'cy-GB': 'Welsh (United Kingdom)',
    
    // Regional variants for Scottish Gaelic
    'gd-GB': 'Scottish Gaelic (United Kingdom)',
    
    // Regional variants for Catalan
    'ca-ES': 'Catalan (Spain)',
    'ca-AD': 'Catalan (Andorra)',
    'ca-FR': 'Catalan (France)',
    'ca-IT': 'Catalan (Italy)',
    
    // Regional variants for Basque
    'eu-ES': 'Basque (Spain)',
    'eu-FR': 'Basque (France)',
    
    // Regional variants for Galician
    'gl-ES': 'Galician (Spain)',
    
    // Regional variants for Maltese
    'mt-MT': 'Maltese (Malta)',
    
    // Additional Filipino language variant
    'fil': 'Filipino'
  };

/**
 * Get the display name for a language code.
 * Supports both simple language codes (e.g., 'en') and regional variants (e.g., 'en-US').
 * Falls back to the base language if the specific regional variant is not found.
 * 
 * @param code - Language code (ISO 639-1) or language-region code (BCP 47)
 * @returns Human-readable language name or 'Unknown' if not found
 * 
 * @example
 * getLanguageName('en-US') // 'English (United States)'
 * getLanguageName('en-XX') // 'English' (falls back to base language)
 * getLanguageName('en') // 'English'
 * getLanguageName('xyz') // 'Unknown'
 */
export const getLanguageName = (code: string): string => {
  // First, try to find an exact match
  if (languages[code]) {
    return languages[code];
  }
  
  // If no exact match and the code contains a hyphen (regional variant),
  // try to fall back to the base language
  if (code.includes('-')) {
    const baseLanguage = code.split('-')[0];
    if (languages[baseLanguage]) {
      return languages[baseLanguage];
    }
  }
  
  return 'Unknown';
};

/**
 * Get all available language codes (both base and regional variants)
 * @returns Array of all language codes
 */
export const getAvailableLanguageCodes = (): string[] => {
  return Object.keys(languages);
};

/**
 * Get all base language codes (without regional variants)
 * @returns Array of base language codes
 */
export const getBaseLanguageCodes = (): string[] => {
  return Object.keys(languages).filter(code => !code.includes('-'));
};

/**
 * Get all regional variants for a specific base language
 * @param baseLanguage - Base language code (e.g., 'en')
 * @returns Array of regional variant codes for the base language
 */
export const getRegionalVariants = (baseLanguage: string): string[] => {
  return Object.keys(languages).filter(code => 
    code.startsWith(`${baseLanguage}-`) && code !== baseLanguage
  );
};

/**
 * Check if a language code exists (exact match)
 * @param code - Language code to check
 * @returns True if the language code exists
 */
export const isValidLanguageCode = (code: string): boolean => {
  return code in languages;
};

/**
 * Check if a language is supported (including fallback to base language)
 * @param code - Language code to check
 * @returns True if the language is supported (directly or via fallback)
 */
export const isLanguageSupported = (code: string): boolean => {
  if (languages[code]) {
    return true;
  }
  
  if (code.includes('-')) {
    const baseLanguage = code.split('-')[0];
    return baseLanguage in languages;
  }
  
  return false;
};